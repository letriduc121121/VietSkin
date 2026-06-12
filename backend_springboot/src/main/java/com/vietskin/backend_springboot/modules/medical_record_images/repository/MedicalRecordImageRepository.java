package com.vietskin.backend_springboot.modules.medical_record_images.repository;

import com.vietskin.backend_springboot.modules.medical_record_images.entity.MedicalRecordImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MedicalRecordImageRepository extends JpaRepository<MedicalRecordImage, Integer> {
    List<MedicalRecordImage> findByMedicalRecordId(Integer medicalRecordId);
    List<MedicalRecordImage> findByMedicalRecordIdOrderByCreatedAtAsc(Integer medicalRecordId);
    Optional<MedicalRecordImage> findByPublicId(String publicId);
}
