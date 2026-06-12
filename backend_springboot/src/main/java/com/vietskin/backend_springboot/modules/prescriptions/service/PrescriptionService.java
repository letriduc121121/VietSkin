package com.vietskin.backend_springboot.modules.prescriptions.service;

import com.vietskin.backend_springboot.common.exception.AppException;
import com.vietskin.backend_springboot.common.websocket.AppWebSocketHandler;
import com.vietskin.backend_springboot.modules.appointments.entity.Appointment;
import com.vietskin.backend_springboot.modules.appointments.repository.AppointmentRepository;
import com.vietskin.backend_springboot.modules.doctors.entity.Doctor;
import com.vietskin.backend_springboot.modules.doctors.repository.DoctorRepository;
import com.vietskin.backend_springboot.modules.medical_records.entity.MedicalRecord;
import com.vietskin.backend_springboot.modules.medical_records.repository.MedicalRecordRepository;
import com.vietskin.backend_springboot.modules.medicines.repository.MedicineRepository;
import com.vietskin.backend_springboot.modules.notifications.service.NotificationService;
import com.vietskin.backend_springboot.modules.prescriptions.dto.CreatePrescriptionRequest;
import com.vietskin.backend_springboot.modules.prescriptions.dto.PrescriptionItemRequest;
import com.vietskin.backend_springboot.modules.prescriptions.entity.Prescription;
import com.vietskin.backend_springboot.modules.prescriptions.entity.PrescriptionItem;
import com.vietskin.backend_springboot.modules.prescriptions.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final MedicineRepository medicineRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final NotificationService notificationService;
    private final AppWebSocketHandler wsHandler;

    @Transactional
    public Prescription create(CreatePrescriptionRequest req, Integer doctorUserId) {
        Appointment apt = appointmentRepository.findById(req.getAppointmentId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Lịch hẹn không tồn tại"));

        Doctor doctor = doctorRepository.findByUserId(doctorUserId).orElse(null);

        Prescription prescription = new Prescription();
        prescription.setAppointment(apt);
        prescription.setNote(req.getNote());
        // Bệnh nhân & bác sĩ truy qua appointment (đã chuẩn hóa, không lưu trùng tại prescription).
        // Biến `doctor` vẫn dùng để lấy tên gửi thông báo bên dưới.

        if (req.getMedicalRecordId() != null) {
            MedicalRecord mr = medicalRecordRepository.findById(req.getMedicalRecordId()).orElse(null);
            prescription.setMedicalRecord(mr);
        }

        List<PrescriptionItem> items = new ArrayList<>();
        for (PrescriptionItemRequest itemReq : req.getItems()) {
            PrescriptionItem item = new PrescriptionItem();
            item.setMedicineName(itemReq.getMedicineName());
            item.setDosage(itemReq.getDosage());
            item.setFrequency(itemReq.getFrequency());
            item.setDuration(itemReq.getDuration());
            item.setQuantity(itemReq.getQuantity());
            item.setNote(itemReq.getNote());
            item.setPrescription(prescription);

            if (itemReq.getMedicineId() != null) {
                medicineRepository.findById(itemReq.getMedicineId())
                        .ifPresent(item::setMedicine);
            }
            items.add(item);
        }
        prescription.setItems(items);

        Prescription saved = prescriptionRepository.save(prescription);

        // Thông báo cho bệnh nhân khi bác sĩ kê đơn thuốc (chỉ online booking có tài khoản)
        if (apt.getPatient() != null) {
            try {
                String doctorName = (doctor != null && doctor.getUser() != null)
                        ? doctor.getUser().getName() : "Bác sĩ";
                int itemCount = req.getItems().size();

                notificationService.notifyUser(
                        apt.getPatient().getId(), "prescription",
                        "Đơn thuốc mới",
                        doctorName + " vừa kê " + itemCount + " loại thuốc cho bạn. "
                                + "Vui lòng nhận đơn tại quầy sau khi thanh toán."
                );

                // Ping WebSocket để chuông reload ngay nếu bệnh nhân đang online
                wsHandler.publishToPatient(apt.getPatient().getId(), "appointment_updated",
                        Map.of("appointmentId", apt.getId(), "status", "prescription_created"));
            } catch (Exception ignored) {}
        }

        return saved;
    }

    public Prescription findOne(Integer id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Đơn thuốc không tồn tại"));
    }

    public List<Prescription> findByAppointment(Integer appointmentId) {
        return prescriptionRepository.findByAppointmentId(appointmentId)
                .map(List::of).orElse(List.of());
    }

    public List<Prescription> findByMedicalRecord(Integer medicalRecordId) {
        return prescriptionRepository.findByMedicalRecordId(medicalRecordId);
    }

    public List<Prescription> findByPatient(Integer patientId) {
        return prescriptionRepository.findByAppointment_Patient_Id(patientId)
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void delete(Integer id) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Đơn thuốc không tồn tại"));
        prescriptionRepository.delete(p);
    }
}
