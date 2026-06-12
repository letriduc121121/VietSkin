import { useState, useEffect, useCallback } from 'react';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import { invoiceApi } from '@/features/invoices/api/invoice.api';
import { useSocket } from '@/shared/hooks/useSocket';
import type { Appointment } from '@/features/appointments/types/appointment.types';

/* ── Helpers ────────────────────────────────────────────────────────────── */

const CLINIC_BANK = {
  bankCode: 'MB',
  accountNo: '0123456789',
  accountName: 'PHONG KHAM DA LIEU VIETSKIN',
};

const todayISO = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const fmt = (n: number | string) => Number(n).toLocaleString('vi-VN') + 'đ';

const inputCls =
  'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c]/40';

function buildVietQR(amount: number, addInfo: string) {
  const base = `https://img.vietqr.io/image/${CLINIC_BANK.bankCode}-${CLINIC_BANK.accountNo}-compact2.png`;
  const params = new URLSearchParams({ amount: String(amount), addInfo, accountName: CLINIC_BANK.accountName });
  return `${base}?${params}`;
}

type PayMethod = 'cash' | 'bank_transfer' | 'qr_code';

interface AptDetail {
  id: number;
  patientName: string;
  patientPhone: string | null;
  doctor: { user: { name: string }; consultationFee: string };
  service: { name: string; price: string } | null;
  prescription: {
    items: { medicineName: string; quantity: number }[];
  } | null;
}

