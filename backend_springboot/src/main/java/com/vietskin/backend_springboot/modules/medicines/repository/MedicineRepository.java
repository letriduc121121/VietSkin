package com.vietskin.backend_springboot.modules.medicines.repository;

import com.vietskin.backend_springboot.modules.medicines.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, Integer> {
    List<Medicine> findByActiveTrue();
    List<Medicine> findByActiveTrueOrderByNameAsc();
    List<Medicine> findByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(String name);
    List<Medicine> findByNameContainingIgnoreCase(String name);
    List<Medicine> findByCategoryIgnoreCase(String category);
}
