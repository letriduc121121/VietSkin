package com.vietskin.backend_springboot.modules.invoices.repository;

import com.vietskin.backend_springboot.common.enums.PaymentStatus;
import com.vietskin.backend_springboot.modules.invoices.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
    Optional<Invoice> findByInvoiceCode(String invoiceCode);
    Optional<Invoice> findByAppointmentId(Integer appointmentId);
    List<Invoice> findByPatientId(Integer patientId);
    List<Invoice> findByStatus(PaymentStatus status);
    List<Invoice> findByStatusAndPaidAtBetween(PaymentStatus status, LocalDateTime from, LocalDateTime to);
    long countByStatus(PaymentStatus status);

    // Doanh thu theo dịch vụ — trả về [serviceName, sumAmount]
    // Đi qua quan hệ invoice -> appointment -> service; chỉ tính hoá đơn đã thanh toán.
    @Query("SELECT i.appointment.service.name, SUM(i.amount) FROM Invoice i " +
           "WHERE i.status = com.vietskin.backend_springboot.common.enums.PaymentStatus.paid " +
           "AND i.appointment IS NOT NULL AND i.appointment.service IS NOT NULL " +
           "GROUP BY i.appointment.service.id, i.appointment.service.name")
    List<Object[]> revenueByServicePaid();
}
