import { useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '@/features/auth/api/auth.api';
import { useSocket } from '@/shared/hooks/useSocket';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { serviceApi } from '@/features/services/api/service.api';
import { invoiceApi } from '@/features/invoices/api/invoice.api';
import { userApi } from '@/features/users/api/user.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';
import type { Doctor } from '@/features/doctors/types/doctor.types';
import type { Service } from '@/features/services/types/service.types';

// Cấu hình ngân hàng phòng khám (thay đổi theo thực tế)
const CLINIC_BANK = {
  bankCode: 'MB',          // Mã ngân hàng (VCB, TCB, MB, ACB, ...)
  accountNo: '0123456789', // Số tài khoản
  accountName: 'PHONG KHAM DA LIEU VIETSKIN',
};

interface FoundPatient { id: number; name: string; phone: string }
type QueueItem = Appointment;

type PayMethod = 'cash' | 'bank_transfer' | 'qr_code';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  confirmed:   { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-[#1a3a5c]' },
  checked_in:  { label: 'Đã check-in',  cls: 'bg-teal-100 text-teal-700' },
  in_progress: { label: 'Đang khám',    cls: 'bg-purple-100 text-purple-700' },
  done:        { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Đã huỷ',       cls: 'bg-red-100 text-red-600' },
  no_show:     { label: 'Không đến',    cls: 'bg-gray-100 text-gray-500' },
};

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c]/40';
const fmt = (n: number | string) => Number(n).toLocaleString('vi-VN') + 'đ';

function buildVietQR(amount: number, addInfo: string) {
  const base = `https://img.vietqr.io/image/${CLINIC_BANK.bankCode}-${CLINIC_BANK.accountNo}-compact2.png`;
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName: CLINIC_BANK.accountName,
  });
  return `${base}?${params}`;
}