/* ── Payment Modal ──────────────────────────────────────────────────────── */
function PaymentModal({ apt, onClose, onSuccess }: {
  apt: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [detail, setDetail] = useState<AptDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [method, setMethod] = useState<PayMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    appointmentApi.getById(apt.id)
      .then(data => setDetail(data as any))
      .catch(() => setDetail({
        id: apt.id, patientName: apt.patientName, patientPhone: apt.patientPhone,
        doctor: apt.doctor, service: apt.service, prescription: null,
      }))
      .finally(() => setFetching(false));
  }, [apt.id]);

  const consultationFee = detail ? Number(detail.doctor.consultationFee) || 150000 : 0;
  const servicePrice = detail?.service ? Number(detail.service.price) : 0;
  const amount = consultationFee + servicePrice;
  const cashNum = Number(cashInput.replace(/\D/g, '')) || 0;
  const change = cashNum - amount;
  const addInfo = `VIETSKIN LH${apt.id}`;

  const handleSubmit = async () => {
    if (method === 'cash' && cashNum < amount) {
      setError('Số tiền nhận phải >= số tiền cần thanh toán'); return;
    }
    setSubmitting(true); setError('');
    try {
      await invoiceApi.create({ appointmentId: apt.id, paymentMethod: method, note: note || undefined } as any);
      setPaid(true);
      setTimeout(() => onSuccess(), 1400);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally { setSubmitting(false); }
  };

  const TABS: { key: PayMethod; label: string; icon: string }[] = [
    { key: 'cash', label: 'Tiền mặt', icon: '💵' },
    { key: 'bank_transfer', label: 'Chuyển khoản', icon: '🏦' },
    { key: 'qr_code', label: 'QR Code', icon: '📱' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold">Thu tiền khám</h3>
            <p className="text-xs text-gray-400 mt-0.5">{apt.patientName} · Lịch #{apt.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {paid ? (
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">Thanh toán thành công!</p>
                <p className="text-2xl font-bold text-[#1a3a5c] mt-1">{fmt(amount)}</p>
              </div>
            </div>
          ) : fetching ? (
            <div className="p-8 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Đang tải thông tin...</p>
            </div>
          ) : (
            <>
              {/* Chi tiết thanh toán */}
              <div className="px-6 pt-5 pb-4 bg-gray-50 border-b border-gray-100 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chi tiết thanh toán</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1a3a5c]" />
                    <span className="text-gray-700">Phí khám</span>
                    <span className="text-xs text-gray-400">{detail?.doctor.user.name}</span>
                  </div>
                  <span className="font-semibold">{fmt(consultationFee)}</span>
                </div>
                {detail?.service && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      <span className="text-gray-700">Dịch vụ</span>
                      <span className="text-xs text-gray-400">{detail.service.name}</span>
                    </div>
                    <span className="font-semibold">{fmt(servicePrice)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-200">
                  <span className="font-bold text-gray-800">Tổng thanh toán</span>
                  <span className="text-2xl font-bold text-[#1a3a5c]">{fmt(amount)}</span>
                </div>
              </div>

              {/* Phương thức */}
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phương thức</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TABS.map(t => (
                      <button key={t.key} onClick={() => { setMethod(t.key); setError(''); }}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
                          method === t.key ? 'border-[#1a3a5c] bg-blue-50 text-[#1a3a5c]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}>
                        <span className="text-xl">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {method === 'cash' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Tiền khách đưa</label>
                      <input type="text" inputMode="numeric" value={cashInput}
                        onChange={e => { const r = e.target.value.replace(/\D/g, ''); setCashInput(r ? Number(r).toLocaleString('vi-VN') : ''); }}
                        placeholder="Nhập số tiền..." className={inputCls} autoFocus />
                    </div>
                    {cashNum > 0 && (
                      <div className={`rounded-xl p-3 flex items-center justify-between font-bold ${change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        <span className="text-sm">{change >= 0 ? 'Tiền thừa trả lại' : 'Còn thiếu'}</span>
                        <span className="text-lg">{fmt(Math.abs(change))}</span>
                      </div>
                    )}
                  </div>
                )}

                {method === 'bank_transfer' && (
                  <div className="bg-blue-50 rounded-2xl p-4 space-y-2.5">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Thông tin tài khoản</p>
                    {[
                      { label: 'Ngân hàng', value: CLINIC_BANK.bankCode },
                      { label: 'Số tài khoản', value: CLINIC_BANK.accountNo },
                      { label: 'Chủ tài khoản', value: CLINIC_BANK.accountName },
                      { label: 'Số tiền', value: fmt(amount) },
                      { label: 'Nội dung CK', value: addInfo },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-blue-500">{r.label}</span>
                        <span className="text-sm font-bold text-blue-900 break-all">{r.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {method === 'qr_code' && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white border-2 border-gray-100 rounded-2xl p-3 shadow-sm">
                      <img src={buildVietQR(amount, addInfo)} alt="VietQR" className="w-52 h-52 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <p className="text-xs text-gray-400 text-center">Hỗ trợ tất cả ứng dụng ngân hàng Việt Nam</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Ghi chú (tuỳ chọn)</label>
                  <input type="text" value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Ghi chú hoá đơn..." className={inputCls} />
                </div>
                {error && <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</div>}
              </div>
            </>
          )}
        </div>

        {!paid && !fetching && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">Huỷ</button>
            <button onClick={handleSubmit} disabled={submitting || (method === 'cash' && cashNum < amount)}
              className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md">
              {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Đang xử lý...' : method === 'cash' ? 'Xác nhận thu tiền' : 'Đã nhận thanh toán'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function CollectPaymentPage() {
  const [apts, setApts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [payingApt, setPayingApt] = useState<Appointment | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    appointmentApi.getList({ status: 'done', date })
      .then(data => setApts((data ?? []).filter((a: Appointment) => !a.invoice || a.invoice.status === 'unpaid')))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { load(); }, [load]);

  useSocket(
    (event) => {
      if (event === 'appointment_updated') load();
    },
    { topics: ['/topic/appointments'] },
  );

  const handleSearch = () => setSearchQuery(search);

  const displayed = apts.filter(a =>
    !searchQuery ||
    a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.patientPhone?.includes(searchQuery)
  );

  const totalAmount = displayed.reduce((sum, a) => {
    const fee = Number(a.doctor?.consultationFee) || 150000;
    const svc = Number(a.service?.price) || 0;
    return sum + fee + svc;
  }, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thu tiền bệnh nhân</h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách bệnh nhân đã khám xong và chưa thanh toán
          </p>
        </div>
        {displayed.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3 text-right">
            <div className="text-xs text-orange-500 font-medium">Tổng cần thu</div>
            <div className="text-xl font-bold text-orange-600">{fmt(totalAmount)}</div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Tên bệnh nhân, SĐT..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
            />
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="py-2 px-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none" />
          <button onClick={load} title="Làm mới"
            className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={handleSearch}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3a5c] text-white rounded-xl text-sm font-semibold hover:bg-[#15304e] transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
          <div className="col-span-1">Giờ</div>
          <div className="col-span-3">Bệnh nhân</div>
          <div className="col-span-2">SĐT</div>
          <div className="col-span-2">Bác sĩ</div>
          <div className="col-span-2">Dịch vụ</div>
          <div className="col-span-1 text-right">Số tiền</div>
          <div className="col-span-1 text-right">Thao tác</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-700">Không có bệnh nhân chờ thu tiền</h3>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Thử tìm kiếm với từ khoá khác.' : 'Tất cả đã thanh toán hoặc chưa khám xong.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayed.map(apt => {
              const fee = Number(apt.doctor?.consultationFee) || 150000;
              const svc = Number(apt.service?.price) || 0;
              const total = fee + svc;
              return (
                <div key={apt.id} className="grid grid-cols-12 items-center px-5 py-4 hover:bg-orange-50/40 transition-colors">
                  <div className="col-span-1">
                    <div className="font-bold text-sm text-[#1a3a5c]">{apt.time}</div>
                  </div>
                  <div className="col-span-3 pr-2">
                    <div className="font-semibold text-sm">{apt.patientName}</div>
                    {apt.symptoms && <div className="text-xs text-gray-400 truncate">{apt.symptoms}</div>}
                  </div>
                  <div className="col-span-2 text-sm text-gray-500">{apt.patientPhone}</div>
                  <div className="col-span-2 text-sm text-gray-500 truncate">{apt.doctor?.user?.name}</div>
                  <div className="col-span-2 text-sm text-gray-500 truncate">
                    {apt.service?.name ?? <span className="text-gray-300">—</span>}
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="font-bold text-sm text-orange-600">{fmt(total)}</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => setPayingApt(apt)}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all shadow-sm">
                      Thu tiền
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer tổng */}
        {displayed.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-orange-50 flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              {displayed.length} bệnh nhân chờ thu tiền
            </span>
            <span className="font-bold text-orange-600">{fmt(totalAmount)}</span>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {payingApt && (
        <PaymentModal
          apt={payingApt}
          onClose={() => setPayingApt(null)}
          onSuccess={() => { setPayingApt(null); load(); }}
        />
      )}
    </div>
  );
}
