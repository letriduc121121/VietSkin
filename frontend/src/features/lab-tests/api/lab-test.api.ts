import api from '@/shared/lib/axios';
import type { LabTest, TestOrder, CreateTestOrderDto } from '../types/lab-test.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const labTestApi = {
  /** Danh sách xét nghiệm có sẵn trong hệ thống */
  getAll: (): Promise<LabTest[]> =>
    api.get('/lab-tests').then(unwrap),

  /** Tạo phiếu chỉ định xét nghiệm */
  createOrder: (dto: CreateTestOrderDto): Promise<TestOrder> =>
    api.post('/test-orders', dto).then(unwrap),
};
