import api from '@/shared/lib/axios';
import type { Doctor, AdminDoctor, DoctorSlotData, Degree, Specialty, UpdateDoctorDto } from '../types/doctor.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const doctorApi = {
  // ─── Public / Patient ─────────────────────────────────────────────────────

  /** Danh sách bác sĩ đang hoạt động (public) */
  getAll: (): Promise<Doctor[]> =>
    api.get('/doctors').then(unwrap),

  /** Chi tiết 1 bác sĩ */
  getById: (id: number): Promise<Doctor> =>
    api.get(`/doctors/${id}`).then(unwrap),

  /** Slot khám còn trống theo ngày */
  getSlots: (doctorId: number, date: string): Promise<DoctorSlotData> =>
    api.get(`/doctors/${doctorId}/slots`, { params: { date } }).then(unwrap),

  // ─── Admin ────────────────────────────────────────────────────────────────

  /** Toàn bộ bác sĩ kể cả inactive (admin) */
  getAdminAll: (): Promise<AdminDoctor[]> =>
    api.get('/doctors/admin/all').then(unwrap),

  /** Cập nhật thông tin bác sĩ (admin) */
  update: (id: number, dto: UpdateDoctorDto): Promise<Doctor> =>
    api.put(`/doctors/${id}`, dto).then(unwrap),

  /** Bật / tắt trạng thái hoạt động (admin) */
  toggleActive: (id: number): Promise<AdminDoctor> =>
    api.put(`/doctors/${id}/toggle-active`).then(unwrap),

  // ─── Lookup data ─────────────────────────────────────────────────────────

  /** Danh sách chuyên khoa */
  getSpecialties: (): Promise<Specialty[]> =>
    api.get('/specialties').then(unwrap),

  /** Danh sách học vị */
  getDegrees: (): Promise<Degree[]> =>
    api.get('/degrees').then(unwrap),
};
