package com.vietskin.backend_springboot.modules.medicines.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.medicines.dto.CreateMedicineRequest;
import com.vietskin.backend_springboot.modules.medicines.entity.Medicine;
import com.vietskin.backend_springboot.modules.medicines.repository.MedicineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicineService {

    private final MedicineRepository medicineRepository;

    @Cacheable(value = "medicines")
    public List<Medicine> findAll() {
        return medicineRepository.findByActiveTrueOrderByNameAsc();
    }

    public List<Medicine> search(String keyword) {
        return medicineRepository.findByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(keyword);
    }

    public Medicine findOne(Integer id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Thuốc không tồn tại"));
    }

    @CacheEvict(value = "medicines", allEntries = true)
    public Medicine create(CreateMedicineRequest req) {
        Medicine m = new Medicine();
        m.setName(req.getName());
        m.setUnit(req.getUnit());
        m.setCategory(req.getCategory());
        m.setDescription(req.getDescription());
        m.setActive(true);
        return medicineRepository.save(m);
    }

    @CacheEvict(value = "medicines", allEntries = true)
    public Medicine update(Integer id, CreateMedicineRequest req) {
        Medicine m = findOne(id);
        if (req.getName()        != null) m.setName(req.getName());
        if (req.getUnit()        != null) m.setUnit(req.getUnit());
        if (req.getCategory()    != null) m.setCategory(req.getCategory());
        if (req.getDescription() != null) m.setDescription(req.getDescription());
        return medicineRepository.save(m);
    }

    @CacheEvict(value = "medicines", allEntries = true)
    public Medicine remove(Integer id) {
        Medicine m = findOne(id);
        m.setActive(false);
        return medicineRepository.save(m);
    }
}
