package com.vietskin.backend_springboot.modules.users.repository;

import com.vietskin.backend_springboot.modules.users.entity.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, Integer> {
    Optional<PatientProfile> findByUserId(Integer userId);
    Optional<PatientProfile> findByPatientCode(String patientCode);
}
