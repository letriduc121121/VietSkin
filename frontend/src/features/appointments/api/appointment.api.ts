import api from '@/shared/lib/axios';
import type { Appointment, AppointmentListParams, CreateAppointmentDto } from '../types/appointment.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const appointmentApi = {
  /** Lấy danh sách lịch hẹn có filter */
  getList: (params?: AppointmentListParams): Promise<Appointment[]> =>
    api.get('/appointments', { params }).then(unwrap),

  /** Hàng chờ theo bác sĩ + ngày (checked_in / in_progress) */
  getQueue: (doctorId: number, date: string): Promise<Appointment[]> =>
    api.get('/appointments/queue', { params: { doctorId, date } }).then(unwrap),

  /** Lịch theo bác sĩ + ngày (tất cả status) */
  getSchedule: (doctorId: number, date: string): Promise<Appointment[]> =>
    api.get('/appointments/schedule', { params: { doctorId, date } }).then(unwrap),

  /** Lịch hẹn của bệnh nhân đang đăng nhập */
  getMy: (): Promise<Appointment[]> =>
    api.get('/appointments/my').then(unwrap),

  /** Chi tiết 1 lịch hẹn */
  getById: (id: number): Promise<Appointment> =>
    api.get(`/appointments/${id}`).then(unwrap),

  /** Tra cứu lịch hẹn theo SĐT + ngày (cho lễ tân check-in) */
  lookup: (phone: string, date: string): Promise<Appointment[]> =>
    api.get('/appointments/lookup', { params: { phone, date } }).then(unwrap),

  /** Tạo lịch hẹn mới (bệnh nhân đặt online hoặc lễ tân tạo walk-in) */
  create: (dto: CreateAppointmentDto): Promise<Appointment> =>
    api.post('/appointments', dto).then(unwrap),

  /** Cập nhật trạng thái: confirmed / checked_in / in_progress / done */
  updateStatus: (id: number, status: string): Promise<Appointment> =>
    api.put(`/appointments/${id}/status`, { status }).then(unwrap),

  /** Huỷ lịch hẹn */
  cancel: (id: number): Promise<Appointment> =>
    api.put(`/appointments/${id}/cancel`).then(unwrap),
};
