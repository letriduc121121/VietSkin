# Biểu đồ lớp (Class Diagram) - Hệ thống VietSkin

Dưới đây là biểu đồ lớp thể hiện các thực thể (entities) và mối quan hệ giữa chúng, được trích xuất trực tiếp từ cấu trúc cơ sở dữ liệu (`schema.prisma`).

```mermaid
classDiagram
    %% ==============================
    %% NHÓM QUẢN LÝ NGƯỜI DÙNG & VAI TRÒ
    %% ==============================
    class Role {
        +Int id
        +String code
        +String name
        +Boolean active
    }

    class User {
        +Int id
        +String username
        +String name
        +String phone
        +String email
        +Boolean active
    }

    class PatientProfile {
        +Int id
        +String patientCode
        +DateTime dateOfBirth
        +Gender gender
        +String address
        +String citizenId
        +String bloodType
        +String allergies
    }

    class Doctor {
        +Int id
        +String specialty
        +String experience
        +String degree
        +Decimal consultationFee
        +Boolean active
    }

    %% ==============================
    %% NHÓM LỊCH LÀM VIỆC & PHÒNG KHÁM
    %% ==============================
    class Room {
        +Int id
        +String name
        +Boolean active
    }

    class DoctorWorkDay {
        +Int id
        +DateTime date
    }

    class TimeSlot {
        +Int id
        +DateTime date
        +String slotTime
        +Boolean isBlocked
    }

    %% ==============================
    %% NHÓM LỊCH HẸN & DỊCH VỤ
    %% ==============================
    class Service {
        +Int id
        +String name
        +Decimal price
        +Int duration
        +Boolean active
    }

    class Appointment {
        +Int id
        +String patientName
        +String patientPhone
        +DateTime date
        +String time
        +AppointmentStatus status
        +String symptoms
        +Int queueNumber
    }

    %% ==============================
    %% NHÓM BỆNH ÁN & HÓA ĐƠN
    %% ==============================
    class MedicalRecord {
        +Int id
        +String symptoms
        +String skinType
        +String lesionLocation
        +String diagnosis
        +String treatment
        +DateTime followUpDate
    }

    class Invoice {
        +Int id
        +String invoiceCode
        +Decimal amount
        +PaymentStatus status
        +PaymentMethod method
    }

    %% ==============================
    %% NHÓM ĐƠN THUỐC
    %% ==============================
    class Prescription {
        +Int id
        +String note
    }

    class PrescriptionItem {
        +Int id
        +String medicineName
        +String dosage
        +String frequency
        +Int quantity
    }

    class Medicine {
        +Int id
        +String name
        +String unit
    }

    %% ==============================
    %% CÁC MỐI QUAN HỆ (RELATIONSHIPS)
    %% ==============================

    %% Users & Roles
    Role "1" -- "*" User : assigned to
    User "1" -- "0..1" PatientProfile : has
    User "1" -- "0..1" Doctor : acts as

    %% Doctor Schedules
    Doctor "0..1" -- "1" Room : assigned to
    Doctor "1" -- "*" DoctorWorkDay : works on
    Room "1" -- "*" DoctorWorkDay : scheduled in
    Doctor "1" -- "*" TimeSlot : has slots

    %% Appointments
    User "0..1" -- "*" Appointment : books (Patient)
    Doctor "1" -- "*" Appointment : handles
    Service "0..1" -- "*" Appointment : requires
    
    %% Medical Records
    Appointment "0..1" -- "0..1" MedicalRecord : leads to
    User "0..1" -- "*" MedicalRecord : owns (Patient)
    Doctor "0..1" -- "*" MedicalRecord : creates
    
    %% Invoices
    Appointment "0..1" -- "0..1" Invoice : paid via
    User "0..1" -- "*" Invoice : pays (Patient)
    User "0..1" -- "*" Invoice : collects (Receptionist)
    
    %% Prescriptions
    Appointment "0..1" -- "0..1" Prescription : gets
    MedicalRecord "0..1" -- "0..1" Prescription : contains
    Doctor "0..1" -- "*" Prescription : prescribes
    User "0..1" -- "*" Prescription : belongs to
    
    Prescription "1" -- "*" PrescriptionItem : includes
    Medicine "0..1" -- "*" PrescriptionItem : references
    

```
