import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { serviceApi } from '@/features/services/api/service.api';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import type { Doctor } from '@/features/doctors/types/doctor.types';
import type { DoctorSlot as Slot, DoctorSlotData as SlotData } from '@/features/doctors/types/doctor.types';
import type { Service } from '@/features/services/types/service.types';
import { imgSrc } from '@/shared/lib/utils';

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (d: Date) => {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fmtVN = (iso: string) => {
  if (!iso) return '';
  const [y, m, day] = iso.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(day));
  const dow  = ['CN','T2','T3','T4','T5','T6','T7'][date.getDay()];
  return `${dow}, ${day}/${m}/${y}`;
};

const DOW_LABELS = ['T2','T3','T4','T5','T6','T7','CN'];

function buildMonthGrid(year: number, month: number) {
  // month: 0-indexed
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  // Mon=1..Sun=0 → offset so Mon is col 0
  const startCol  = (firstDay.getDay() + 6) % 7; // Mon=0, Tue=1 ... Sun=6
  const today     = fmt(new Date());

  const cells: Array<{ iso: string; day: number; disabled: boolean; today: boolean } | null> = [];

  // Leading empty cells
  for (let i = 0; i < startCol; i++) cells.push(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const iso  = fmt(date);
    const dow  = date.getDay(); // 0=Sun, 6=Sat
    cells.push({
      iso,
      day:      d,
      disabled: dow === 0 || dow === 6 || iso < today,
      today:    iso === today,
    });
  }

  return cells;
}

const STEPS = ['Chọn bác sĩ', 'Chọn ngày & giờ', 'Xác nhận'];

