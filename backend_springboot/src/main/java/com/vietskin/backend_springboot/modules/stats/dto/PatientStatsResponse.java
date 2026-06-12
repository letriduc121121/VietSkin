package com.vietskin.backend_springboot.modules.stats.dto;

import java.util.List;
import java.util.Map;

/**
 * Toàn bộ data thống kê bệnh nhân — trả về trong một API call duy nhất.
 *
 * @param totalPatients         Tổng số bệnh nhân có tài khoản
 * @param newThisMonth          Bệnh nhân mới đăng ký trong tháng hiện tại
 * @param totalVisits           Tổng lượt khám (status = done)
 * @param noShowRate            Tỷ lệ không đến (%) = no_show / (done + no_show)
 * @param visitsByMonth         Lượt khám theo tháng — 6 tháng gần nhất
 * @param topDoctors            Top 5 bác sĩ theo số ca khám hoàn thành
 * @param topDiagnoses          Top 10 chẩn đoán phổ biến nhất
 * @param appointmentStatusDist Phân bổ trạng thái lịch hẹn (tất cả thời gian)
 */
public record PatientStatsResponse(
        long totalPatients,
        long newThisMonth,
        long totalVisits,
        double noShowRate,
        List<MonthlyVisit> visitsByMonth,
        List<DoctorStat> topDoctors,
        List<DiagnosisStat> topDiagnoses,
        Map<String, Long> appointmentStatusDist
) {

    /** Lượt khám theo từng tháng */
    public record MonthlyVisit(String month, long count) {}

    /** Bác sĩ và số ca đã khám xong */
    public record DoctorStat(String doctorName, long count) {}

    /** Chẩn đoán và số lần xuất hiện trong hồ sơ */
    public record DiagnosisStat(String diagnosis, long count) {}
}
