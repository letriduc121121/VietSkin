package com.vietskin.backend_springboot.modules.users.repository;

import com.vietskin.backend_springboot.modules.users.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Integer> {
    Optional<Role> findByCode(String code);
}
