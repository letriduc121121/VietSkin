package com.vietskin.backend_springboot.modules.prescriptions.repository;

import com.vietskin.backend_springboot.modules.prescriptions.entity.PrescriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, Integer> {
    List<PrescriptionItem> findByPrescriptionId(Integer prescriptionId);
}
