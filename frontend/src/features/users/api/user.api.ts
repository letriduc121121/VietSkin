import api from '@/shared/lib/axios';
import type { UserProfile, UserRecord, CreateStaffDto } from '../types/user.types';
import type { Appointment } from '@/features/appointments/types/appointment.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const userApi = {
  // ─── Admin ────────────────────────────────────────────────────────────────

  /** Danh sách tất cả người dùng */
  getAll: (): Promise<UserRecord[]> =>
    api.get('/users').then(unwrap),

  /** Tìm bệnh nhân theo SĐT (lễ tân dùng khi tiếp nhận walk-in) */
  searchByPhone: (phone: string): Promise<{ id: number; name: string; phone: string }> =>
    api.get('/users/search', { params: { phone } }).then(unwrap),

  /** Chi tiết 1 user theo id (admin) */
  getById: (id: number): Promise<UserRecord> =>
    api.get(`/users/${id}`).then(unwrap),

  /** Lịch sử lịch hẹn của 1 bệnh nhân cụ thể (admin / receptionist) */
  getPatientAppointments: (patientId: number): Promise<Appointment[]> =>
    api.get(`/appointments/patient/${patientId}`).then(unwrap),

  /** Tạo tài khoản nhân viên */
  createStaff: (dto: CreateStaffDto): Promise<UserRecord> =>
    api.post('/users/staff', dto).then(unwrap),

  /** Cập nhật thông tin user */
  update: (id: number, dto: Record<string, any>): Promise<UserRecord> =>
    api.put(`/users/${id}`, dto).then(unwrap),

  /** Xoá user */
  delete: (id: number): Promise<void> =>
    api.delete(`/users/${id}`).then(unwrap),

  // ─── Current user ─────────────────────────────────────────────────────────

  /** Thông tin cá nhân user đang đăng nhập */
  getProfile: (): Promise<UserProfile> =>
    api.get('/users/profile').then(unwrap),

  /** Cập nhật hồ sơ cá nhân */
  updateProfile: (dto: Partial<UserProfile> & Record<string, any>): Promise<UserProfile> =>
    api.put('/users/profile', dto).then(unwrap),

  /** Đổi mật khẩu */
  changePassword: (dto: { currentPassword: string; newPassword: string }): Promise<void> =>
    api.put('/users/change-password', dto).then(unwrap),
};
