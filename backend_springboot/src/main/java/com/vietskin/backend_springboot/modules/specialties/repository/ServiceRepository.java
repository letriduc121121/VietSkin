package com.vietskin.backend_springboot.modules.specialties.repository;

import com.vietskin.backend_springboot.modules.specialties.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Integer> {
    List<Service> findByActiveTrue();
    List<Service> findByCategoryIgnoreCase(String category);
    List<Service> findByNameContainingIgnoreCase(String name);
}
