import api from '@/shared/lib/axios';
import type { Medicine } from '../types/medicine.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const medicineApi = {
  /** Lấy toàn bộ danh sách thuốc */
  getAll: (params?: { search?: string }): Promise<Medicine[]> =>
    api.get('/medicines', { params }).then(unwrap),

  /** Lấy thông tin chi tiết một loại thuốc */
  getOne: (id: number): Promise<Medicine> =>
    api.get(`/medicines/${id}`).then(unwrap),

  /** Tạo mới thuốc */
  create: (data: Omit<Medicine, 'id' | 'createdAt' | 'active'>): Promise<Medicine> =>
    api.post('/medicines', data).then(unwrap),

  /** Cập nhật thuốc */
  update: (id: number, data: Omit<Medicine, 'id' | 'createdAt' | 'active'>): Promise<Medicine> =>
    api.put(`/medicines/${id}`, data).then(unwrap),

  /** Xóa thuốc (soft delete) */
  delete: (id: number): Promise<Medicine> =>
    api.delete(`/medicines/${id}`).then(unwrap),
};