// ─── Types cho chi tiết appointment khi fetch ────────────────────────────────
interface AptDetail {
  id: number;
  patientName: string;
  patientPhone: string | null;
  doctor: { user: { name: string }; consultationFee: string };
  service: { name: string; price: string } | null;
  prescription: {
    items: { medicineName: string; dosage: string; frequency: string; duration: string; quantity: number }[];
  } | null;
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  apt, onClose, onSuccess,
}: { apt: Appointment; onClose: () => void; onSuccess: () => void }) {
  const [detail, setDetail]     = useState<AptDetail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [method, setMethod]     = useState<PayMethod>('cash');
  const [cashInput, setCashInput] = useState('');
  const [note, setNote]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [paid, setPaid]         = useState(false);

  // Fetch chi tiết appointment để lấy giá chính xác
  useEffect(() => {
    appointmentApi.getById(apt.id)
      .then(data => setDetail(data as any))
      .catch(() => {
        // Fallback về dữ liệu từ danh sách nếu fetch lỗi
        setDetail({
          id: apt.id,
          patientName: apt.patientName,
          patientPhone: apt.patientPhone,
          doctor: apt.doctor,
          service: apt.service,
          prescription: null,
        });
      })
      .finally(() => setFetching(false));
  }, [apt.id]);

  const consultationFee = detail ? Number(detail.doctor.consultationFee) || 150000 : 0;
  const servicePrice    = detail?.service ? Number(detail.service.price) : 0;
  const amount          = consultationFee + servicePrice;
  const presItems       = detail?.prescription?.items ?? [];

  const cashNum  = Number(cashInput.replace(/\D/g, '')) || 0;
  const change   = cashNum - amount;
  const addInfo  = `VIETSKIN LH${apt.id}`;

  const handleSubmit = async () => {
    if (method === 'cash' && cashNum < amount) {
      setError('Số tiền nhận phải >= số tiền cần thanh toán');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await invoiceApi.create({
        appointmentId: apt.id,
        paymentMethod: method,
        note: note || undefined,
      } as any);
      setPaid(true);
      setTimeout(() => { onSuccess(); }, 1400);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };

  const TABS: { key: PayMethod; label: string; icon: string }[] = [
    { key: 'cash',          label: 'Tiền mặt',     icon: '💵' },
    { key: 'bank_transfer', label: 'Chuyển khoản', icon: '🏦' },
    { key: 'qr_code',       label: 'QR Code',      icon: '📱' },
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

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1">
          {paid ? (
            /* ── Thanh toán thành công ── */
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">Thanh toán thành công!</p>
                <p className="text-2xl font-bold text-[#1a3a5c] mt-1">{fmt(amount)}</p>
                <p className="text-sm text-gray-400 mt-1">{detail?.doctor.user.name}</p>
              </div>
            </div>

          ) : fetching ? (
            /* ── Loading skeleton ── */
            <div className="p-8 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Đang tải thông tin...</p>
            </div>

          ) : (
            <>
              {/* ── Breakdown chi tiết ── */}
              <div className="px-6 pt-5 pb-4 bg-gray-50 border-b border-gray-100 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chi tiết thanh toán</p>

                {/* Phí khám */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1a3a5c] flex-shrink-0" />
                    <span className="text-gray-700">Phí khám</span>
                    <span className="text-xs text-gray-400">{detail?.doctor.user.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{fmt(consultationFee)}</span>
                </div>

                {/* Dịch vụ (nếu có) */}
                {detail?.service && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                      <span className="text-gray-700">Dịch vụ</span>
                      <span className="text-xs text-gray-400">{detail.service.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{fmt(servicePrice)}</span>
                  </div>
                )}

                {/* Tổng */}
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-200">
                  <span className="font-bold text-gray-800">Tổng thanh toán</span>
                  <span className="text-2xl font-bold text-[#1a3a5c]">{fmt(amount)}</span>
                </div>

                {/* Đơn thuốc — thông tin, không thu */}
                {presItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn thuốc kê</p>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full font-bold">Thu tiền thuốc riêng</span>
                    </div>
                    <div className="space-y-1.5">
                      {presItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium">{item.medicineName}</span>
                          <span className="text-gray-400">
                            {[item.dosage, item.frequency, `${item.duration}`].filter(Boolean).join(' · ')} · SL: {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Phương thức thanh toán ── */}
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phương thức thanh toán</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TABS.map(t => (
                      <button
                        key={t.key}
                        onClick={() => { setMethod(t.key); setError(''); }}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
                          method === t.key
                            ? 'border-[#1a3a5c] bg-blue-50 text-[#1a3a5c]'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        <span className="text-xl">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Tiền mặt ── */}
                {method === 'cash' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Tiền khách đưa</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cashInput}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setCashInput(raw ? Number(raw).toLocaleString('vi-VN') : '');
                        }}
                        placeholder="Nhập số tiền..."
                        className={inputCls}
                        autoFocus
                      />
                    </div>
                    {cashNum > 0 && (
                      <div className={`rounded-xl p-3 flex items-center justify-between font-bold ${
                        change >= 0
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        <span className="text-sm">{change >= 0 ? 'Tiền thừa trả lại' : 'Còn thiếu'}</span>
                        <span className="text-lg">{fmt(Math.abs(change))}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Chuyển khoản ── */}
                {method === 'bank_transfer' && (
                  <div className="bg-blue-50 rounded-2xl p-4 space-y-2.5">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Thông tin tài khoản</p>
                    {[
                      { label: 'Ngân hàng',      value: CLINIC_BANK.bankCode },
                      { label: 'Số tài khoản',   value: CLINIC_BANK.accountNo },
                      { label: 'Chủ tài khoản',  value: CLINIC_BANK.accountName },
                      { label: 'Số tiền',         value: fmt(amount) },
                      { label: 'Nội dung CK',    value: addInfo },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-blue-500 flex-shrink-0">{r.label}</span>
                        <span className="text-sm font-bold text-blue-900 text-right break-all">{r.value}</span>
                      </div>
                    ))}
                    <p className="text-xs text-blue-500 pt-2 border-t border-blue-200">
                      Bấm xác nhận sau khi đã nhận được tiền trong tài khoản.
                    </p>
                  </div>
                )}

                {/* ── QR Code (VietQR) ── */}
                {method === 'qr_code' && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider self-start">Quét mã QR để thanh toán</p>
                    <div className="bg-white border-2 border-gray-100 rounded-2xl p-3 shadow-sm">
                      <img
                        src={buildVietQR(amount, addInfo)}
                        alt="VietQR"
                        className="w-52 h-52 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="w-full bg-indigo-50 rounded-xl p-3 space-y-1.5">
                      {[
                        { label: 'Ngân hàng', value: CLINIC_BANK.bankCode },
                        { label: 'Số tiền',   value: fmt(amount) },
                        { label: 'Nội dung',  value: addInfo },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between text-xs">
                          <span className="text-indigo-500">{r.label}</span>
                          <span className="font-bold text-indigo-800">{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 text-center">Hỗ trợ tất cả ứng dụng ngân hàng Việt Nam (VietQR)</p>
                  </div>
                )}

                {/* Ghi chú */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Ghi chú (tuỳ chọn)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Ghi chú hoá đơn..."
                    className={inputCls}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer — cố định dưới cùng */}
        {!paid && !fetching && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
              Huỷ
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (method === 'cash' && cashNum < amount)}
              className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-green-500/20"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Đang xử lý...' : method === 'cash' ? 'Xác nhận thu tiền' : 'Đã nhận thanh toán'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AppointmentListPage() {
  const [apts, setApts] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState<number | null>(null);
  const [date, setDate] = useState(todayISO());
  const [doctorId, setDoctorId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Queue state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);

  // Walk-in modal state
  const [showModal, setShowModal] = useState(false);
  const [walkinMode, setWalkinMode] = useState<'existing' | 'new'>('existing');
  const [searchPhone, setSearchPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundPatient, setFoundPatient] = useState<FoundPatient | null>(null);
  const [searchDone, setSearchDone] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDateOfBirth, setNewDateOfBirth] = useState('');
  const [newGender, setNewGender] = useState<'' | 'male' | 'female' | 'other'>('');
  const [newAddress, setNewAddress] = useState('');
  const [phoneCheckState, setPhoneCheckState] = useState<'idle' | 'checking' | 'exists' | 'free'>('idle');
  const [wDoctorId, setWDoctorId] = useState('');
  const [doctorAvail, setDoctorAvail] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [wServiceId, setWServiceId] = useState('');
  const [wSymptoms, setWSymptoms] = useState('');
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState('');

  // Payment modal state
  const [payingApt, setPayingApt] = useState<Appointment | null>(null);

  // Real-time new booking notification
  const [newBookingAlert, setNewBookingAlert] = useState<{ date: string; patientName: string } | null>(null);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    doctorApi.getAll().then(data => setDoctors(data ?? []));
    serviceApi.getAll().then(data => setServices(data ?? []));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, any> = {};
    if (date) params.date = date;
    if (doctorId) params.doctorId = Number(doctorId);
    if (status) params.status = status;
    appointmentApi.getList(params).then(data => setApts(data ?? [])).finally(() => setLoading(false));
  }, [date, doctorId, status]);

  const loadQueue = useCallback(() => {
    appointmentApi.getList({ date: todayISO() })
      .then(all => {
        setQueue((all ?? []).filter(a => ['checked_in', 'in_progress'].includes(a.status)));
      })
      .finally(() => setQueueLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadQueue(); }, [loadQueue]);

  useSocket(
    (event, data) => {
      if (event === 'appointment_updated') {
        load(); loadQueue();
      } else if (event === 'appointment_created') {
        // Nếu ngày đặt trùng filter hiện tại → reload ngay
        if (!date || data?.date === date) {
          load(); loadQueue();
        }
        // Luôn hiển thị banner thông báo lịch mới (kể cả ngày khác)
        if (data?.date && data?.patientName) {
          if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
          setNewBookingAlert({ date: data.date, patientName: data.patientName });
          alertTimerRef.current = setTimeout(() => setNewBookingAlert(null), 8000);
        }
      }
    },
    { topics: ['/topic/appointments'] },
  );

  const resetModal = () => {
    setWalkinMode('existing');
    setSearchPhone(''); setFoundPatient(null); setSearchDone(false);
    setNewName(''); setNewPhone(''); setPhoneCheckState('idle');
    setNewDateOfBirth(''); setNewGender(''); setNewAddress('');
    setWDoctorId(''); setDoctorAvail('idle');
    setWServiceId(''); setWSymptoms(''); setWError('');
  };

  const handleDoctorChange = async (id: string) => {
    setWDoctorId(id);
    if (!id) { setDoctorAvail('idle'); return; }
    setDoctorAvail('checking');
    try {
      const slots = await doctorApi.getSlots(Number(id), todayISO());
      setDoctorAvail(slots.workDay ? 'available' : 'unavailable');
    } catch { setDoctorAvail('idle'); }
  };

  const handleNewPhoneBlur = async () => {
    const phone = newPhone.trim();
    if (phone.length < 9) { setPhoneCheckState('idle'); return; }
    setPhoneCheckState('checking');
    try {
      await userApi.searchByPhone(phone);
      setPhoneCheckState('exists');
    } catch { setPhoneCheckState('free'); }
  };
  const openModal = () => { resetModal(); setShowModal(true); };
  const closeModal = () => { setShowModal(false); };

  const handleSearchPatient = async () => {
    if (!searchPhone.trim()) return;
    setSearching(true); setFoundPatient(null); setSearchDone(false); setWError('');
    try {
      const patient = await userApi.searchByPhone(searchPhone.trim());
      setFoundPatient(patient);
      setSearchDone(true);
    } catch { setSearchDone(true); }
    finally { setSearching(false); }
  };

  const handleSubmit = async () => {
    setWError('');
    const isNew = walkinMode === 'new';
    if (isNew && (!newName.trim() || !newPhone.trim())) { setWError('Vui lòng nhập họ tên và số điện thoại'); return; }
    if (isNew && phoneCheckState === 'exists') { setWError('Số điện thoại này đã có tài khoản. Vui lòng dùng tab "Bệnh nhân cũ".'); return; }
    if (!isNew && !foundPatient) { setWError('Vui lòng tìm và chọn bệnh nhân'); return; }
    if (!wDoctorId) { setWError('Vui lòng chọn bác sĩ'); return; }
    setWLoading(true);
    try {
      let patientId: number | undefined, patientName: string, patientPhone: string;
      if (isNew) {
        const regRes = await authApi.register({
          name: newName.trim(),
          phone: newPhone.trim(),
          password: newPhone.trim(),
          dateOfBirth: newDateOfBirth || undefined,
          gender: newGender || undefined,
          address: newAddress.trim() || undefined,
        });
        patientId = regRes.user.id;
        patientName = newName.trim(); patientPhone = newPhone.trim();
      } else {
        patientId = foundPatient!.id; patientName = foundPatient!.name; patientPhone = foundPatient!.phone;
      }
      await appointmentApi.create({
        patientId, patientName, patientPhone,
        doctorId:  Number(wDoctorId),
        serviceId: wServiceId ? Number(wServiceId) : undefined,
        date: todayISO(),
        symptoms: wSymptoms || undefined,
        isWalkin: true,
      } as any);
      closeModal(); load(); loadQueue();
    } catch (e: any) { setWError(e?.response?.data?.message || 'Có lỗi xảy ra'); }
    finally { setWLoading(false); }
  };

  const handleConfirm = async (id: number) => {
    setActioning(id);
    try { await appointmentApi.updateStatus(id, 'confirmed'); setApts(p => p.map(a => a.id === id ? { ...a, status: 'confirmed' } : a)); }
    finally { setActioning(null); }
  };

  const handleCheckin = async (id: number) => {
    setActioning(id);
    try { await appointmentApi.updateStatus(id, 'checked_in'); load(); loadQueue(); }
    finally { setActioning(null); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Huỷ lịch hẹn này?')) return;
    setActioning(id);
    try { await appointmentApi.cancel(id); setApts(p => p.map(a => a.id === id ? { ...a, status: 'cancelled' } : a)); }
    finally { setActioning(null); }
  };

  const handleSearch = () => { setSearchQuery(search); load(); };

  const STATUS_PRIORITY: Record<string, number> = {
    pending: 0, confirmed: 1, checked_in: 2, in_progress: 3, done: 4, cancelled: 5, no_show: 6,
  };

  const displayed = apts
    .filter(a => !searchQuery || a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || a.patientPhone?.includes(searchQuery))
    .sort((a, b) => {
      const pd = (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9);
      if (pd !== 0) return pd;
      return a.time.localeCompare(b.time);
    });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý lịch hẹn</h1>
          <p className="text-sm text-gray-500 mt-1">{displayed.length} lịch hẹn</p>
        </div>
        <button onClick={openModal} className="flex items-center gap-2 bg-[#1a3a5c] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all shadow-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Tạo phiếu khám
        </button>
      </div>

      {/* Banner thông báo lịch mới đặt real-time */}
      {newBookingAlert && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
            </span>
            <span className="text-sm text-blue-800">
              Lịch mới:{' '}
              <strong>{newBookingAlert.patientName}</strong>
              {' — '}
              <button
                className="font-bold underline hover:text-blue-600 transition-colors"
                onClick={() => { setDate(newBookingAlert.date); setNewBookingAlert(null); }}
              >
                {newBookingAlert.date.split('-').reverse().join('/')}
              </button>
              <span className="text-blue-500 text-xs ml-1">(bấm để xem)</span>
            </span>
          </div>
          <button onClick={() => setNewBookingAlert(null)} className="text-blue-400 hover:text-blue-700 ml-4 text-lg leading-none">×</button>
        </div>
      )}

      {/* Main layout */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* LEFT: Filters + Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2.5">
            {/* Hàng 1: search + ngày */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text" value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Tên bệnh nhân, SĐT..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                />
              </div>
              <input
                type="date" value={date} onChange={e => setDate(e.target.value)}
                className="py-2 px-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
              />
            </div>
            {/* Hàng 2: bác sĩ + trạng thái + nút */}
            <div className="flex gap-2 items-center">
              <select value={doctorId} onChange={e => setDoctorId(e.target.value)}
                className="flex-1 py-2 px-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10">
                <option value="">Tất cả bác sĩ</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.user.name}</option>)}
              </select>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="flex-1 py-2 px-3 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10">
                <option value="">Tất cả trạng thái</option>
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={load} title="Làm mới"
                className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all text-gray-500 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={handleSearch}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3a5c] text-white rounded-xl text-sm font-semibold hover:bg-[#15304e] transition-all flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <div className="col-span-1">Giờ</div>
              <div className="col-span-3">Bệnh nhân</div>
              <div className="col-span-2">SĐT</div>
              <div className="col-span-2">Bác sĩ</div>
              <div className="col-span-2">Trạng thái</div>
              <div className="col-span-2">Thao tác</div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" /></div>
            ) : displayed.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><div className="text-3xl mb-2">📋</div><p className="text-sm">Không tìm thấy lịch hẹn nào</p></div>
            ) : (
              <div className="divide-y divide-gray-50">
                {displayed.map(apt => (
                  <div key={apt.id} className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="col-span-1">
                      <div className="font-bold text-sm text-[#1a3a5c]">{apt.time}</div>
                      {apt.queueNumber && <div className="text-[10px] text-teal-600 font-bold">STT #{apt.queueNumber}</div>}
                    </div>
                    <div className="col-span-3 pr-2">
                      <div className="font-semibold text-sm truncate">{apt.patientName}</div>
                      {apt.symptoms && <div className="text-xs text-gray-400 truncate">{apt.symptoms}</div>}
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">{apt.patientPhone}</div>
                    <div className="col-span-2 text-sm text-gray-500 truncate">{apt.doctor.user.name}</div>
                    <div className="col-span-2">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold w-fit ${STATUS_CFG[apt.status]?.cls}`}>
                          {STATUS_CFG[apt.status]?.label}
                        </span>
                        {apt.status === 'done' && apt.invoice && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-600 w-fit">
                            Đã thu tiền
                          </span>
                        )}
                        {apt.status === 'done' && !apt.invoice && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-600 w-fit">
                            Chưa thu tiền
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 flex gap-1.5 flex-wrap">
                      {apt.status === 'pending' && (
                        <button onClick={() => handleConfirm(apt.id)} disabled={actioning === apt.id}
                          className="text-xs px-2.5 py-1.5 bg-[#1a3a5c] text-white rounded-lg font-bold hover:bg-[#0f2540] transition-all disabled:opacity-50">
                          {actioning === apt.id ? '...' : 'Xác nhận'}
                        </button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button onClick={() => handleCheckin(apt.id)} disabled={actioning === apt.id}
                          className="text-xs px-2.5 py-1.5 bg-teal-500 text-white rounded-lg font-bold hover:bg-teal-600 transition-all disabled:opacity-50">
                          {actioning === apt.id ? '...' : 'Check-in'}
                        </button>
                      )}
                      {apt.status === 'done' && !apt.invoice && (
                        <button
                          onClick={() => setPayingApt(apt)}
                          className="text-xs px-2.5 py-1.5 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all shadow-sm"
                        >
                          Thu tiền
                        </button>
                      )}
                      {['pending', 'confirmed'].includes(apt.status) && (
                        <button onClick={() => handleCancel(apt.id)} disabled={actioning === apt.id}
                          className="text-xs px-2.5 py-1.5 border border-red-200 text-red-500 rounded-lg font-bold hover:bg-red-50 transition-all">Huỷ</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Queue */}
        <div className="lg:col-span-1">
          <QueuePanel queue={queue} loading={queueLoading} />
        </div>
      </div>

      {/* Modal tạo phiếu khám */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold">Tạo phiếu khám</h3>
                <p className="text-xs text-gray-400 mt-0.5">Bệnh nhân đến trực tiếp — cấp STT ngay</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Mode tabs */}
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                {(['existing', 'new'] as const).map(mode => (
                  <button key={mode} onClick={() => { setWalkinMode(mode); setWError(''); }}
                    className={`flex-1 py-2.5 text-sm font-bold transition-all ${walkinMode === mode ? 'bg-[#1a3a5c] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                    {mode === 'existing' ? 'Bệnh nhân cũ' : 'Bệnh nhân mới'}
                  </button>
                ))}
              </div>

              {walkinMode === 'existing' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase block">Tìm theo số điện thoại</label>
                  <div className="flex gap-2">
                    <input type="tel" value={searchPhone} onChange={e => { setSearchPhone(e.target.value); setFoundPatient(null); setSearchDone(false); }}
                      onKeyDown={e => e.key === 'Enter' && handleSearchPatient()} placeholder="09xx xxx xxx" className={inputCls + ' flex-1'} />
                    <button onClick={handleSearchPatient} disabled={searching || !searchPhone.trim()}
                      className="px-4 py-2.5 bg-[#1a3a5c] text-white rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all disabled:opacity-60 whitespace-nowrap">
                      {searching ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Tìm'}
                    </button>
                  </div>
                  {searchDone && (foundPatient ? (
                    <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                      <div className="w-10 h-10 bg-[#1a3a5c] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">{foundPatient.name.charAt(0)}</div>
                      <div><div className="font-bold text-sm">{foundPatient.name}</div><div className="text-xs text-gray-500">{foundPatient.phone}</div></div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                      Không tìm thấy. <button onClick={() => setWalkinMode('new')} className="font-bold underline ml-1">Đăng ký mới?</button>
                    </div>
                  ))}
                </div>
              )}

              {walkinMode === 'new' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Họ tên *</label>
                      <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nguyễn Văn A" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">SĐT *</label>
                      <div className="relative">
                        <input
                          type="tel" value={newPhone}
                          onChange={e => { setNewPhone(e.target.value); setPhoneCheckState('idle'); }}
                          onBlur={handleNewPhoneBlur}
                          placeholder="09xx xxx xxx"
                          className={`${inputCls} pr-8 ${phoneCheckState === 'exists' ? 'border-red-400 focus:border-red-400' : phoneCheckState === 'free' ? 'border-green-400 focus:border-green-400' : ''}`}
                        />
                        {phoneCheckState === 'checking' && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        )}
                        {phoneCheckState === 'exists' && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </span>
                        )}
                        {phoneCheckState === 'free' && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </span>
                        )}
                      </div>
                      {phoneCheckState === 'exists' && (
                        <p className="text-xs text-red-500 mt-1">
                          SĐT đã có tài khoản.{' '}
                          <button onClick={() => { setWalkinMode('existing'); setSearchPhone(newPhone); setPhoneCheckState('idle'); }}
                            className="font-bold underline">Dùng tab bệnh nhân cũ?</button>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">Tài khoản tạo tự động, mật khẩu mặc định là SĐT.</div>

                  {/* ── Thông tin bổ sung ── */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Ngày sinh</label>
                      <input
                        type="date"
                        value={newDateOfBirth}
                        onChange={e => setNewDateOfBirth(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Giới tính</label>
                      <select
                        value={newGender}
                        onChange={e => setNewGender(e.target.value as any)}
                        className={inputCls}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Địa chỉ</label>
                    <input
                      type="text"
                      value={newAddress}
                      onChange={e => setNewAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường, quận, TP..."
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-5 space-y-3">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin khám</div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Bác sĩ *</label>
                  <select value={wDoctorId} onChange={e => handleDoctorChange(e.target.value)}
                    className={`${inputCls} ${doctorAvail === 'unavailable' ? 'border-amber-400 focus:border-amber-400' : doctorAvail === 'available' ? 'border-green-400 focus:border-green-400' : ''}`}>
                    <option value="">Chọn bác sĩ</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.user.name} — {Number(d.consultationFee).toLocaleString('vi-VN')}đ
                      </option>
                    ))}
                  </select>
                  {doctorAvail === 'checking' && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                      Đang kiểm tra lịch làm việc...
                    </p>
                  )}
                  {doctorAvail === 'available' && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Bác sĩ có lịch làm việc hôm nay
                    </p>
                  )}
                  {doctorAvail === 'unavailable' && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Bác sĩ không có lịch làm việc hôm nay, vẫn có thể tạo phiếu
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">
                    Dịch vụ <span className="font-normal text-gray-400 normal-case">(tuỳ chọn)</span>
                  </label>
                  <select value={wServiceId} onChange={e => setWServiceId(e.target.value)} className={inputCls}>
                    <option value="">Không có dịch vụ</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {Number(s.price).toLocaleString('vi-VN')}đ
                        {s.duration ? ` (${s.duration} phút)` : ''}
                      </option>
                    ))}
                  </select>
                  {wServiceId && (() => {
                    const svc = services.find(s => String(s.id) === wServiceId);
                    const doctor = doctors.find(d => String(d.id) === wDoctorId);
                    const total = (svc ? Number(svc.price) : 0) + (doctor ? Number(doctor.consultationFee) : 0);
                    return svc ? (
                      <div className="mt-2 flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2 text-xs">
                        <span className="text-purple-600 font-medium">{svc.name}</span>
                        <span className="font-bold text-purple-700">
                          {total > 0 ? `Tổng: ${total.toLocaleString('vi-VN')}đ` : `${Number(svc.price).toLocaleString('vi-VN')}đ`}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Triệu chứng</label>
                  <textarea value={wSymptoms} onChange={e => setWSymptoms(e.target.value)} rows={2} placeholder="Mô tả triệu chứng..." className={inputCls + ' resize-none'} />
                </div>
                <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Bệnh nhân sẽ được cấp số thứ tự ngay khi tạo phiếu.
                </div>
              </div>

              {wError && <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{wError}</div>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">Huỷ</button>
              <button onClick={handleSubmit} disabled={wLoading}
                className="flex-1 py-2.5 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-md">
                {wLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {wLoading ? 'Đang xử lý...' : 'Tạo phiếu & Cấp STT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thu tiền */}
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

/* ── QueuePanel ─────────────────────────────────────────────────────────────── */
function QueuePanel({ queue, loading }: { queue: QueueItem[]; loading: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const grouped = queue.reduce<Record<string, QueueItem[]>>((acc, q) => {
    const key = q.doctor.user.name;
    (acc[key] ??= []).push(q);
    return acc;
  }, {});

  const toggle = (name: string) => setExpanded(p => p === name ? null : name);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-base">Hàng chờ hôm nay</h2>
        <span className="text-xs px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full font-bold">
          {queue.length} người
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : queue.length === 0 ? (
        <div className="p-10 text-center text-gray-400">
          <div className="text-3xl mb-2">🪑</div>
          <p className="text-sm">Chưa có ai trong hàng chờ</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-[560px] overflow-y-auto">
          {Object.entries(grouped).map(([docName, items]) => {
            const inProgress = items.find(q => q.status === 'in_progress');
            const isOpen = expanded === docName;
            return (
              <div key={docName}>
                {/* Doctor summary row */}
                <button
                  onClick={() => toggle(docName)}
                  className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c] flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {docName.replace(/^BS\.\s*/i, '').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{docName}</div>
                    {inProgress && (
                      <div className="text-xs text-purple-600 font-medium truncate">
                        Đang khám: {inProgress.patientName}
                      </div>
                    )}
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full font-bold flex-shrink-0">
                    {items.length} chờ
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded patient list */}
                {isOpen && (
                  <div className="bg-gray-50 border-t border-gray-100 divide-y divide-gray-100">
                    {items.map((q, i) => (
                      <div key={q.id} className="px-5 py-2.5 flex items-center gap-3 pl-8">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          q.status === 'in_progress' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                        }`}>
                          {q.queueNumber ?? i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{q.patientName}</div>
                          <div className="text-xs text-gray-400">{q.time}</div>
                        </div>
                        {q.status === 'in_progress' && (
                          <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold flex-shrink-0">
                            Đang khám
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
