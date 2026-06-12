package com.vietskin.backend_springboot.modules.stats.dto;

import java.util.List;

/**
 * Thống kê dịch vụ — gộp số lượt khám và doanh thu theo từng dịch vụ.
 *
 * @param totalServices        Số dịch vụ đang hoạt động
 * @param totalServiceVisits   Tổng lượt khám hoàn thành có gắn dịch vụ
 * @param totalServiceRevenue  Tổng doanh thu thu được từ các dịch vụ (hoá đơn đã thanh toán)
 * @param services             Danh sách dịch vụ — sắp xếp giảm dần theo doanh thu
 */
public record ServiceStatsResponse(
        long totalServices,
        long totalServiceVisits,
        double totalServiceRevenue,
        List<ServiceStat> services
) {

    /** Một dịch vụ kèm số lượt khám và doanh thu tương ứng */
    public record ServiceStat(String serviceName, long count, double revenue) {}
}
