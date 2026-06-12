package com.vietskin.backend_springboot.common.config;

import com.vietskin.backend_springboot.common.enums.AppointmentStatus;
import com.vietskin.backend_springboot.common.enums.Gender;
import com.vietskin.backend_springboot.common.enums.PaymentMethod;
import com.vietskin.backend_springboot.common.enums.PaymentStatus;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.doctor_work_days.entity.DoctorWorkDay;
import com.vietskin.backend_springboot.modules.doctor_work_days.repository.DoctorWorkDayRepository;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.invoices.entity.Invoice;
import com.vietskin.backend_springboot.modules.invoices.repository.InvoiceRepository;
import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import com.vietskin.backend_springboot.modules.medical_records.repository.MedicalRecordRepository;
import com.vietskin.backend_springboot.modules.medicines.entity.Medicine;
import com.vietskin.backend_springboot.modules.medicines.repository.MedicineRepository;
import com.vietskin.backend_springboot.modules.notifications.entity.Notification;
import com.vietskin.backend_springboot.modules.notifications.repository.NotificationRepository;
import com.vietskin.backend_springboot.modules.prescriptions.entity.Prescription;
import com.vietskin.backend_springboot.modules.prescriptions.entity.PrescriptionItem;
import com.vietskin.backend_springboot.modules.prescriptions.repository.PrescriptionRepository;
import com.vietskin.backend_springboot.modules.rooms.entity.Room;
import com.vietskin.backend_springboot.modules.rooms.repository.RoomRepository;
import com.vietskin.backend_springboot.modules.specialties.entity.Service;
import com.vietskin.backend_springboot.modules.specialties.repository.ServiceRepository;
import com.vietskin.backend_springboot.modules.users.entity.PatientProfile;
import com.vietskin.backend_springboot.modules.users.entity.Role;
import com.vietskin.backend_springboot.modules.users.entity.User;
import com.vietskin.backend_springboot.modules.users.repository.PatientProfileRepository;
import com.vietskin.backend_springboot.modules.users.repository.RoleRepository;
import com.vietskin.backend_springboot.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

