package com.vietskin.backend_springboot.modules.chatbot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.specialties.entity.Service;
import com.vietskin.backend_springboot.modules.specialties.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * "Công cụ" (tools) cho phép AI truy vấn DỮ LIỆU THẬT của phòng khám:
 *   - search_services: danh mục dịch vụ + giá
 *   - list_doctors:    danh sách bác sĩ + phí khám
 * AI tự quyết định khi nào gọi (Tool Calling). Mỗi tool chỉ đọc DB (read-only).
 */
@Component
@RequiredArgsConstructor
public class ChatTools {

    private final ServiceRepository serviceRepository;
    private final DoctorRepository doctorRepository;
    private final ObjectMapper objectMapper;

    private static final int MAX_ROWS = 15;

    /** Khai báo tool theo chuẩn OpenAI để gửi cho Groq. */
    public List<Map<String, Object>> definitions() {
        Map<String, Object> searchServices = Map.of(
                "type", "function",
                "function", Map.of(
                        "name", "search_services",
                        "description", "Tra cứu danh mục dịch vụ da liễu của phòng khám VietSkin kèm GIÁ và "
                                + "thời gian thực hiện. Gọi khi khách hỏi về dịch vụ, bảng giá, chi phí, giá tiền.",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "keyword", Map.of(
                                                "type", "string",
                                                "description", "Từ khóa tên/loại dịch vụ (vd: 'mụn','laser','nám'). Để trống để lấy tất cả."
                                        )
                                )
                        )
                )
        );

        Map<String, Object> listDoctors = Map.of(
                "type", "function",
                "function", Map.of(
                        "name", "list_doctors",
                        "description", "Tra cứu danh sách bác sĩ da liễu kèm chuyên khoa, học vị và PHÍ KHÁM. "
                                + "Gọi khi khách hỏi về bác sĩ, chuyên khoa hoặc phí khám.",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "keyword", Map.of(
                                                "type", "string",
                                                "description", "Từ khóa tên bác sĩ hoặc chuyên khoa. Để trống để lấy tất cả."
                                        )
                                )
                        )
                )
        );

        return List.of(searchServices, listDoctors);
    }

    /** Thực thi 1 tool theo tên + tham số (JSON string). Trả về kết quả dạng JSON string. */
    @Transactional(readOnly = true)
    public String execute(String name, String argumentsJson) {
        try {
            String keyword = "";
            if (argumentsJson != null && !argumentsJson.isBlank()) {
                JsonNode args = objectMapper.readTree(argumentsJson);
                keyword = args.path("keyword").asText("");
            }
            return switch (name) {
                case "search_services" -> searchServices(keyword);
                case "list_doctors" -> listDoctors(keyword);
                default -> "{\"error\":\"unknown tool\"}";
            };
        } catch (Exception e) {
            return "{\"error\":\"Không truy vấn được dữ liệu\"}";
        }
    }

    private String searchServices(String keyword) throws Exception {
        String kw = keyword == null ? "" : keyword.trim().toLowerCase();
        List<Map<String, Object>> rows = serviceRepository.findByActiveTrue().stream()
                .filter(s -> kw.isEmpty()
                        || (s.getName() != null && s.getName().toLowerCase().contains(kw))
                        || (s.getCategory() != null && s.getCategory().toLowerCase().contains(kw)))
                .limit(MAX_ROWS)
                .map(this::serviceRow)
                .toList();
        return objectMapper.writeValueAsString(Map.of("dich_vu", rows, "tong", rows.size()));
    }

    private Map<String, Object> serviceRow(Service s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ten_dich_vu", s.getName());
        m.put("gia_vnd", s.getPrice());
        m.put("thoi_gian_phut", s.getDuration());
        m.put("mo_ta", s.getDescription());
        return m;
    }

    private String listDoctors(String keyword) throws Exception {
        String kw = keyword == null ? "" : keyword.trim().toLowerCase();
        List<Map<String, Object>> rows = doctorRepository.findByActiveTrue().stream()
                .filter(d -> {
                    if (kw.isEmpty()) return true;
                    String spec = d.getSpecialty() == null ? "" : d.getSpecialty().toLowerCase();
                    String dname = (d.getUser() != null && d.getUser().getName() != null)
                            ? d.getUser().getName().toLowerCase() : "";
                    return spec.contains(kw) || dname.contains(kw);
                })
                .limit(MAX_ROWS)
                .map(this::doctorRow)
                .toList();
        return objectMapper.writeValueAsString(Map.of("bac_si", rows, "tong", rows.size()));
    }

    private Map<String, Object> doctorRow(Doctor d) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ten_bac_si", d.getUser() != null ? d.getUser().getName() : null);
        m.put("chuyen_khoa", d.getSpecialty());
        m.put("hoc_vi", d.getDegree());
        m.put("kinh_nghiem", d.getExperience());
        m.put("phi_kham_vnd", d.getConsultationFee());
        return m;
    }
}
