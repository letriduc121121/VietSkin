package com.vietskin.backend_springboot.modules.doctor_work_days.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.doctor_work_days.dto.BulkCreateWorkDayRequest;
import com.vietskin.backend_springboot.modules.doctor_work_days.dto.CreateWorkDayRequest;
import com.vietskin.backend_springboot.modules.doctor_work_days.entity.DoctorWorkDay;
import com.vietskin.backend_springboot.modules.doctor_work_days.repository.DoctorWorkDayRepository;
import com.vietskin.backend_springboot.modules.rooms.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DoctorWorkDayService {

    private final DoctorWorkDayRepository workDayRepository;
    private final RoomRepository roomRepository;
    private final AppointmentRepository appointmentRepository;

    private static final String[] DAY_NAMES = {
            "Chủ nhật","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"
    };

    // Chỉ T2-T7, không phân CN
    private void validateWeekday(LocalDate date) {
        if (date.getDayOfWeek().getValue() == 7) { // Sunday
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Ngày " + date + " là Chủ nhật — không phân lịch ngày Chủ nhật");
        }
    }

    // Resolve roomId từ phòng được gán cho bác sĩ
    private Integer resolveRoom(Integer doctorId, Integer roomId) {
        if (roomId != null) return roomId;
        return roomRepository.findByDoctorId(doctorId)
                .map(r -> r.getId())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST,
                        "Bác sĩ chưa được phân phòng — vui lòng gán phòng trước"));
    }

    // ── Xem lịch theo tháng ─────────────────────────────────
    public List<Map<String, Object>> findByMonth(String month, Integer doctorId) {
        YearMonth ym = YearMonth.parse(month);
        LocalDate from = ym.atDay(1);
        LocalDate to   = ym.atEndOfMonth();

        List<DoctorWorkDay> list = doctorId != null
                ? workDayRepository.findByDoctorIdAndDateBetween(doctorId, from, to)
                : workDayRepository.findAll().stream()
                .filter(w -> !w.getDate().isBefore(from) && !w.getDate().isAfter(to))
                .toList();

        return list.stream().map(w -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", w.getId());
            map.put("date", w.getDate());
            map.put("doctorId", w.getDoctor().getId());
            map.put("doctorName", w.getDoctor().getUser() != null
                    ? w.getDoctor().getUser().getName() : "");
            map.put("roomId", w.getRoom().getId());
            map.put("roomName", w.getRoom().getName());
            return map;
        }).toList();
    }

    // ── Phân 1 ngày ─────────────────────────────────────────
    public Map<String, Object> create(CreateWorkDayRequest req, Integer adminId) {
        validateWeekday(req.getDate());
        Integer roomId = resolveRoom(req.getDoctorId(), req.getRoomId());

        if (workDayRepository.existsByDoctorIdAndDate(req.getDoctorId(), req.getDate()))
            throw new AppException(HttpStatus.CONFLICT,
                    "Bác sĩ đã có lịch làm ngày " + req.getDate());

        DoctorWorkDay wd = new DoctorWorkDay();
        wd.setDate(req.getDate());
        wd.setCreatedBy(adminId);

        // Set doctor và room qua id
        var doctor = new com.vietskin.backend_springboot.modules.doctors.entity.Doctor();
        doctor.setId(req.getDoctorId());
        wd.setDoctor(doctor);

        var room = new com.vietskin.backend_springboot.modules.rooms.entity.Room();
        room.setId(roomId);
        wd.setRoom(room);

        workDayRepository.save(wd);
        return Map.of(
                "id", wd.getId(),
                "doctorId", req.getDoctorId(),
                "roomId", roomId,
                "date", req.getDate()
        );
    }

    // ── Phân nhiều ngày (bulk) ───────────────────────────────
    public Map<String, Object> bulkCreate(BulkCreateWorkDayRequest req, Integer adminId) {
        List<LocalDate> uniqueDates = req.getDates().stream().distinct().toList();
        for (LocalDate d : uniqueDates) validateWeekday(d);

        Integer roomId = resolveRoom(req.getDoctorId(), req.getRoomId());

        List<Object> success = new ArrayList<>();
        List<Object> failed  = new ArrayList<>();

        for (LocalDate date : uniqueDates) {
            try {
                if (workDayRepository.existsByDoctorIdAndDate(req.getDoctorId(), date)) {
                    failed.add(Map.of("date", date, "reason", "Bác sĩ đã có lịch ngày này"));
                    continue;
                }

                DoctorWorkDay wd = new DoctorWorkDay();
                wd.setDate(date);
                wd.setCreatedBy(adminId);

                var doctor = new com.vietskin.backend_springboot.modules.doctors.entity.Doctor();
                doctor.setId(req.getDoctorId());
                wd.setDoctor(doctor);

                var room = new com.vietskin.backend_springboot.modules.rooms.entity.Room();
                room.setId(roomId);
                wd.setRoom(room);

                workDayRepository.save(wd);
                success.add(Map.of("date", date, "roomId", roomId));
            } catch (Exception e) {
                failed.add(Map.of("date", date, "reason", "Lỗi không xác định"));
            }
        }

        return Map.of("success", success, "failed", failed);
    }

    // ── Xóa 1 ngày làm ──────────────────────────────────────
    public Map<String, Object> remove(Integer id) {
        DoctorWorkDay wd = workDayRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Lịch làm việc không tồn tại"));

        boolean hasConfirmed = appointmentRepository
                .existsByDoctorIdAndDateAndStatusNotIn(
                        wd.getDoctor().getId(), wd.getDate(),
                        List.of("cancelled", "no_show", "pending")
                );

        if (hasConfirmed)
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Không thể xóa — ngày này đã có lịch hẹn bệnh nhân đã xác nhận");

        workDayRepository.deleteById(id);
        return Map.of("id", id, "deleted", true);
    }
}