// ── Component ──────────────────────────────────────────────────────────────
export default function BookingPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [step, setStep]                 = useState(1);
  const [doctors, setDoctors]           = useState<Doctor[]>([]);
  const [services, setServices]         = useState<Service[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slotData, setSlotData]         = useState<SlotData | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [form, setForm]                 = useState({ symptoms: '', serviceId: '' });
  const [loading, setLoading]           = useState(false);
  const [slotLoading, setSlotLoading]   = useState(false);
  const [error, setError]               = useState('');
  const [submitted, setSubmitted]       = useState(false);

  // Calendar navigation
  const nowDate  = new Date();
  const [calYear,  setCalYear]  = useState(nowDate.getFullYear());
  const [calMonth, setCalMonth] = useState(nowDate.getMonth()); // 0-indexed

  const monthGrid = buildMonthGrid(calYear, calMonth);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  // Disable prev-month if already at current month
  const isCurrentMonth = calYear === nowDate.getFullYear() && calMonth === nowDate.getMonth();

  const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                       'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

  useEffect(() => {
    doctorApi.getAll().then(data => setDoctors(data));
    serviceApi.getAll().then(data => setServices(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    setSlotData(null); setSelectedSlot('');
    setSlotLoading(true);
    doctorApi.getSlots(selectedDoctor.id, selectedDate)
      .then(data => setSlotData(data))
      .finally(() => setSlotLoading(false));
  }, [selectedDoctor, selectedDate]);

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;
    setLoading(true); setError('');
    try {
      await appointmentApi.create({
        patientName:  user!.name,
        patientPhone: user!.phone,
        doctorId:     selectedDoctor.id,
        date:         selectedDate,
        time:         selectedSlot,
        symptoms:     form.symptoms || undefined,
        serviceId:    form.serviceId ? Number(form.serviceId) : undefined,
      });
      setSubmitted(true);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đặt lịch thất bại');
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setSubmitted(false); setStep(1);
    setSelectedDoctor(null); setSelectedDate('');
    setSlotData(null); setSelectedSlot('');
    setForm({ symptoms: '', serviceId: '' });
    setError('');
  };

  // Slots split morning/afternoon
  const morningSlots   = slotData?.slots.filter(s => s.time < '12:00') ?? [];
  const afternoonSlots = slotData?.slots.filter(s => s.time >= '13:00') ?? [];

  // ── Success ────────────────────────────────────────────────────────────────
  if (submitted) return (
    <div className="max-w-md mx-auto mt-12 text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Đặt lịch thành công!</h2>
        <p className="text-gray-500 mt-2">
          Lịch hẹn với <strong>{selectedDoctor?.user.name}</strong> vào{' '}
          <strong>{fmtVN(selectedDate)}</strong> lúc <strong>{selectedSlot}</strong> đã được gửi.
        </p>
        <p className="text-sm text-amber-600 mt-3 bg-amber-50 px-4 py-2 rounded-xl">
          Vui lòng đến quầy lễ tân để xác nhận và thanh toán phí khám trước khi vào phòng.
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/patient/appointments')}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
          Xem lịch hẹn
        </button>
        <button onClick={resetBooking}
          className="px-6 py-2.5 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all">
          Đặt lịch mới
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Đặt lịch khám</h1>
        <p className="text-gray-500 mt-1 text-sm">Chọn bác sĩ, ngày giờ và xác nhận thông tin.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => {
          const n      = i + 1;
          const active = step === n;
          const done   = step > n;
          return (
            <div key={n} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {done
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    : n}
                </div>
                <span className={`text-sm font-semibold hidden sm:block ${active ? 'text-primary' : done ? 'text-green-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Choose doctor ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Chọn bác sĩ</h2>
          {doctors.length === 0 ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {doctors.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => { setSelectedDoctor(doc); setStep(2); setSelectedDate(''); setSlotData(null); setSelectedSlot(''); }}
                  className={`text-left p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${
                    selectedDoctor?.id === doc.id
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-100 bg-white hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-xl flex-shrink-0 overflow-hidden">
                      {doc.user.avatar ? (
                        <img src={imgSrc(doc.user.avatar)!} alt={doc.user.name} className="w-full h-full object-cover" />
                      ) : (
                        doc.user.name.split(' ').pop()?.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold">{doc.user.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{doc.specialty || 'Da liễu & Thẩm mỹ'}</div>
                      {doc.description && <div className="text-xs text-gray-400 mt-2 line-clamp-2">{doc.description}</div>}
                      <div className="mt-3">
                        <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">
                          💳 {Number(doc.consultationFee).toLocaleString('vi-VN')}đ / lần khám
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Date + Time ──────────────────────────────────────────── */}
      {step === 2 && selectedDoctor && (
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Left — Calendar */}
          <div className="lg:col-span-3 space-y-5">

            {/* Selected doctor summary */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-primary/20">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold flex-shrink-0 overflow-hidden">
                {selectedDoctor.user.avatar ? (
                  <img src={imgSrc(selectedDoctor.user.avatar)!} alt={selectedDoctor.user.name} className="w-full h-full object-cover" />
                ) : (
                  selectedDoctor.user.name.split(' ').pop()?.charAt(0)
                )}
              </div>
              <div>
                <div className="font-bold text-sm">{selectedDoctor.user.name}</div>
                <div className="text-xs text-gray-500">{selectedDoctor.specialty}</div>
              </div>
              <button
                onClick={() => { setStep(1); setSelectedDate(''); setSlotData(null); setSelectedSlot(''); }}
                className="ml-auto text-xs text-primary font-bold hover:underline"
              >
                Đổi
              </button>
            </div>

            {/* Calendar card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Month navigation */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <button
                  onClick={prevMonth}
                  disabled={isCurrentMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="font-bold text-sm">
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day of week headers */}
              <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                {DOW_LABELS.map(d => (
                  <div key={d} className={`text-center text-xs font-bold pb-2 ${d === 'CN' ? 'text-red-400' : 'text-gray-400'}`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1 px-3 pb-4">
                {monthGrid.map((cell, idx) => {
                  if (!cell) return <div key={`empty-${idx}`} />;
                  const isSelected = selectedDate === cell.iso;
                  const isWeekend  = new Date(cell.iso).getDay() === 0; // Sunday
                  return (
                    <button
                      key={cell.iso}
                      disabled={cell.disabled}
                      onClick={() => setSelectedDate(cell.iso)}
                      className={`
                        relative aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all
                        ${cell.disabled
                          ? 'text-gray-300 cursor-not-allowed'
                          : isSelected
                            ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                            : cell.today
                              ? 'ring-2 ring-primary/40 text-primary font-bold hover:bg-primary hover:text-white'
                              : isWeekend
                                ? 'text-red-400 hover:bg-red-50'
                                : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
                        }
                      `}
                    >
                      {cell.day}
                      {cell.today && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary/20 ring-2 ring-primary/40 inline-block" />
                  Hôm nay
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                  Đã chọn
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
                  Không khả dụng
                </span>
              </div>
            </div>

            {/* Nav buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
              >
                ← Quay lại
              </button>
              <button
                disabled={!selectedDate || !selectedSlot}
                onClick={() => setStep(3)}
                className="flex-1 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Tiếp tục →
              </button>
            </div>
          </div>

          {/* Right — Slots */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">

              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100">
                {selectedDate ? (
                  <>
                    <div className="font-bold text-sm">{fmtVN(selectedDate)}</div>
                    {slotData?.workDay && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        📍 {slotData.workDay.room}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="font-bold text-sm text-gray-400">Chọn ngày để xem giờ trống</div>
                )}
              </div>

              {/* Slot body */}
              {!selectedDate ? (
                <div className="py-14 text-center text-gray-300">
                  <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Chọn ngày trên lịch</p>
                </div>
              ) : slotLoading ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-400">Đang tải lịch...</p>
                </div>
              ) : !slotData?.workDay ? (
                <div className="py-14 text-center text-gray-400 px-4">
                  <div className="text-3xl mb-3">🏖️</div>
                  <p className="text-sm font-semibold">Bác sĩ không làm việc</p>
                  <p className="text-xs mt-1 text-gray-400">Vui lòng chọn ngày khác</p>
                </div>
              ) : (
                <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">

                  {/* Slot legend */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-primary/20 border border-primary/40 inline-block" />
                      Còn trống
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />
                      Đã chọn
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-gray-200 inline-block" />
                      Đã đặt
                    </span>
                  </div>

                  {/* Morning */}
                  {morningSlots.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Buổi sáng</span>
                        <span className="text-xs text-gray-400">08:00 – 11:40</span>
                        <span className="ml-auto text-xs text-green-600 font-bold">
                          {morningSlots.filter(s => s.available).length} trống
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {morningSlots.map(s => (
                          <SlotButton key={s.time} slot={s} selected={selectedSlot === s.time} onSelect={setSelectedSlot} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Afternoon */}
                  {afternoonSlots.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Buổi chiều</span>
                        <span className="text-xs text-gray-400">13:00 – 16:40</span>
                        <span className="ml-auto text-xs text-green-600 font-bold">
                          {afternoonSlots.filter(s => s.available).length} trống
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {afternoonSlots.map(s => (
                          <SlotButton key={s.time} slot={s} selected={selectedSlot === s.time} onSelect={setSelectedSlot} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected summary */}
                  {selectedSlot && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl mt-2">
                      <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-bold text-primary">Đã chọn: {selectedSlot}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Confirm ──────────────────────────────────────────────── */}
      {step === 3 && selectedDoctor && selectedDate && selectedSlot && (
        <div className="space-y-5 max-w-xl">
          <h2 className="font-bold text-lg">Xác nhận thông tin</h2>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
            {[
              { label: 'Bác sĩ',    value: selectedDoctor.user.name },
              { label: 'Ngày khám', value: fmtVN(selectedDate) },
              { label: 'Giờ khám',  value: selectedSlot },
              { label: 'Phí khám',  value: `${Number(selectedDoctor.consultationFee).toLocaleString('vi-VN')}đ` },
            ].map(f => (
              <div key={f.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{f.label}</span>
                <span className="font-bold text-sm">{f.value}</span>
              </div>
            ))}
          </div>

          {/* Patient info */}
          <div className="bg-blue-50 rounded-2xl border border-primary/20 p-5 space-y-3">
            <div className="font-bold text-sm text-primary">Thông tin bệnh nhân</div>
            {[
              { label: 'Họ tên', value: user?.name },
              { label: 'SĐT',   value: user?.phone },
            ].map(f => (
              <div key={f.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{f.label}</span>
                <span className="font-semibold">{f.value}</span>
              </div>
            ))}
          </div>

          {/* Service */}
          {services.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dịch vụ quan tâm (tùy chọn)</label>
              <select
                value={form.serviceId}
                onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Chưa xác định</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {Number(s.price).toLocaleString('vi-VN')}đ</option>
                ))}
              </select>
            </div>
          )}

          {/* Symptoms */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mô tả triệu chứng (tùy chọn)</label>
            <textarea
              value={form.symptoms}
              onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
              rows={3}
              placeholder="Ví dụ: Da nổi mụn viêm vùng má, ngứa và đỏ..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-700">
            ⚠️ Vui lòng đến quầy lễ tân thanh toán phí khám trước khi vào phòng.
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded-xl text-sm text-red-500 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
              ← Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Đang xử lý...' : '✓ Xác nhận đặt lịch'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Slot button component ──────────────────────────────────────────────────
function SlotButton({ slot, selected, onSelect }: {
  slot: Slot;
  selected: boolean;
  onSelect: (t: string) => void;
}) {
  return (
    <button
      disabled={!slot.available}
      onClick={() => onSelect(slot.time)}
      className={`
        py-2 rounded-xl text-xs font-bold transition-all border
        ${!slot.available
          ? 'border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed'
          : selected
            ? 'border-primary bg-primary text-white shadow-md shadow-primary/25 scale-105'
            : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:border-primary hover:scale-105'
        }
      `}
    >
      {slot.time}
    </button>
  );
}
