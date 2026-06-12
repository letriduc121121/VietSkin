import api from '@/shared/lib/axios';
import type { PatientStats, ServiceStats } from '../types/stats.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const statsApi = {
  /** Thống kê bệnh nhân toàn diện — chỉ admin */
  getPatientStats: (): Promise<PatientStats> =>
    api.get('/stats/patients').then(unwrap),

  /** Thống kê dịch vụ (lượt + doanh thu theo dịch vụ) — chỉ admin */
  getServiceStats: (): Promise<ServiceStats> =>
    api.get('/stats/services').then(unwrap),
};
