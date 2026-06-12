import { useState, useEffect, useCallback } from 'react';
import { invoiceApi } from '../api/invoice.api';
import type { Invoice, InvoiceStats } from '../types/invoice.types';

/** Danh sách hoá đơn (receptionist / admin) */
export function useInvoices(params?: { date?: string; dateFrom?: string; dateTo?: string }, deps: any[] = []) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    invoiceApi.getAll(params)
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { invoices, setInvoices, loading, reload: load };
}

/** Hoá đơn của bệnh nhân đang đăng nhập */
export function useMyInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    invoiceApi.getMy()
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { invoices, loading, reload: load };
}

/** Thống kê doanh thu (admin) */
export function useInvoiceStats(params?: { dateFrom?: string; dateTo?: string; month?: string }, deps: any[] = []) {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    invoiceApi.getStats(params)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { stats, loading, reload: load };
}