/**
 * DataInitializer — Seed dữ liệu mẫu khi khởi động lần đầu.
 * Chỉ chạy khi bảng roles chưa có dữ liệu.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final RoleRepository            roleRepo;
    private final UserRepository            userRepo;
    private final PatientProfileRepository  patientProfileRepo;
    private final DoctorRepository          doctorRepo;
    private final RoomRepository            roomRepo;
    private final DoctorWorkDayRepository   workDayRepo;
    private final ServiceRepository         serviceRepo;
    private final MedicineRepository        medicineRepo;
    private final AppointmentRepository     appointmentRepo;
    private final InvoiceRepository         invoiceRepo;
    private final MedicalRecordRepository   medicalRecordRepo;
    private final PrescriptionRepository    prescriptionRepo;
    private final NotificationRepository    notificationRepo;
    private final PasswordEncoder           passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (roleRepo.count() > 0) {
            log.info("✅ DB đã có dữ liệu — bỏ qua seed.");
            return;
        }

        log.info("🌱 Bắt đầu seed dữ liệu...");

        // ── 1. Roles ──────────────────────────────────────────
        Role roleAdmin  = roleRepo.save(Role.builder().code("admin")        .name("Quản trị viên").description("Quản trị toàn bộ hệ thống").build());
        Role roleDoctor = roleRepo.save(Role.builder().code("doctor")       .name("Bác sĩ")       .description("Bác sĩ chuyên môn da liễu").build());
        Role roleRec    = roleRepo.save(Role.builder().code("receptionist") .name("Lễ tân")        .description("Nhân viên lễ tân tiếp đón").build());
        Role rolePatient= roleRepo.save(Role.builder().code("patient")      .name("Bệnh nhân")    .description("Người dùng cuối - bệnh nhân").build());
        log.info("  ✔ 4 roles");

        // ── 2. Users ──────────────────────────────────────────
        String hash = passwordEncoder.encode("Vietskin@123");

        User uAdmin  = userRepo.save(User.builder().username("admin")       .passwordHash(hash).role(roleAdmin) .name("Quản trị viên")  .email("admin@vietskin.vn") .phone("0901234567").build());
        User uRec    = userRepo.save(User.builder().username("letan01")     .passwordHash(hash).role(roleRec)   .name("Phạm Thu Hà")    .email("letan@vietskin.vn") .phone("0901234568").build());
        User uBsA    = userRepo.save(User.builder().username("bacsi01")     .passwordHash(hash).role(roleDoctor).name("BS. Nguyễn Văn A").email("bsa@vietskin.vn")   .phone("0901234569").build());
        User uBsB    = userRepo.save(User.builder().username("bacsi02")     .passwordHash(hash).role(roleDoctor).name("BS. Trần Thị B")  .email("bsb@vietskin.vn")   .phone("0901234570").build());
        User uP1     = userRepo.save(User.builder().username("benhnhan01")  .passwordHash(hash).role(rolePatient).name("Lê Văn C")       .email("lvc@gmail.com")     .phone("0901234571").build());
        User uP2     = userRepo.save(User.builder().username("benhnhan02")  .passwordHash(hash).role(rolePatient).name("Nguyễn Thị D")   .email("ntd@gmail.com")     .phone("0901234572").build());
        log.info("  ✔ 6 users");

        // ── 3. Patient profiles ───────────────────────────────
        patientProfileRepo.save(PatientProfile.builder()
                .user(uP1).patientCode("BN" + String.format("%06d", uP1.getId()))
                .dateOfBirth(LocalDate.of(1995, 5, 15)).gender(Gender.male)
                .address("123 Đường ABC, Q.1, TP.HCM")
                .allergies("Dị ứng penicillin").bloodType("O+").emergencyContact("0987654321")
                .build());
        patientProfileRepo.save(PatientProfile.builder()
                .user(uP2).patientCode("BN" + String.format("%06d", uP2.getId()))
                .dateOfBirth(LocalDate.of(1998, 8, 20)).gender(Gender.female)
                .address("456 Đường XYZ, Q.3, TP.HCM")
                .allergies("Không có").bloodType("A+").emergencyContact("0987654322")
                .build());
        log.info("  ✔ 2 patient profiles");

        // ── 4. Doctors ────────────────────────────────────────
        Doctor docA = doctorRepo.save(Doctor.builder()
                .user(uBsA).specialty("Da liễu tổng quát").experience("10 năm").degree("Thạc sĩ Y khoa")
                .description("Chuyên điều trị mụn, nám, tàn nhang và các bệnh da liễu thường gặp.")
                .keywords("[\"mụn\",\"nám\",\"tàn nhang\",\"viêm da\"]")
                .consultationFee(BigDecimal.valueOf(150000)).build());
        Doctor docB = doctorRepo.save(Doctor.builder()
                .user(uBsB).specialty("Da liễu thẩm mỹ").experience("8 năm").degree("Bác sĩ CKI")
                .description("Chuyên laser, peel da, trẻ sẹo và các liệu trình thẩm mỹ da.")
                .keywords("[\"laser\",\"peel da\",\"trẻ sẹo\",\"thẩm mỹ\"]")
                .consultationFee(BigDecimal.valueOf(200000)).build());
        log.info("  ✔ 2 doctors");

        // ── 5. Rooms ──────────────────────────────────────────
        Room room1 = roomRepo.save(Room.builder().name("Phòng khám 1").doctor(docA).build());
        Room room2 = roomRepo.save(Room.builder().name("Phòng khám 2").doctor(docB).build());
        roomRepo.save(Room.builder().name("Phòng khám 3").build());
        roomRepo.save(Room.builder().name("Phòng khám 4").build());
        log.info("  ✔ 4 phòng khám");

        // ── 6. Work days — T2→T7 trong tháng hiện tại ────────
        YearMonth ym = YearMonth.now();
        List<DoctorWorkDay> workDays = new ArrayList<>();
        for (int d = 1; d <= ym.lengthOfMonth(); d++) {
            LocalDate date = ym.atDay(d);
            if (date.getDayOfWeek().getValue() == 7) continue; // bỏ Chủ nhật
            workDays.add(DoctorWorkDay.builder().doctor(docA).room(room1).date(date).build());
            workDays.add(DoctorWorkDay.builder().doctor(docB).room(room2).date(date).build());
        }
        workDayRepo.saveAll(workDays);
        log.info("  ✔ {} ngày làm việc (tháng {})", workDays.size(), ym);

        // ── 7. Services ───────────────────────────────────────
        Service svcTQ  = serviceRepo.save(Service.builder().name("Khám tổng quát da")
                .description("Thăm khám toàn diện tình trạng da, chẩn đoán và tư vấn phác đồ điều trị phù hợp.")
                .price(BigDecimal.valueOf(150000)).duration(30).category("Khám thường").build());
        Service svcMun = serviceRepo.save(Service.builder().name("Khám mụn")
                .description("Chẩn đoán chuyên sâu các loại mụn, xây dựng phác đồ kiểm soát và điều trị tận gốc.")
                .price(BigDecimal.valueOf(200000)).duration(30).category("Khám thường").build());
        serviceRepo.save(Service.builder().name("Khám dị ứng")
                .description("Xác định nguyên nhân và mức độ dị ứng da, chỉ định xét nghiệm và điều trị phù hợp.")
                .price(BigDecimal.valueOf(200000)).duration(30).category("Khám thường").build());
        serviceRepo.save(Service.builder().name("Khám viêm da")
                .description("Chẩn đoán viêm da tiếp xúc, chàm, vảy nến và các bệnh viêm da mãn tính.")
                .price(BigDecimal.valueOf(200000)).duration(30).category("Khám thường").build());
        Service svcTaiKham = serviceRepo.save(Service.builder().name("Tái khám")
                .description("Tái khám theo hẹn của bác sĩ, đánh giá tiến triển và điều chỉnh phác đồ.")
                .price(BigDecimal.valueOf(100000)).duration(20).category("Tái khám").build());
        log.info("  ✔ 5 services");

        // ── 8. Medicines ──────────────────────────────────────
        Medicine med1 = medicineRepo.save(Medicine.builder().name("Differin 0.1% gel")     .unit("tuýp").category("Thuốc bôi") .description("Điều trị mụn trứng cá").build());
        Medicine med2 = medicineRepo.save(Medicine.builder().name("Azithromycin 500mg")    .unit("viên").category("Kháng sinh") .description("Kháng sinh nhóm macrolide").build());
        medicineRepo.save(Medicine.builder().name("Isotretinoin 20mg")    .unit("viên").category("Uống")      .description("Điều trị mụn nặng").build());
        medicineRepo.save(Medicine.builder().name("Hydroquinone 4% cream").unit("tuýp").category("Thuốc bôi") .description("Điều trị nám da").build());
        medicineRepo.save(Medicine.builder().name("Clobetasol 0.05% cream").unit("tuýp").category("Corticoid").description("Điều trị viêm da cơ địa").build());
        medicineRepo.save(Medicine.builder().name("Tretinoin 0.05% cream").unit("tuýp").category("Thuốc bôi") .description("Chống lão hóa, trị mụn").build());

        // 20 loại thuốc da liễu bổ sung
        medicineRepo.save(Medicine.builder().name("Ketoconazole 2% cream").unit("tuýp").category("Thuốc bôi").description("Kháng nấm bôi ngoài da, điều trị hắc lào, lang ben, nấm kẽ").build());
        medicineRepo.save(Medicine.builder().name("Benzoyl Peroxide 5% gel").unit("tuýp").category("Thuốc bôi").description("Diệt khuẩn mụn trứng cá, làm giảm mụn viêm và giảm sừng hóa cổ nang lông").build());
        medicineRepo.save(Medicine.builder().name("Acyclovir 200mg").unit("viên").category("Uống").description("Kháng virus, điều trị các bệnh Herpes simplex, Zona thần kinh, thủy đậu").build());
        medicineRepo.save(Medicine.builder().name("Fucidin 2% cream").unit("tuýp").category("Thuốc bôi").description("Kháng sinh bôi ngoài da điều trị nhiễm trùng da do tụ cầu hoặc liên cầu").build());
        medicineRepo.save(Medicine.builder().name("Loratadine 10mg").unit("viên").category("Kháng histamin").description("Kháng histamin thế hệ 2 điều trị dị ứng, mề đay, mẩn ngứa").build());
        medicineRepo.save(Medicine.builder().name("Tacrolimus 0.03% ointment").unit("tuýp").category("Thuốc bôi").description("Thuốc ức chế miễn dịch tại chỗ điều trị viêm da cơ địa từ vừa đến nặng").build());
        medicineRepo.save(Medicine.builder().name("Salicylic Acid 5% ointment").unit("lọ").category("Thuốc bôi").description("Tiêu sừng, bạt sừng điều trị vảy nến, dày sừng, vảy cá").build());
        medicineRepo.save(Medicine.builder().name("Itraconazole 100mg").unit("viên").category("Uống").description("Thuốc kháng nấm toàn thân điều trị nấm móng, nấm da diện rộng").build());
        medicineRepo.save(Medicine.builder().name("Erythromycin 4% solution").unit("lọ").category("Thuốc bôi").description("Dung dịch bôi kháng sinh điều trị mụn trứng cá viêm nhẹ đến vừa").build());
        medicineRepo.save(Medicine.builder().name("Terbinafine 1% cream").unit("tuýp").category("Thuốc bôi").description("Kháng nấm bôi ngoài da, hiệu quả cao điều trị nấm chân, nấm bẹn, nấm thân").build());
        medicineRepo.save(Medicine.builder().name("Betamethasone 0.1% cream").unit("tuýp").category("Corticoid").description("Corticoid hoạt lực mạnh kháng viêm, trị chàm, tổ đỉa, viêm da tiếp xúc nặng").build());
        medicineRepo.save(Medicine.builder().name("Zinc Oxide 10% ointment").unit("tuýp").category("Thuốc bôi").description("Làm dịu da, sát khuẩn nhẹ, hỗ trợ điều trị hăm tã, viêm da tiếp xúc").build());
        medicineRepo.save(Medicine.builder().name("Cephalexin 500mg").unit("viên").category("Kháng sinh").description("Kháng sinh Cephalosporin thế hệ 1 điều trị nhiễm trùng da và mô mềm").build());
        medicineRepo.save(Medicine.builder().name("Methotrexate 2.5mg").unit("viên").category("Uống").description("Thuốc ức chế miễn dịch điều trị vảy nến nặng không đáp ứng với điều trị thông thường").build());
        medicineRepo.save(Medicine.builder().name("Cetirizine 10mg").unit("viên").category("Kháng histamin").description("Kháng histamin điều trị mề đay mãn tính, ngứa do dị ứng thời tiết").build());
        medicineRepo.save(Medicine.builder().name("Adapalene 0.1% cream").unit("tuýp").category("Thuốc bôi").description("Retinoid bôi trị mụn ẩn, mụn đầu đen và ngừa hình thành nhân mụn mới").build());
        medicineRepo.save(Medicine.builder().name("Calamine lotion").unit("lọ").category("Thuốc bôi").description("Lotion làm dịu da, giảm ngứa tức thì do thủy đậu, sởi, côn trùng đốt").build());
        medicineRepo.save(Medicine.builder().name("Mupirocin 2% ointment").unit("tuýp").category("Thuốc bôi").description("Thuốc mỡ kháng sinh bôi ngoài da trị chốc lở, viêm nang lông, vết thương hở nhẹ").build());
        medicineRepo.save(Medicine.builder().name("Prednisolone 5mg").unit("viên").category("Corticoid").description("Corticoid uống kháng viêm mạnh điều trị đợt bùng phát viêm da nặng").build());
        medicineRepo.save(Medicine.builder().name("Isotretinoin 10mg").unit("viên").category("Uống").description("Retinoid uống điều trị mụn trứng cá dạng nang bọc nặng không đáp ứng kháng sinh").build());

        log.info("  ✔ 26 medicines");

        // ── 9. Appointments ───────────────────────────────────
        LocalDate today    = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        Appointment apt1 = appointmentRepo.save(Appointment.builder()
                .patient(uP1).patientName(uP1.getName()).patientPhone("0901234571").patientEmail("lvc@gmail.com")
                .doctor(docA).service(svcTQ)
                .date(today).time("09:00").status(AppointmentStatus.done)
                .symptoms("Mụn viêm nhiều ở má và trán").queueNumber(1).build());

        appointmentRepo.save(Appointment.builder()
                .patient(uP2).patientName(uP2.getName()).patientPhone("0901234572").patientEmail("ntd@gmail.com")
                .doctor(docB).service(svcMun)
                .date(today).time("10:00").status(AppointmentStatus.confirmed)
                .symptoms("Nám hai bên má").build());

        appointmentRepo.save(Appointment.builder()
                .patient(uP1).patientName(uP1.getName()).patientPhone("0901234571")
                .doctor(docA).service(svcTaiKham)
                .date(tomorrow).time("14:00").status(AppointmentStatus.pending)
                .symptoms("Tái khám mụn").build());

        Appointment apt4 = appointmentRepo.save(Appointment.builder()
                .patientName("Trần Văn E").patientPhone("0933456789")
                .doctor(docA).service(svcTQ)
                .date(today).time("11:00").status(AppointmentStatus.checked_in)
                .symptoms("Da mẩn đỏ, ngứa toàn thân").queueNumber(2).build());
        log.info("  ✔ 4 appointments");

        // ── 10. Invoices ──────────────────────────────────────
        invoiceRepo.save(Invoice.builder()
                .invoiceCode("INV-2026-0001").appointment(apt1)
                .patient(uP1).patientName(uP1.getName())
                .description("Phí khám - BS. Nguyễn Văn A")
                .amount(docA.getConsultationFee()).status(PaymentStatus.paid)
                .method(PaymentMethod.cash).paidAt(LocalDateTime.now())
                .receivedBy(uRec).note("Thanh toán tiền mặt tại quầy").build());

        invoiceRepo.save(Invoice.builder()
                .invoiceCode("INV-2026-0002").appointment(apt4)
                .patientName("Trần Văn E")
                .description("Phí khám - BS. Nguyễn Văn A")
                .amount(docA.getConsultationFee()).status(PaymentStatus.paid)
                .method(PaymentMethod.qr_code).paidAt(LocalDateTime.now())
                .receivedBy(uRec).build());
        log.info("  ✔ 2 invoices");

        // ── 11. Medical record + Prescription ─────────────────
        MedicalRecord mr1 = medicalRecordRepo.save(MedicalRecord.builder()
                .appointment(apt1).patient(uP1).doctor(docA)
                .symptoms("Mụn viêm nhiều ở má và trán, da dầu, nặn mụn nhiều")
                .skinType("da dầu").lesionLocation("má, trán, cằm")
                .diagnosis("Mụn trứng cá thể viêm mức độ trung bình (Grade II)")
                .treatment("Kết hợp kháng sinh uống và thuốc bôi tại chỗ")
                .note("Hạn chế đồ ngọt, dầu mỡ. Không tự nặn mụn. Dùng kem chống nắng SPF50+")
                .followUpDate(today.plusDays(14))
                .build());

        Prescription px = Prescription.builder()
                .appointment(apt1).medicalRecord(mr1)
                .note("Uống thuốc sau ăn. Bôi thuốc sau khi rửa mặt sạch buổi tối")
                .build();
        px.getItems().add(PrescriptionItem.builder()
                .prescription(px).medicine(med2).medicineName("Azithromycin 500mg")
                .dosage("1 viên").frequency("1 lần/ngày").duration("7 ngày").quantity(7)
                .note("Uống sau ăn sáng").build());
        px.getItems().add(PrescriptionItem.builder()
                .prescription(px).medicine(med1).medicineName("Differin 0.1% gel")
                .dosage("Bôi lớp mỏng").frequency("1 lần/ngày vào buổi tối").duration("30 ngày").quantity(1)
                .note("Tránh vùng quanh mắt").build());
        prescriptionRepo.save(px);
        log.info("  ✔ 1 medical record + 1 prescription (2 items)");

        // ── 12. Notifications ─────────────────────────────────
        notificationRepo.save(Notification.builder()
                .user(uP1).type("appointment").title("Lịch hẹn đã được xác nhận")
                .message("Lịch khám hôm nay lúc 09:00 với BS. Nguyễn Văn A đã được xác nhận.")
                .isRead(true).build());
        notificationRepo.save(Notification.builder()
                .user(uP2).type("reminder").title("Nhắc nhở lịch khám")
                .message("Bạn có lịch khám hôm nay lúc 10:00 với BS. Trần Thị B. Vui lòng đến đúng giờ.")
                .isRead(false).build());
        notificationRepo.save(Notification.builder()
                .targetRoleId(roleDoctor.getId()).type("system").title("Cập nhật hệ thống")
                .message("Hệ thống đã được cập nhật lên phiên bản mới nhất.")
                .isRead(false).build());
        log.info("  ✔ 3 notifications");

        log.info("");
        log.info("============================================");
        log.info("🎉 SEED DỮ LIỆU THÀNH CÔNG!");
        log.info("============================================");
        log.info("  4 roles | 6 users | 2 bác sĩ + lịch T2-T7");
        log.info("  5 dịch vụ | 6 thuốc");
        log.info("  4 lịch hẹn | 2 hoá đơn | 1 bệnh án | 1 đơn thuốc");
        log.info("--------------------------------------------");
        log.info("  Mật khẩu: Vietskin@123");
        log.info("  admin         0901234567  Quản trị viên");
        log.info("  receptionist  0901234568  Phạm Thu Hà");
        log.info("  doctor        0901234569  BS. Nguyễn Văn A");
        log.info("  doctor        0901234570  BS. Trần Thị B");
        log.info("  patient       0901234571  Lê Văn C");
        log.info("  patient       0901234572  Nguyễn Thị D");
        log.info("============================================");
    }
}
