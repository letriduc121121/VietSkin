import { useState, useEffect } from 'react';
import { invoiceApi } from '@/features/invoices/api/invoice.api';
import { printInvoice } from '@/features/invoices/utils/printInvoice';
import type { Invoice } from '@/features/invoices/types/invoice.types';

const METHOD_CFG: Record<string, { label: string; cls: string; icon: string }> = {
  cash:          { label: 'Tiền mặt',     cls: 'bg-green-100 text-green-700',   icon: '💵' },
  qr_code:       { label: 'QR Code',      cls: 'bg-indigo-100 text-indigo-700', icon: '📱' },
  bank_transfer: { label: 'Chuyển khoản', cls: 'bg-blue-100 text-blue-700',     icon: '🏦' },
  card:          { label: 'Thẻ',          cls: 'bg-amber-100 text-amber-700',   icon: '💳' },
};

const fmt  = (n: string | number) => Number(n).toLocaleString('vi-VN') + 'đ';
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default function PatientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);

  useEffect(() => {
    invoiceApi.getMy()
      .then(data => setInvoices(data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Lịch sử thanh toán</h1>
        <p className="text-sm text-gray-500 mt-1">Tất cả hoá đơn khám của bạn</p>
      </div>

      {/* Summary */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Tổng lần khám</p>
            <p className="text-3xl font-bold text-[#1a3a5c] mt-1">{invoices.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Tổng đã thanh toán</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{fmt(totalPaid)}</p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold">Danh sách hoá đơn</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">🧾</div>
            <p className="text-sm font-medium">Bạn chưa có hoá đơn nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {invoices.map(inv => {
              const isPaid = inv.status === 'paid';
              const method = METHOD_CFG[inv.method] ?? { label: inv.method, cls: 'bg-gray-100 text-gray-600', icon: '💰' };
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelected(inv)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">{inv.invoiceCode}</span>
                      {isPaid ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${method.cls}`}>
                          {method.icon} {method.label}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700">
                          ⏳ Chưa thanh toán
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{inv.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {inv.appointment ? `${fmtDate(inv.appointment.date)} · ${inv.appointment.time}` : fmtDate(inv.paidAt || inv.createdAt)}
                      {inv.appointment?.doctor && ` · ${inv.appointment.doctor.user.name}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`text-base font-bold ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>{fmt(inv.amount)}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isPaid ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-base">Chi tiết hoá đơn</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selected.invoiceCode}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Thông tin lịch khám */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thông tin khám</p>
                {selected.appointment && (
                  <>
                    <Row label="Ngày khám" value={fmtDate(selected.appointment.date)} />
                    <Row label="Giờ khám" value={selected.appointment.time} />
                    {selected.appointment.doctor && (
                      <Row label="Bác sĩ" value={selected.appointment.doctor.user.name} />
                    )}
                    {selected.appointment.service && (
                      <Row label="Dịch vụ" value={selected.appointment.service.name} />
                    )}
                  </>
                )}
                <Row label="Mô tả" value={selected.description} />
              </div>

              {/* Thanh toán */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thanh toán</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Phương thức</span>
                  {selected.status === 'paid' ? (
                    (() => {
                      const m = METHOD_CFG[selected.method];
                      return m ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${m.cls}`}>{m.icon} {m.label}</span>
                      ) : <span className="text-sm font-semibold">{selected.method}</span>;
                    })()
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-orange-100 text-orange-700">Chưa thanh toán</span>
                  )}
                </div>
                {selected.status === 'paid' && (
                  <Row label="Thời gian" value={new Date(selected.paidAt || selected.createdAt).toLocaleString('vi-VN')} />
                )}
                {selected.receiver && <Row label="Thu ngân" value={selected.receiver.name} />}
                {selected.note && <Row label="Ghi chú" value={selected.note} />}
              </div>

              {/* Tổng */}
              <div className={`flex items-center justify-between rounded-xl px-4 py-4 ${selected.status === 'paid' ? 'bg-green-50' : 'bg-orange-50'}`}>
                <span className="font-bold text-sm">{selected.status === 'paid' ? 'Tổng đã thanh toán' : 'Tổng cần thanh toán'}</span>
                <span className={`text-2xl font-bold ${selected.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>{fmt(selected.amount)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => printInvoice(selected)}
                  className="flex-1 py-2.5 bg-[#1a3a5c] text-white rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  In hoá đơn
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}
