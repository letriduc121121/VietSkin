import api from '@/shared/lib/axios';
import type { Prescription } from '@/features/medical-records/types/medical-record.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export interface CreatePrescriptionDto {
  appointmentId: number;
  medicalRecordId?: number;
  note?: string;
  items: {
    medicineId?: number | null;
    medicineName: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    quantity?: number;
    note?: string;
  }[];
}

export const prescriptionApi = {
  /** Tạo đơn thuốc mới */
  create: (dto: CreatePrescriptionDto): Promise<Prescription> =>
    api.post('/prescriptions', dto).then(unwrap),

  /** Danh sách đơn thuốc theo hồ sơ bệnh án */
  getByMedicalRecord: (medicalRecordId: number): Promise<Prescription[]> =>
    api.get(`/prescriptions/medical-record/${medicalRecordId}`).then(unwrap),

  /** Danh sách đơn thuốc theo lịch hẹn */
  getByAppointment: (appointmentId: number): Promise<Prescription[]> =>
    api.get(`/prescriptions/appointment/${appointmentId}`).then(unwrap),

  /** Xóa đơn thuốc */
  delete: (id: number): Promise<void> =>
    api.delete(`/prescriptions/${id}`).then(unwrap),
};
