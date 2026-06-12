package com.vietskin.backend_springboot.modules.invoices.service;

import com.vietskin.backend_springboot.common.enums.PaymentMethod;
import com.vietskin.backend_springboot.common.enums.PaymentStatus;
import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.common.websocket.AppWebSocketHandler;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.invoices.dto.CreateInvoiceRequest;
import com.vietskin.backend_springboot.modules.invoices.entity.Invoice;
import com.vietskin.backend_springboot.modules.invoices.repository.InvoiceRepository;
import com.vietskin.backend_springboot.modules.notifications.service.NotificationService;
import com.vietskin.backend_springboot.modules.users.entity.User;
import com.vietskin.backend_springboot.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AppWebSocketHandler wsHandler;

    @Transactional
    public Invoice create(CreateInvoiceRequest req, Integer receivedByUserId) {
        Appointment apt = appointmentRepository.findById(req.getAppointmentId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Lịch hẹn không tồn tại"));

        // Kiểm tra đã có hóa đơn chưa
        Invoice existingInvoice = invoiceRepository.findByAppointmentId(req.getAppointmentId()).orElse(null);
        if (existingInvoice != null) {
            if (existingInvoice.getStatus() == PaymentStatus.unpaid) {
                // Cập nhật hóa đơn chưa thanh toán thành đã thanh toán
                existingInvoice.setStatus(PaymentStatus.paid);
                existingInvoice.setMethod(PaymentMethod.valueOf(req.getPaymentMethod()));
                existingInvoice.setPaidAt(LocalDateTime.now());
                existingInvoice.setReceivedBy(userRepository.findById(receivedByUserId).orElse(null));
                existingInvoice.setNote(req.getNote());

                Invoice saved = invoiceRepository.save(existingInvoice);
                notifyPatientOfSuccess(saved, apt);
                return saved;
            } else {
                throw new AppException(HttpStatus.BAD_REQUEST, "Lịch hẹn này đã có hóa đơn");
            }
        }

        // Tạo mã hóa đơn
        long count = invoiceRepository.count();
        String invoiceCode = String.format("INV-%d-%04d", LocalDateTime.now().getYear(), count + 1);

        // Tính tiền
        BigDecimal consultationFee = apt.getDoctor() != null && apt.getDoctor().getConsultationFee() != null
                ? apt.getDoctor().getConsultationFee()
                : BigDecimal.valueOf(150000);
        BigDecimal servicePrice = apt.getService() != null && apt.getService().getPrice() != null
                ? apt.getService().getPrice()
                : BigDecimal.ZERO;
        BigDecimal amount = consultationFee.add(servicePrice);

        // Mô tả hóa đơn
        String doctorName = apt.getDoctor() != null && apt.getDoctor().getUser() != null
                ? apt.getDoctor().getUser().getName() : "Bác sĩ";
        StringBuilder desc = new StringBuilder("Phí khám - ").append(doctorName);
        if (apt.getService() != null) {
            desc.append(" | Dịch vụ: ").append(apt.getService().getName());
        }

        User receiver = userRepository.findById(receivedByUserId).orElse(null);

        Invoice invoice = Invoice.builder()
                .invoiceCode(invoiceCode)
                .appointment(apt)
                .patient(apt.getPatient())
                .patientName(apt.getPatientName())
                .description(desc.toString())
                .amount(amount)
                .status(PaymentStatus.paid)
                .method(PaymentMethod.valueOf(req.getPaymentMethod()))
                .paidAt(LocalDateTime.now())
                .receivedBy(receiver)
                .note(req.getNote())
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        notifyPatientOfSuccess(saved, apt);
        return saved;
    }

    private void notifyPatientOfSuccess(Invoice invoice, Appointment apt) {
        if (apt.getPatient() != null) {
            try {
                // Format số tiền theo kiểu Việt Nam: 150,000 đ
                String amountStr = NumberFormat.getNumberInstance(new Locale("vi", "VN"))
                        .format(invoice.getAmount().longValue()) + " đ";

                notificationService.notifyUser(
                        apt.getPatient().getId(), "system",
                        "Thanh toán thành công",
                        "Hóa đơn " + invoice.getInvoiceCode() + " — " + amountStr
                                + " đã được ghi nhận. Cảm ơn bạn đã sử dụng dịch vụ VietSkin!"
                );

                // Ping WebSocket để chuông reload ngay nếu bệnh nhân đang online
                wsHandler.publishToPatient(apt.getPatient().getId(), "appointment_updated",
                        Map.of("appointmentId", apt.getId(), "status", "invoice_created"));
            } catch (Exception ignored) {}
        }
    }

    public List<Invoice> findAll(String status) {
        if (status != null) {
            return invoiceRepository.findByStatus(PaymentStatus.valueOf(status))
                    .stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .toList();
        }
        return invoiceRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
    }

    public Invoice findOne(Integer id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Hóa đơn không tồn tại"));
    }

    public List<Invoice> findByPatient(Integer patientId) {
        return invoiceRepository.findByPatientId(patientId)
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
    }

    public Map<String, Object> getStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sixMonthsAgo = now.minusMonths(5).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime monthStart = now.toLocalDate().withDayOfMonth(1).atStartOfDay();

        List<Invoice> invoices = invoiceRepository.findByStatusAndPaidAtBetween(
                PaymentStatus.paid, sixMonthsAgo, now);

        Map<String, Double> monthlyMap = new HashMap<>();
        Map<String, Double> methodMap = new HashMap<>();
        double todayTotal = 0, monthTotal = 0, grandTotal = 0;

        for (Invoice inv : invoices) {
            LocalDateTime paidAt = inv.getPaidAt() != null ? inv.getPaidAt() : now;
            double amount = inv.getAmount().doubleValue();
            String key = String.format("%d-%02d", paidAt.getYear(), paidAt.getMonthValue());

            monthlyMap.merge(key, amount, Double::sum);
            if (inv.getMethod() != null) {
                methodMap.merge(inv.getMethod().name(), amount, Double::sum);
            }
            if (!paidAt.isBefore(todayStart)) todayTotal += amount;
            if (!paidAt.isBefore(monthStart)) monthTotal += amount;
            grandTotal += amount;
        }

        // Build mảng 6 tháng gần nhất
        List<Map<String, Object>> monthly = new java.util.ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime d = now.minusMonths(i).withDayOfMonth(1);
            String k = String.format("%d-%02d", d.getYear(), d.getMonthValue());
            Map<String, Object> entry = new HashMap<>();
            entry.put("month", k);
            entry.put("revenue", monthlyMap.getOrDefault(k, 0.0));
            monthly.add(entry);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("monthly", monthly);
        result.put("byMethod", methodMap);
        result.put("todayTotal", todayTotal);
        result.put("monthTotal", monthTotal);
        result.put("grandTotal", grandTotal);
        return result;
    }
}
