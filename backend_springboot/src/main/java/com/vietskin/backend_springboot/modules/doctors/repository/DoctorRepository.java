package com.vietskin.backend_springboot.modules.doctors.repository;

import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Integer> {
    Optional<Doctor> findByUserId(Integer userId);
    List<Doctor> findByActiveTrue();
    List<Doctor> findBySpecialtyContainingIgnoreCase(String specialty);
}
