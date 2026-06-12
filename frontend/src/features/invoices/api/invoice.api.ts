import api from '@/shared/lib/axios';
import type { Invoice, InvoiceStats, CreateInvoiceDto } from '../types/invoice.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const invoiceApi = {
  // ─── Receptionist / Admin ─────────────────────────────────────────────────

  /** Danh sách hoá đơn có filter */
  getAll: (params?: { date?: string; dateFrom?: string; dateTo?: string }): Promise<Invoice[]> =>
    api.get('/invoices', { params }).then(unwrap),

  /** Thống kê doanh thu (admin) */
  getStats: (params?: { dateFrom?: string; dateTo?: string; month?: string }): Promise<InvoiceStats> =>
    api.get('/invoices/stats', { params }).then(unwrap),

  /** Chi tiết 1 hoá đơn */
  getById: (id: number): Promise<Invoice> =>
    api.get(`/invoices/${id}`).then(unwrap),

  /** Tạo hoá đơn thanh toán */
  create: (dto: CreateInvoiceDto): Promise<Invoice> =>
    api.post('/invoices', dto).then(unwrap),

  // ─── Patient ──────────────────────────────────────────────────────────────

  /** Hoá đơn của bệnh nhân đang đăng nhập */
  getMy: (): Promise<Invoice[]> =>
    api.get('/invoices/my').then(unwrap),
};
