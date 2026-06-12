package com.vietskin.backend_springboot.modules.stats.service;

import com.vietskin.backend_springboot.common.enums.AppointmentStatus;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.invoices.repository.InvoiceRepository;
import com.vietskin.backend_springboot.modules.medical_records.repository.MedicalRecordRepository;
import com.vietskin.backend_springboot.modules.specialties.repository.ServiceRepository;
import com.vietskin.backend_springboot.modules.stats.dto.PatientStatsResponse;
import com.vietskin.backend_springboot.modules.stats.dto.ServiceStatsResponse;
import com.vietskin.backend_springboot.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;
    private final ServiceRepository serviceRepository;

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    @Cacheable("patient_stats")
    public PatientStatsResponse getPatientStats() {

        // 1. Tổng bệnh nhân có tài khoản
        long totalPatients = userRepository.countPatients();

        // 2. Bệnh nhân mới trong tháng hiện tại
        YearMonth thisMonth = YearMonth.now();
        long newThisMonth = userRepository.countNewPatients(
                thisMonth.atDay(1).atStartOfDay(),
                thisMonth.plusMonths(1).atDay(1).atStartOfDay()
        );

        // 3. Tổng lượt khám hoàn thành
        long totalVisits = appointmentRepository.countByStatus(AppointmentStatus.done);

        // 4. Tỷ lệ no_show (%)
        long noShowCount = appointmentRepository.countByStatus(AppointmentStatus.no_show);
        double noShowRate = (totalVisits + noShowCount) == 0 ? 0
                : Math.round((double) noShowCount / (totalVisits + noShowCount) * 1000.0) / 10.0;

        // 5. Lượt khám theo tháng — luôn trả đủ 6 tháng kể cả tháng = 0
        List<PatientStatsResponse.MonthlyVisit> visitsByMonth = buildMonthlyVisits();

        // 6. Top 5 bác sĩ
        List<Object[]> rawDoctors = appointmentRepository.topDoctorsByDoneCount(PageRequest.of(0, 5));
        List<PatientStatsResponse.DoctorStat> topDoctors = rawDoctors.stream()
                .map(r -> new PatientStatsResponse.DoctorStat((String) r[0], (Long) r[1]))
                .toList();

        // 7. Top 10 chẩn đoán
        List<Object[]> rawDiag = medicalRecordRepository.topDiagnoses(PageRequest.of(0, 10));
        List<PatientStatsResponse.DiagnosisStat> topDiagnoses = rawDiag.stream()
                .map(r -> new PatientStatsResponse.DiagnosisStat((String) r[0], (Long) r[1]))
                .toList();

        // 8. Phân bổ trạng thái lịch hẹn
        List<Object[]> rawStatus = appointmentRepository.countGroupByStatus();
        Map<String, Long> statusDist = new LinkedHashMap<>();
        for (Object[] row : rawStatus) {
            statusDist.put(row[0].toString(), (Long) row[1]);
        }

        return new PatientStatsResponse(
                totalPatients, newThisMonth, totalVisits, noShowRate,
                visitsByMonth, topDoctors, topDiagnoses, statusDist
        );
    }

    /**
     * Thống kê dịch vụ: gộp số lượt khám (từ appointments) và doanh thu (từ invoices)
     * theo từng dịch vụ, rồi sắp xếp giảm dần theo doanh thu.
     */
    @Cacheable("service_stats")
    public ServiceStatsResponse getServiceStats() {

        // 1. Số lượt khám hoàn thành theo dịch vụ → Map<tên, lượt>
        Map<String, Long> countMap = new HashMap<>();
        for (Object[] row : appointmentRepository.countDoneByService()) {
            countMap.put((String) row[0], ((Number) row[1]).longValue());
        }

        // 2. Doanh thu theo dịch vụ → Map<tên, doanh thu>
        Map<String, Double> revenueMap = new HashMap<>();
        for (Object[] row : invoiceRepository.revenueByServicePaid()) {
            revenueMap.put((String) row[0], ((Number) row[1]).doubleValue());
        }

        // 3. Hợp nhất tập tên dịch vụ (một dịch vụ có thể có lượt nhưng chưa có doanh thu và ngược lại)
        Set<String> names = new LinkedHashSet<>();
        names.addAll(countMap.keySet());
        names.addAll(revenueMap.keySet());

        // 4. Ghép thành danh sách, sắp xếp giảm dần theo doanh thu
        List<ServiceStatsResponse.ServiceStat> services = names.stream()
                .map(name -> new ServiceStatsResponse.ServiceStat(
                        name,
                        countMap.getOrDefault(name, 0L),
                        revenueMap.getOrDefault(name, 0.0)))
                .sorted((a, b) -> Double.compare(b.revenue(), a.revenue()))
                .toList();

        // 5. Các số tổng
        long totalServices = serviceRepository.findByActiveTrue().size();
        long totalVisits = countMap.values().stream().mapToLong(Long::longValue).sum();
        double totalRevenue = revenueMap.values().stream().mapToDouble(Double::doubleValue).sum();

        return new ServiceStatsResponse(totalServices, totalVisits, totalRevenue, services);
    }

    /**
     * Tạo danh sách lượt khám cho 6 tháng gần nhất.
     * Tháng không có dữ liệu sẽ có count = 0 thay vì bị bỏ qua.
     */
    private List<PatientStatsResponse.MonthlyVisit> buildMonthlyVisits() {
        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(5).withDayOfMonth(1);

        // Query DB — trả về các tháng có lượt khám
        List<Object[]> rows = appointmentRepository.countDoneByMonth(sixMonthsAgo);

        // Index theo "yyyy-MM" để lookup O(1)
        Map<String, Long> dbMap = new HashMap<>();
        for (Object[] row : rows) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            long count = ((Number) row[2]).longValue();
            String key = String.format("%d-%02d", year, month);
            dbMap.put(key, count);
        }

        // Tạo đủ 6 tháng theo thứ tự
        List<PatientStatsResponse.MonthlyVisit> result = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.now().minusMonths(i);
            String key = ym.format(MONTH_FMT);
            result.add(new PatientStatsResponse.MonthlyVisit(key, dbMap.getOrDefault(key, 0L)));
        }
        return result;
    }
}
