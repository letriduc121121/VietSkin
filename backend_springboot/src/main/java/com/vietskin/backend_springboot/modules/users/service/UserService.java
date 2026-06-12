package com.vietskin.backend_springboot.modules.users.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.users.dto.*;
import com.vietskin.backend_springboot.modules.users.entity.*;
import com.vietskin.backend_springboot.modules.users.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Admin: lấy tất cả users ─────────────────────────────
    @Cacheable(value = "users")
    public List<Map<String, Object>> findAll() {
        log.info("Cache MISS – truy vấn DB danh sách tất cả users");
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(u -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", u.getId());
                    map.put("username", u.getUsername());
                    map.put("name", u.getName());
                    map.put("email", u.getEmail());
                    map.put("phone", u.getPhone());
                    map.put("avatar", u.getAvatar());
                    map.put("active", u.getActive());
                    map.put("createdAt", u.getCreatedAt());
                    map.put("role", Map.of("code", u.getRole().getCode(), "name", u.getRole().getName()));
                    return map;
                }).toList();
    }

    // ── Lễ tân: tìm bệnh nhân theo SĐT ─────────────────────
    public Map<String, Object> findByPhone(String phone) {
        User u = userRepository.findByPhone(phone)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy bệnh nhân với SĐT này"));
        if (!"patient".equals(u.getRole().getCode())) {
            throw new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy bệnh nhân với SĐT này");
        }
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", u.getId());
        map.put("name", u.getName());
        map.put("phone", u.getPhone());
        map.put("email", u.getEmail());
        map.put("avatar", u.getAvatar());
        map.put("role", Map.of("code", u.getRole().getCode(), "name", u.getRole().getName()));
        return map;
    }

    // ── Admin: lấy 1 user ────────────────────────────────────
    @Cacheable(value = "user_profile", key = "#id")
    public Map<String, Object> findOne(Integer id) {
        log.info("Cache MISS – truy vấn DB chi tiết user id={}", id);
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", u.getId());
        map.put("username", u.getUsername());
        map.put("name", u.getName());
        map.put("email", u.getEmail());
        map.put("phone", u.getPhone());
        map.put("avatar", u.getAvatar());
        map.put("active", u.getActive());
        map.put("lastLoginAt", u.getLastLoginAt());
        map.put("role", Map.of("code", u.getRole().getCode(), "name", u.getRole().getName()));
        map.put("patientProfile", u.getPatientProfile());
        return map;
    }

    // ── User hiện tại: lấy profile ──────────────────────────
    @Cacheable(value = "user_profile", key = "#id")
    public Map<String, Object> getProfile(Integer id) {
        log.info("Cache MISS – truy vấn DB profile user id={}", id);
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        PatientProfile p = u.getPatientProfile();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", u.getId());
        map.put("name", u.getName());
        map.put("email", u.getEmail());
        map.put("phone", u.getPhone());
        map.put("avatar", u.getAvatar());
        map.put("role", Map.of("code", u.getRole().getCode(), "name", u.getRole().getName()));

        if (p != null) {
            Map<String, Object> profile = new LinkedHashMap<>();
            profile.put("dateOfBirth", p.getDateOfBirth());
            profile.put("gender", p.getGender());
            profile.put("address", p.getAddress());
            profile.put("province", p.getProvince());
            profile.put("district", p.getDistrict());
            profile.put("ward", p.getWard());
            profile.put("citizenId", p.getCitizenId());
            profile.put("ethnicity", p.getEthnicity());
            profile.put("bloodType", p.getBloodType());
            profile.put("allergies", p.getAllergies());
            profile.put("medicalHistory", p.getMedicalHistory());
            profile.put("emergencyContact", p.getEmergencyContact());
            map.put("patientProfile", profile);
        } else {
            map.put("patientProfile", null);
        }
        return map;
    }

    // ── User hiện tại: cập nhật profile ─────────────────────
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "users", allEntries = true),
            @CacheEvict(value = "user_profile", key = "#id")
    })
    public Map<String, Object> updateProfile(Integer id, UpdateProfileRequest req) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        if (req.getName() != null)
            u.setName(req.getName());
        if (req.getEmail() != null)
            u.setEmail(req.getEmail());
        if (req.getAvatar() != null)
            u.setAvatar(req.getAvatar());
        userRepository.save(u);

        // Upsert PatientProfile
        boolean hasProfileData = req.getDateOfBirth() != null || req.getGender() != null
                || req.getAddress() != null || req.getProvince() != null
                || req.getDistrict() != null || req.getWard() != null
                || req.getCitizenId() != null || req.getEthnicity() != null
                || req.getBloodType() != null || req.getAllergies() != null
                || req.getMedicalHistory() != null || req.getEmergencyContact() != null;

        if (hasProfileData) {
            PatientProfile p = patientProfileRepository.findByUserId(id)
                    .orElseGet(() -> PatientProfile.builder().user(u).build());

            if (req.getDateOfBirth() != null)
                p.setDateOfBirth(req.getDateOfBirth());
            if (req.getGender() != null)
                p.setGender(req.getGender());
            if (req.getAddress() != null)
                p.setAddress(req.getAddress());
            if (req.getProvince() != null)
                p.setProvince(req.getProvince());
            if (req.getDistrict() != null)
                p.setDistrict(req.getDistrict());
            if (req.getWard() != null)
                p.setWard(req.getWard());
            if (req.getCitizenId() != null)
                p.setCitizenId(req.getCitizenId());
            if (req.getEthnicity() != null)
                p.setEthnicity(req.getEthnicity());
            if (req.getBloodType() != null)
                p.setBloodType(req.getBloodType());
            if (req.getAllergies() != null)
                p.setAllergies(req.getAllergies());
            if (req.getMedicalHistory() != null)
                p.setMedicalHistory(req.getMedicalHistory());
            if (req.getEmergencyContact() != null)
                p.setEmergencyContact(req.getEmergencyContact());
            patientProfileRepository.save(p);
        }

        return getProfile(id);
    }

    // ── Đổi mật khẩu ────────────────────────────────────────
    public Map<String, String> changePassword(Integer id, ChangePasswordRequest req) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        if (!passwordEncoder.matches(req.getCurrentPassword(), u.getPasswordHash()))
            throw new AppException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");

        u.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(u);
        return Map.of("message", "Đổi mật khẩu thành công");
    }

    // ── Admin: bật/tắt tài khoản ────────────────────────────
    @Caching(evict = {
            @CacheEvict(value = "users", allEntries = true),
            @CacheEvict(value = "user_profile", key = "#id")
    })
    public Map<String, Object> toggleActive(Integer id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));
        u.setActive(!u.getActive());
        userRepository.save(u);
        return Map.of("id", u.getId(), "active", u.getActive());
    }

    // ── Admin: xóa mềm ──────────────────────────────────────
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "users", allEntries = true),
            @CacheEvict(value = "user_profile", key = "#id")
    })
    public Map<String, Object> deleteUser(Integer id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        // Nếu là doctor → deactivate doctor profile luôn
        doctorRepository.findByUserId(id).ifPresent(d -> {
            d.setActive(false);
            doctorRepository.save(d);
        });

        u.setActive(false);
        userRepository.save(u);
        return Map.of("id", u.getId(), "active", false);
    }

    // ── Admin: tạo user bất kỳ role ─────────────────────────
    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> createUser(CreateUserRequest req) {
        if (userRepository.existsByPhone(req.getPhone()))
            throw new AppException(HttpStatus.CONFLICT, "Số điện thoại đã được đăng ký");

        Role role = roleRepository.findByCode(req.getRoleCode())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST,
                        "Role '" + req.getRoleCode() + "' không tồn tại"));

        User u = User.builder()
                .username(req.getRoleCode() + "_" + req.getPhone())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .name(req.getName())
                .phone(req.getPhone())
                .email(req.getEmail())
                .avatar(req.getAvatar())
                .role(role)
                .active(true)
                .build();
        u = userRepository.save(u);

        return Map.of(
                "id", u.getId(),
                "name", u.getName(),
                "phone", u.getPhone(),
                "role", Map.of("code", role.getCode(), "name", role.getName()));
    }

    // ── Admin: tạo nhân sự (doctor/receptionist) ────────────
    @Transactional
    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> createStaff(CreateStaffRequest req) {
        if (userRepository.existsByPhone(req.getPhone()))
            throw new AppException(HttpStatus.CONFLICT, "Số điện thoại đã được đăng ký");

        Role role = roleRepository.findByCode(req.getRoleCode())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST,
                        "Role '" + req.getRoleCode() + "' không tồn tại"));

        User u = User.builder()
                .username(req.getRoleCode() + "_" + req.getPhone())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .name(req.getName())
                .phone(req.getPhone())
                .email(req.getEmail())
                .avatar(req.getAvatar())
                .role(role)
                .active(true)
                .build();
        u = userRepository.save(u);

        if ("doctor".equals(req.getRoleCode())) {
            Doctor doctor = Doctor.builder()
                    .user(u)
                    .specialty(req.getSpecialty())
                    .degree(req.getDegree())
                    .experience(req.getExperience())
                    .description(req.getDescription())
                    .keywords("[]")   // cột keywords NOT NULL — mặc định mảng JSON rỗng
                    .consultationFee(req.getConsultationFee() != null
                            ? req.getConsultationFee()
                            : java.math.BigDecimal.valueOf(150000))
                    .active(true)
                    .build();
            doctorRepository.save(doctor);
        }

        return Map.of(
                "id", u.getId(),
                "name", u.getName(),
                "phone", u.getPhone(),
                "role", Map.of("code", role.getCode(), "name", role.getName()));
    }
}
