package com.vietskin.backend_springboot.modules.lookups.service;

import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.lookups.dto.DegreeDto;
import com.vietskin.backend_springboot.modules.lookups.dto.SpecialtyDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

/**
 * Cung cấp danh sách chuyên khoa & học hàm cho dropdown.
 * Không có bảng riêng (DB dùng ddl-auto=validate) nên danh sách = mặc định
 * gộp thêm các giá trị đang được dùng thực tế trong bảng doctors.
 */
@Service
@RequiredArgsConstructor
public class LookupService {

    private final DoctorRepository doctorRepository;

    private static final List<String> DEFAULT_SPECIALTIES = List.of(
            "Da liễu tổng quát",
            "Da liễu thẩm mỹ",
            "Điều trị mụn",
            "Bệnh da nhiễm khuẩn",
            "Dị ứng - Miễn dịch da",
            "Laser & Ánh sáng",
            "Nấm & Ký sinh trùng da",
            "Da liễu nhi"
    );

    private static final List<String> DEFAULT_DEGREES = List.of(
            "BS.",
            "BS. CKI",
            "BS. CKII",
            "ThS. BS.",
            "TS. BS.",
            "PGS. TS. BS.",
            "GS. TS. BS."
    );

    public List<SpecialtyDto> getSpecialties() {
        List<String> names = merge(DEFAULT_SPECIALTIES,
                doctorRepository.findAll().stream().map(Doctor::getSpecialty).toList());
        List<SpecialtyDto> out = new ArrayList<>();
        int id = 1;
        for (String name : names) out.add(new SpecialtyDto(id++, name, null));
        return out;
    }

    public List<DegreeDto> getDegrees() {
        List<String> names = merge(DEFAULT_DEGREES,
                doctorRepository.findAll().stream().map(Doctor::getDegree).toList());
        List<DegreeDto> out = new ArrayList<>();
        int id = 1;
        for (String name : names) out.add(new DegreeDto(id++, name));
        return out;
    }

    /** Gộp danh sách mặc định + giá trị thực tế, loại trùng không phân biệt hoa thường, giữ thứ tự. */
    private List<String> merge(List<String> defaults, List<String> fromDb) {
        LinkedHashSet<String> set = new LinkedHashSet<>(defaults);
        for (String raw : fromDb) {
            if (raw == null) continue;
            String v = raw.trim();
            if (v.isEmpty()) continue;
            boolean exists = set.stream().anyMatch(n -> n.equalsIgnoreCase(v));
            if (!exists) set.add(v);
        }
        return new ArrayList<>(set);
    }
}
