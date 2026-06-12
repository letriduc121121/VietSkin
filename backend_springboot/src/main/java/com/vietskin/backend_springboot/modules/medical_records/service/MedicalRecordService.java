package com.vietskin.backend_springboot.modules.medical_records.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.medical_records.dto.CreateMedicalRecordRequest;
import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import com.vietskin.backend_springboot.modules.medical_records.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    // ── Bác sĩ tạo / cập nhật bệnh án (upsert theo appointmentId) ──
    @Transactional
    @CacheEvict(value = "medical_records", allEntries = true)
    public MedicalRecord create(CreateMedicalRecordRequest req, Integer doctorUserId) {
        Appointment apt = appointmentRepository.findById(req.getAppointmentId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Lịch hẹn không tồn tại"));

        Doctor doctor = doctorRepository.findByUserId(doctorUserId).orElse(null);

        // Nếu đã có bệnh án cho appointment này thì update, không tạo mới
        MedicalRecord record = medicalRecordRepository
                .findByAppointmentId(req.getAppointmentId())
                .orElse(new MedicalRecord());

        record.setSymptoms(req.getSymptoms());
        record.setDiagnosis(req.getDiagnosis());
        record.setSkinType(req.getSkinType());
        record.setLesionLocation(req.getLesionLocation());
        record.setTreatment(req.getTreatment());
        record.setNote(req.getNote());
        record.setFollowUpDate(req.getFollowUpDate());

        record.setAppointment(apt);

        if (apt.getPatient() != null) {
            record.setPatient(apt.getPatient());
        }
        if (doctor != null) {
            record.setDoctor(doctor);
        }

        log.info("Tạo/cập nhật bệnh án cho appointment={}, xóa cache medical_records", req.getAppointmentId());
        return medicalRecordRepository.save(record);
    }

    // ── Bệnh nhân / Staff xem theo patientId ────────────────
    @Cacheable(value = "medical_records", key = "#patientId")
    @Transactional(readOnly = true)
    public List<MedicalRecord> findByPatient(Integer patientId) {
        log.info("Cache MISS – truy vấn DB hồ sơ bệnh án cho patientId={}", patientId);
        return medicalRecordRepository.findByPatientId(patientId)
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
    }

    // ── Chi tiết 1 bệnh án ───────────────────────────────────
    @Transactional(readOnly = true)
    public MedicalRecord findOne(Integer id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Bệnh án không tồn tại"));
    }

    // ── Bác sĩ cập nhật bệnh án ─────────────────────────────
    @CacheEvict(value = "medical_records", allEntries = true)
    @Transactional
    public MedicalRecord update(Integer id, CreateMedicalRecordRequest req) {
        MedicalRecord record = findOne(id);

        if (req.getSymptoms()       != null) record.setSymptoms(req.getSymptoms());
        if (req.getDiagnosis()      != null) record.setDiagnosis(req.getDiagnosis());
        if (req.getSkinType()       != null) record.setSkinType(req.getSkinType());
        if (req.getLesionLocation() != null) record.setLesionLocation(req.getLesionLocation());
        if (req.getTreatment()      != null) record.setTreatment(req.getTreatment());
        if (req.getNote()           != null) record.setNote(req.getNote());
        if (req.getFollowUpDate()   != null) record.setFollowUpDate(req.getFollowUpDate());

        log.info("Cập nhật bệnh án id={}, xóa cache medical_records", id);
        return medicalRecordRepository.save(record);
    }
}

