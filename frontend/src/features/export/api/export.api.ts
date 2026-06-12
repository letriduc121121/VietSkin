import api from '@/shared/lib/axios';

/** Tạo thẻ <a> ẩn để trình duyệt tải file về máy */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const exportApi = {
  /** In hóa đơn PDF — lễ tân / admin */
  downloadInvoicePdf: async (invoiceId: number) => {
    const res = await api.get(`/export/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
    triggerDownload(res.data, `invoice-${invoiceId}.pdf`);
  },

  /** Báo cáo doanh thu PDF — admin */
  downloadRevenuePdf: async (year?: number, month?: number) => {
    const params: any = {};
    if (year)  params.year  = year;
    if (month) params.month = month;
    const res = await api.get('/export/revenue/pdf', { params, responseType: 'blob' });
    const y = year  ?? new Date().getFullYear();
    const m = month ?? new Date().getMonth() + 1;
    triggerDownload(res.data, `revenue-${y}-${String(m).padStart(2,'0')}.pdf`);
  },

  /** Thống kê bệnh nhân Excel (4 sheet) — admin */
  downloadPatientStatsExcel: async () => {
    const res = await api.get('/export/stats/patients/excel', { responseType: 'blob' });
    triggerDownload(res.data, 'patient-stats.xlsx');
  },
};
