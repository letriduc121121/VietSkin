package com.vietskin.backend_springboot.modules.doctors.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.doctor_work_days.repository.DoctorWorkDayRepository;
import com.vietskin.backend_springboot.modules.doctor_work_days.repository.TimeSlotRepository;
import com.vietskin.backend_springboot.modules.doctors.dto.UpdateDoctorRequest;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorWorkDayRepository workDayRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentRepository appointmentRepository;
    private final ObjectMapper objectMapper;

    // Cấu hình slot giờ làm — giống NestJS
    private static final int SLOT_DURATION = 20; // phút
    private static final int WORK_START  = 8  * 60; // 08:00
    private static final int LUNCH_START = 12 * 60; // 12:00
    private static final int LUNCH_END   = 13 * 60; // 13:00
    private static final int WORK_END    = 17 * 60; // 17:00

    private List<String> generateDailySlots() {
        List<String> slots = new ArrayList<>();
        int cur = WORK_START;
        while (cur < WORK_END) {
            if (cur >= LUNCH_START && cur < LUNCH_END) { cur = LUNCH_END; continue; }
            String h = String.format("%02d", cur / 60);
            String m = String.format("%02d", cur % 60);
            slots.add(h + ":" + m);
            cur += SLOT_DURATION;
        }
        return slots; // 24 slots: 08:00-11:40, 13:00-16:40
    }

    // ── Public: danh sách bác sĩ active ─────────────────────
    @Cacheable("doctors")
    public List<Map<String, Object>> findAll() {
        return doctorRepository.findByActiveTrue().stream()
                .map(this::toMap)
                .toList();
    }

    // ── Admin: tất cả bác sĩ kể inactive ────────────────────
    @Cacheable("doctors_admin")
    public List<Map<String, Object>> findAllForAdmin() {
        return doctorRepository.findAll().stream()
                .sorted(Comparator.comparing(Doctor::getId))
                .map(this::toMap)
                .toList();
    }

    // ── Admin: bật/tắt trạng thái ───────────────────────────
    @Caching(evict = {
            @CacheEvict(value = "doctors", allEntries = true),
            @CacheEvict(value = "doctors_admin", allEntries = true),
            @CacheEvict(value = "doctor_profile", key = "#id")
    })
    public Map<String, Object> toggleActive(Integer id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bác sĩ không tồn tại"));
        doctor.setActive(!doctor.getActive());
        doctorRepository.save(doctor);
        return toMap(doctor);
    }

    // ── Public: chi tiết 1 bác sĩ ───────────────────────────
    @Cacheable(value = "doctor_profile", key = "#id")
    public Map<String, Object> findOne(Integer id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bác sĩ không tồn tại"));
        return toMap(doctor);
    }

    // ── Doctor: lấy hồ sơ theo userId ───────────────────────
    public Map<String, Object> findByUserId(Integer userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy hồ sơ bác sĩ"));
        return toMap(doctor);
    }

    // ── Doctor/Admin: cập nhật hồ sơ ────────────────────────
    @Caching(evict = {
            @CacheEvict(value = "doctors", allEntries = true),
            @CacheEvict(value = "doctors_admin", allEntries = true),
            @CacheEvict(value = "doctor_profile", key = "#id")
    })
    public Map<String, Object> update(Integer id, UpdateDoctorRequest req) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bác sĩ không tồn tại"));

        if (req.getSpecialty()       != null) doctor.setSpecialty(req.getSpecialty());
        if (req.getExperience()      != null) doctor.setExperience(req.getExperience());
        if (req.getDegree()          != null) doctor.setDegree(req.getDegree());
        if (req.getDescription()     != null) doctor.setDescription(req.getDescription());
        if (req.getConsultationFee() != null) doctor.setConsultationFee(req.getConsultationFee());
        if (req.getActive()          != null) doctor.setActive(req.getActive());
        if (req.getKeywords()        != null) {
            try {
                doctor.setKeywords(objectMapper.writeValueAsString(req.getKeywords()));
            } catch (Exception ignored) {}
        }

        doctorRepository.save(doctor);
        return toMap(doctor);
    }

    // ── Public: slot trống để đặt lịch (TTL ngắn 60s) ───────
    @Cacheable(value = "doctor_slots", key = "#doctorId + '_' + #date")
    public Map<String, Object> getAvailableSlots(Integer doctorId, String date) {
        LocalDate localDate = LocalDate.parse(date);

        // Bác sĩ có lịch làm ngày này không?
        var workDayOpt = workDayRepository.findByDoctorIdAndDate(doctorId, localDate);
        if (workDayOpt.isEmpty()) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("date", date);
            empty.put("slots", List.of());
            empty.put("workDay", null);
            return empty;
        }

        var workDay = workDayOpt.get();
        List<String> allSlots = generateDailySlots();

        // Slot đã được đặt (trừ cancelled/no_show)
        Set<String> bookedSet = new HashSet<>(
                appointmentRepository.findBookedSlots(doctorId, localDate)
        );

        // Slot bị chặn thủ công
        Set<String> blockedSet = new HashSet<>(
                timeSlotRepository.findByDoctorIdAndDate(doctorId, localDate)
                        .stream()
                        .filter(ts -> ts.getIsBlocked())
                        .map(ts -> ts.getSlotTime())
                        .toList()
        );

        List<Map<String, Object>> slots = allSlots.stream().map(time -> {
            Map<String, Object> s = new LinkedHashMap<>();
            s.put("time", time);
            s.put("available", !bookedSet.contains(time) && !blockedSet.contains(time));
            return s;
        }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date", date);
        result.put("workDay", Map.of("room", workDay.getRoom().getName()));
        result.put("slots", slots);
        return result;
    }

    // ── Helper: Doctor → Map ─────────────────────────────────
    private Map<String, Object> toMap(Doctor d) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", d.getId());
        map.put("specialty", d.getSpecialty());
        map.put("experience", d.getExperience());
        map.put("degree", d.getDegree());
        map.put("description", d.getDescription());
        map.put("consultationFee", d.getConsultationFee());
        map.put("active", d.getActive());
        map.put("keywords", d.getKeywords());
        if (d.getUser() != null) {
            map.put("user", Map.of(
                    "id", d.getUser().getId(),
                    "name", d.getUser().getName(),
                    "email", d.getUser().getEmail() != null ? d.getUser().getEmail() : "",
                    "phone", d.getUser().getPhone(),
                    "avatar", d.getUser().getAvatar() != null ? d.getUser().getAvatar() : ""
            ));
        }
        return map;
    }
}
