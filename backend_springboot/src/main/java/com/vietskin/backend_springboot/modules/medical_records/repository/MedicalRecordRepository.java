package com.vietskin.backend_springboot.modules.medical_records.repository;

import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Integer> {
    List<MedicalRecord> findByPatientId(Integer patientId);
    List<MedicalRecord> findByDoctorId(Integer doctorId);
    Optional<MedicalRecord> findByAppointmentId(Integer appointmentId);
    List<MedicalRecord> findByFollowUpDateAndPatientIsNotNull(LocalDate followUpDate);

    // --- STATS ---

    // Top chẩn đoán phổ biến — trả về [diagnosis, count]
    // Bỏ qua diagnosis null hoặc rỗng
    @Query("SELECT m.diagnosis, COUNT(m) FROM MedicalRecord m " +
           "WHERE m.diagnosis IS NOT NULL AND m.diagnosis <> '' " +
           "GROUP BY m.diagnosis ORDER BY COUNT(m) DESC")
    List<Object[]> topDiagnoses(Pageable pageable);
}
