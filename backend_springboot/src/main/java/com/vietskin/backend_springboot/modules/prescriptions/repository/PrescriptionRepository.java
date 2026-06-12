package com.vietskin.backend_springboot.modules.prescriptions.repository;

import com.vietskin.backend_springboot.modules.prescriptions.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Integer> {
    // Bệnh nhân không lưu trực tiếp trên prescription nữa → truy qua appointment.patient.id
    List<Prescription> findByAppointment_Patient_Id(Integer patientId);
    Optional<Prescription> findByAppointmentId(Integer appointmentId);
    List<Prescription> findByMedicalRecordId(Integer medicalRecordId);
}
