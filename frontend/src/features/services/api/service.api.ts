import api from '@/shared/lib/axios';
import type { Service, CreateServiceDto } from '../types/service.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const serviceApi = {
  /** Lấy danh sách dịch vụ (all=true để lấy cả inactive) */
  getAll: (params?: { all?: boolean }): Promise<Service[]> =>
    api.get('/services', { params }).then(unwrap),

  /** Tạo dịch vụ mới (admin) */
  create: (dto: CreateServiceDto): Promise<Service> =>
    api.post('/services', dto).then(unwrap),

  /** Cập nhật dịch vụ (admin) */
  update: (id: number, dto: Partial<CreateServiceDto>): Promise<Service> =>
    api.put(`/services/${id}`, dto).then(unwrap),

  /** Xoá dịch vụ (admin) */
  delete: (id: number): Promise<void> =>
    api.delete(`/services/${id}`).then(unwrap),
};
