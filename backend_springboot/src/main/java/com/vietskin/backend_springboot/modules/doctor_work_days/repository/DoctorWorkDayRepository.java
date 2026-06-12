package com.vietskin.backend_springboot.modules.doctor_work_days.repository;

import com.vietskin.backend_springboot.modules.doctor_work_days.entity.DoctorWorkDay;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DoctorWorkDayRepository extends JpaRepository<DoctorWorkDay, Integer> {
    List<DoctorWorkDay> findByDoctorId(Integer doctorId);
    List<DoctorWorkDay> findByDate(LocalDate date);
    List<DoctorWorkDay> findByDoctorIdAndDateBetween(Integer doctorId, LocalDate from, LocalDate to);
    Optional<DoctorWorkDay> findByDoctorIdAndDate(Integer doctorId, LocalDate date);
    boolean existsByDoctorIdAndDate(Integer doctorId, LocalDate date);
}
