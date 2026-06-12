package com.vietskin.backend_springboot.modules.appointments.service;

import com.vietskin.backend_springboot.common.enums.AppointmentStatus;
import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.modules.appointments.dto.CreateAppointmentRequest;
import com.vietskin.backend_springboot.modules.appointments.dto.UpdateStatusRequest;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.common.websocket.AppWebSocketHandler;
import com.vietskin.backend_springboot.modules.doctor_work_days.repository.DoctorWorkDayRepository;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.notifications.service.NotificationService;
import com.vietskin.backend_springboot.modules.specialties.entity.Service;
import com.vietskin.backend_springboot.modules.invoices.entity.Invoice;
import com.vietskin.backend_springboot.modules.invoices.repository.InvoiceRepository;
import com.vietskin.backend_springboot.common.enums.PaymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component("appointmentService")
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorWorkDayRepository doctorWorkDayRepository;
    private final AppWebSocketHandler wsHandler;
    private final NotificationService notificationService;
    private final InvoiceRepository invoiceRepository;

    private static final DateTimeFormatter VN_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Các transition hợp lệ — giống NestJS
    private static final Map<String, List<String>> VALID_TRANSITIONS = Map.of(
            "pending",     List.of("confirmed", "checked_in", "cancelled"),
            "confirmed",   List.of("checked_in", "cancelled", "no_show"),
            "checked_in",  List.of("in_progress", "no_show"),
            "in_progress", List.of("done"),
            "done",        List.of(),
            "cancelled",   List.of(),
            "no_show",     List.of()
    );

    // ── Đặt lịch ────────────────────────────────────────────
    @Transactional
    @CacheEvict(value = "appointments_list", allEntries = true)
    public Appointment create(CreateAppointmentRequest req, Integer userId) {
        boolean isWalkin = Boolean.TRUE.equals(req.getIsWalkin());

        // Giờ khám — walk-in dùng giờ hiện tại nếu không truyền
        String appointmentTime = req.getTime();
        if (appointmentTime == null) {
            appointmentTime = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));
        }

        // Kiểm tra bác sĩ có lịch làm việc ngày này không (cả walk-in lẫn online)
        if (!doctorWorkDayRepository.existsByDoctorIdAndDate(req.getDoctorId(), req.getDate())) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Bác sĩ không có lịch làm việc vào ngày " + req.getDate()
                    + ". Vui lòng chọn bác sĩ khác hoặc ngày khác.");
        }

        // Chỉ check conflict slot cho online booking
        final String finalTime = appointmentTime;
        if (!isWalkin) {
            boolean conflict = appointmentRepository
                    .findByDoctorIdAndDate(req.getDoctorId(), req.getDate())
                    .stream()
                    .anyMatch(a -> finalTime.equals(a.getTime())
                            && a.getStatus() != AppointmentStatus.cancelled
                            && a.getStatus() != AppointmentStatus.no_show);
            if (conflict)
                throw new AppException(HttpStatus.BAD_REQUEST, "Khung giờ này đã có người đặt");
        }

        // Walk-in: cấp STT ngay
        Integer queueNumber = null;
        AppointmentStatus initialStatus = isWalkin
                ? AppointmentStatus.checked_in
                : AppointmentStatus.pending;

        if (isWalkin) {
            long count = appointmentRepository.findByDoctorIdAndDate(req.getDoctorId(), req.getDate())
                    .stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.checked_in
                            || a.getStatus() == AppointmentStatus.in_progress
                            || a.getStatus() == AppointmentStatus.done)
                    .count();
            queueNumber = (int) count + 1;
        }

        // Resolve patientId
        Integer patientId = req.getPatientId() != null ? req.getPatientId() : userId;

        Appointment apt = new Appointment();
        apt.setPatientName(req.getPatientName());
        apt.setPatientPhone(req.getPatientPhone());
        apt.setPatientEmail(req.getPatientEmail());
        apt.setDate(req.getDate());
        apt.setTime(appointmentTime);
        apt.setSymptoms(req.getSymptoms());
        apt.setStatus(initialStatus);
        apt.setQueueNumber(queueNumber);

        if (patientId != null) {
            var patient = new com.vietskin.backend_springboot.modules.users.entity.User();
            patient.setId(patientId);
            apt.setPatient(patient);
        }

        var doctor = new Doctor();
        doctor.setId(req.getDoctorId());
        apt.setDoctor(doctor);

        if (req.getServiceId() != null) {
            var service = new Service();
            service.setId(req.getServiceId());
            apt.setService(service);
        }

        Appointment saved = appointmentRepository.save(apt);
        String ptName = saved.getPatientName() != null ? saved.getPatientName() : "Bệnh nhân";
        wsHandler.publishToReceptionist("appointment_created", Map.of(
                "appointmentId", saved.getId(),
                "date",          saved.getDate().toString(),
                "patientName",   ptName
        ));
        if (isWalkin) {
            wsHandler.publishToDoctor(saved.getDoctor().getId(), "queue_updated",
                    Map.of("doctorId", saved.getDoctor().getId()));
        }
        return saved;
    }

    // ── Lễ tân/Admin xem tất cả (có filter) ─────────────────
    // Cache theo bộ lọc (SimpleKey gộp cả 5 tham số). TTL ngắn 30s + evict khi có
    // đặt/đổi trạng thái/hủy để lễ tân luôn thấy danh sách mới nhất.
    @Cacheable("appointments_list")
    public List<Appointment> findAll(String date, String dateFrom, String dateTo,
                                     Integer doctorId, String status) {
        List<Appointment> all = appointmentRepository.findAll();

        return all.stream()
                .filter(a -> date == null || a.getDate().equals(LocalDate.parse(date)))
                .filter(a -> dateFrom == null || !a.getDate().isBefore(LocalDate.parse(dateFrom)))
                .filter(a -> dateTo == null || !a.getDate().isAfter(LocalDate.parse(dateTo)))
                .filter(a -> doctorId == null || a.getDoctor().getId().equals(doctorId))
                .filter(a -> status == null || a.getStatus().name().equals(status))
                .sorted(Comparator.comparing(Appointment::getDate).reversed()
                        .thenComparing(Appointment::getTime, Comparator.reverseOrder()))
                .toList();
    }

    // ── Chi tiết 1 lịch hẹn ─────────────────────────────────
    public Appointment findOne(Integer id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Lịch hẹn không tồn tại"));
    }

    // ── Slot đã đặt (public) ─────────────────────────────────
    public List<String> getBookedSlots(Integer doctorId, String date) {
        return appointmentRepository.findBookedSlots(doctorId, LocalDate.parse(date));
    }

    // ── Bệnh nhân xem lịch của mình ─────────────────────────
    public List<Appointment> findByPatient(Integer patientId) {
        return appointmentRepository.findByPatientId(patientId)
                .stream()
                .sorted(Comparator.comparing(Appointment::getDate).reversed())
                .toList();
    }

    // ── Lễ tân tra cứu bệnh nhân qua SĐT ───────────────────
    public Map<String, Object> lookupByPhone(String phone, String date) {
        List<Appointment> appointments = appointmentRepository.findByPatientPhone(phone)
                .stream()
                .filter(a -> a.getStatus() != AppointmentStatus.cancelled
                        && a.getStatus() != AppointmentStatus.no_show)
                .filter(a -> date == null || a.getDate().equals(LocalDate.parse(date)))
                .sorted(Comparator.comparing(Appointment::getDate).reversed())
                .toList();

        return Map.of("appointments", appointments);
    }

    // ── Hàng chờ (checked_in + in_progress) ─────────────────
    public List<Appointment> findQueue(Integer doctorId, String date) {
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        return appointmentRepository.findByDoctorIdAndDate(doctorId, targetDate)
                .stream()
                .filter(a -> a.getStatus() == AppointmentStatus.checked_in
                        || a.getStatus() == AppointmentStatus.in_progress)
                .sorted(Comparator.comparing(a -> a.getQueueNumber() != null
                        ? a.getQueueNumber() : Integer.MAX_VALUE))
                .toList();
    }

    // ── Lịch ngày (toàn bộ confirmed/checked_in/done) ───────
    public List<Appointment> findDaySchedule(Integer doctorId, String date) {
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        return appointmentRepository.findByDoctorIdAndDate(doctorId, targetDate)
                .stream()
                .filter(a -> a.getStatus() == AppointmentStatus.confirmed
                        || a.getStatus() == AppointmentStatus.checked_in
                        || a.getStatus() == AppointmentStatus.in_progress
                        || a.getStatus() == AppointmentStatus.done)
                .sorted(Comparator.comparing(a -> a.getQueueNumber() != null
                        ? a.getQueueNumber() : Integer.MAX_VALUE))
                .toList();
    }

    // ── Cập nhật trạng thái ──────────────────────────────────
    @Transactional
    @CacheEvict(value = "appointments_list", allEntries = true)
    public Appointment updateStatus(Integer id, UpdateStatusRequest req, Integer currentUserId) {
        Appointment apt = findOne(id);

        // Kiểm tra transition hợp lệ
        List<String> allowed = VALID_TRANSITIONS.getOrDefault(
                apt.getStatus().name(), List.of());
        if (!allowed.contains(req.getStatus())) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Không thể chuyển từ \"" + apt.getStatus()
                            + "\" sang \"" + req.getStatus() + "\"");
        }

        // Ghi lại lễ tân/admin duyệt lịch khi chuyển sang "confirmed"
        if ("confirmed".equals(req.getStatus()) && currentUserId != null
                && apt.getConfirmedBy() == null) {
            var confirmer = new com.vietskin.backend_springboot.modules.users.entity.User();
            confirmer.setId(currentUserId);
            apt.setConfirmedBy(confirmer);
            apt.setConfirmedAt(LocalDateTime.now());
        }

        // Cấp STT khi check-in (nếu chưa có)
        if ("checked_in".equals(req.getStatus()) && apt.getQueueNumber() == null) {
            long count = appointmentRepository
                    .findByDoctorIdAndDate(apt.getDoctor().getId(), apt.getDate())
                    .stream()
                    .filter(a -> a.getStatus() == AppointmentStatus.checked_in
                            || a.getStatus() == AppointmentStatus.in_progress
                            || a.getStatus() == AppointmentStatus.done)
                    .count();
            apt.setQueueNumber((int) count + 1);
        }

        apt.setStatus(AppointmentStatus.valueOf(req.getStatus()));
        Appointment saved = appointmentRepository.save(apt);

        // Payload chung cho appointment_updated
        Map<String, Object> updPayload = new HashMap<>();
        updPayload.put("appointmentId", saved.getId());
        updPayload.put("status", req.getStatus());
        updPayload.put("queueNumber", saved.getQueueNumber());

        // Gửi cho lễ tân
        wsHandler.publishToReceptionist("appointment_updated", updPayload);

        // Gửi cho bệnh nhân nếu có tài khoản (không phải walk-in ẩn danh)
        if (saved.getPatient() != null) {
            wsHandler.publishToPatient(saved.getPatient().getId(), "appointment_updated", updPayload);

            // Lưu DB notification để hiện trong chuông ngay cả khi bệnh nhân offline
            try {
                Integer patientUserId = saved.getPatient().getId();
                String dateStr = saved.getDate().format(VN_DATE);
                String timeStr = saved.getTime() != null ? saved.getTime() : "";

                switch (req.getStatus()) {
                    case "confirmed" -> notificationService.notifyUser(
                            patientUserId, "appointment",
                            "Lịch khám đã được xác nhận",
                            "Lịch khám ngày " + dateStr + " lúc " + timeStr + " tại VietSkin đã được xác nhận."
                    );
                    case "in_progress" -> notificationService.notifyUser(
                            patientUserId, "appointment",
                            "Đến lượt của bạn!",
                            "Bác sĩ đang gọi bạn vào khám. Vui lòng chuẩn bị."
                    );
                    case "done" -> notificationService.notifyUser(
                            patientUserId, "appointment",
                            "Khám bệnh hoàn thành",
                            "Cảm ơn bạn đã đến khám tại VietSkin. Chúc bạn mau khỏe!"
                    );
                    default -> { /* các trạng thái khác không cần notify */ }
                }
            } catch (Exception ignored) {}
        }

        // Gửi cho bác sĩ khi hàng chờ thay đổi
        if ("checked_in".equals(req.getStatus()) || "in_progress".equals(req.getStatus()) || "done".equals(req.getStatus())) {
            wsHandler.publishToDoctor(saved.getDoctor().getId(), "queue_updated",
                    Map.of("doctorId", saved.getDoctor().getId()));
        }

        // Thông báo lễ tân khi khám xong để thu tiền
        if ("done".equals(req.getStatus())) {
            createUnpaidInvoiceForAppointment(saved);
            try {
                String patientName = (saved.getPatientName() != null && !saved.getPatientName().isBlank())
                        ? saved.getPatientName()
                        : (saved.getPatient() != null ? saved.getPatient().getName() : "Khách lẻ");
                String doctorName = (saved.getDoctor() != null && saved.getDoctor().getUser() != null)
                        ? saved.getDoctor().getUser().getName() : "Bác sĩ";
                wsHandler.publishToReceptionist("examination_completed", Map.of(
                        "appointmentId", saved.getId(),
                        "patientName", patientName,
                        "doctorName", doctorName
                ));
            } catch (Exception ignored) {
                // Không để lỗi notification phá vỡ transaction
            }
        }

        return saved;
    }

    private void createUnpaidInvoiceForAppointment(Appointment apt) {
        try {
            // Tránh tạo trùng lặp
            if (invoiceRepository.findByAppointmentId(apt.getId()).isPresent()) {
                return;
            }

            long count = invoiceRepository.count();
            String invoiceCode = String.format("INV-%d-%04d", LocalDateTime.now().getYear(), count + 1);

            BigDecimal consultationFee = apt.getDoctor() != null && apt.getDoctor().getConsultationFee() != null
                    ? apt.getDoctor().getConsultationFee()
                    : BigDecimal.valueOf(150000);
            BigDecimal servicePrice = apt.getService() != null && apt.getService().getPrice() != null
                    ? apt.getService().getPrice()
                    : BigDecimal.ZERO;
            BigDecimal amount = consultationFee.add(servicePrice);

            String doctorName = apt.getDoctor() != null && apt.getDoctor().getUser() != null
                    ? apt.getDoctor().getUser().getName() : "Bác sĩ";
            StringBuilder desc = new StringBuilder("Phí khám - BS. ").append(doctorName);
            if (apt.getService() != null) {
                desc.append(" | Dịch vụ: ").append(apt.getService().getName());
            }

            Invoice invoice = Invoice.builder()
                    .invoiceCode(invoiceCode)
                    .appointment(apt)
                    .patient(apt.getPatient())
                    .patientName(apt.getPatientName())
                    .description(desc.toString())
                    .amount(amount)
                    .status(PaymentStatus.unpaid)
                    .method(null)
                    .paidAt(null)
                    .receivedBy(null)
                    .note(null)
                    .build();

            invoiceRepository.save(invoice);

            if (apt.getPatient() != null) {
                String amountStr = NumberFormat.getNumberInstance(new Locale("vi", "VN"))
                        .format(amount.longValue()) + "đ";
                notificationService.notifyUser(
                        apt.getPatient().getId(), "appointment",
                        "Yêu cầu thanh toán phí khám",
                        "Lượt khám của bạn đã hoàn tất. Vui lòng thanh toán số tiền " + amountStr + " tại quầy lễ tân."
                );
            }
        } catch (Exception ignored) {
            // Không phá vỡ transaction chính
        }
    }

    // ── Hủy lịch ────────────────────────────────────────────
    @Transactional
    @CacheEvict(value = "appointments_list", allEntries = true)
    public Appointment cancel(Integer id) {
        Appointment apt = findOne(id);

        if (apt.getStatus() == AppointmentStatus.done
                || apt.getStatus() == AppointmentStatus.in_progress
                || apt.getStatus() == AppointmentStatus.cancelled) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Không thể hủy lịch hẹn này");
        }

        apt.setStatus(AppointmentStatus.cancelled);
        Appointment saved = appointmentRepository.save(apt);

        // Gửi thông báo cho lễ tân
        wsHandler.publishToReceptionist("appointment_updated", Map.of(
                "appointmentId", saved.getId(),
                "status", "cancelled"
        ));

        // Gửi thông báo cho bác sĩ để cập nhật hàng chờ
        wsHandler.publishToDoctor(saved.getDoctor().getId(), "queue_updated",
                Map.of("doctorId", saved.getDoctor().getId()));

        // Gửi thông báo cho bệnh nhân nếu có tài khoản
        if (saved.getPatient() != null) {
            wsHandler.publishToPatient(saved.getPatient().getId(), "appointment_updated", Map.of(
                    "appointmentId", saved.getId(),
                    "status", "cancelled"
            ));
            // Lưu DB notification — bệnh nhân thấy trong chuông kể cả khi offline
            try {
                String dateStr = saved.getDate().format(VN_DATE);
                String timeStr = saved.getTime() != null ? saved.getTime() : "";
                notificationService.notifyUser(
                        saved.getPatient().getId(), "appointment",
                        "Lịch khám đã bị hủy",
                        "Lịch khám ngày " + dateStr + " lúc " + timeStr + " đã bị hủy. Vui lòng đặt lại nếu cần."
                );
            } catch (Exception ignored) {}
        }

        return saved;
    }
}
