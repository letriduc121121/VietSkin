package com.vietskin.backend_springboot.modules.doctor_work_days.repository;

import com.vietskin.backend_springboot.modules.doctor_work_days.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Integer> {
    List<TimeSlot> findByDoctorIdAndDate(Integer doctorId, LocalDate date);
    List<TimeSlot> findByDoctorIdAndDateAndIsBlockedFalse(Integer doctorId, LocalDate date);
    Optional<TimeSlot> findByDoctorIdAndDateAndSlotTime(Integer doctorId, LocalDate date, String slotTime);
}
