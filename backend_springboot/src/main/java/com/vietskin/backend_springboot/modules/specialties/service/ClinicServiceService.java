package com.vietskin.backend_springboot.modules.specialties.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.specialties.dto.CreateServiceRequest;
import com.vietskin.backend_springboot.modules.specialties.dto.UpdateServiceRequest;
import com.vietskin.backend_springboot.modules.specialties.entity.Service;
import com.vietskin.backend_springboot.modules.specialties.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("clinicServiceService")
@RequiredArgsConstructor
public class ClinicServiceService {

    private final ServiceRepository serviceRepository;

    // Public — chỉ active
    @Cacheable("services")
    public List<Service> findAll() {
        return serviceRepository.findByActiveTrue()
                .stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();
    }

    // Admin — tất cả kể inactive
    @Cacheable("services_admin")
    public List<Service> findAllAdmin() {
        return serviceRepository.findAll()
                .stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();
    }

    public Service findOne(Integer id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Dịch vụ không tồn tại"));
    }

    @Caching(evict = {
            @CacheEvict(value = "services", allEntries = true),
            @CacheEvict(value = "services_admin", allEntries = true)
    })
    public Service create(CreateServiceRequest req) {
        Service svc = Service.builder()
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .duration(req.getDuration() != null ? req.getDuration() : 30)
                .category(req.getCategory())
                .imageUrl(req.getImageUrl())
                .active(true)
                .build();
        return serviceRepository.save(svc);
    }

    @Caching(evict = {
            @CacheEvict(value = "services", allEntries = true),
            @CacheEvict(value = "services_admin", allEntries = true)
    })
    public Service update(Integer id, UpdateServiceRequest req) {
        Service svc = findOne(id);

        if (req.getName()        != null) svc.setName(req.getName());
        if (req.getDescription() != null) svc.setDescription(req.getDescription());
        if (req.getPrice()       != null) svc.setPrice(req.getPrice());
        if (req.getDuration()    != null) svc.setDuration(req.getDuration());
        if (req.getCategory()    != null) svc.setCategory(req.getCategory());
        if (req.getImageUrl()    != null) svc.setImageUrl(req.getImageUrl());
        if (req.getActive()      != null) svc.setActive(req.getActive());

        return serviceRepository.save(svc);
    }

    // Xóa mềm
    @Caching(evict = {
            @CacheEvict(value = "services", allEntries = true),
            @CacheEvict(value = "services_admin", allEntries = true)
    })
    public Service remove(Integer id) {
        Service svc = findOne(id);
        svc.setActive(false);
        return serviceRepository.save(svc);
    }
}
