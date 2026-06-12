import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '@/shared/hooks/useSocket';
import { useAuth } from '@/app/providers/AuthProvider';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  confirmed:   { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-primary' },
  checked_in:  { label: 'Đã check-in',  cls: 'bg-teal-100 text-teal-700' },
  in_progress: { label: 'Đang khám',    cls: 'bg-purple-100 text-purple-700' },
  done:        { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Đã huỷ',       cls: 'bg-red-100 text-red-600' },
  no_show:     { label: 'Không đến',    cls: 'bg-gray-100 text-gray-500' },
};

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, day] = iso.split('-');
  const d = new Date(Number(y), Number(m) - 1, Number(day));
  const dow = ['CN','T2','T3','T4','T5','T6','T7'][d.getDay()];
  return `${dow}, ${day}/${m}/${y}`;
};

const TABS = [
  { key: 'all',      label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'done',     label: 'Đã khám' },
  { key: 'cancelled',label: 'Đã huỷ' },
];

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    appointmentApi.getMy()
      .then(data => setAppointments(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // WebSocket: nhận cập nhật trạng thái lịch hẹn từ topic riêng của bệnh nhân
  useSocket(
    (event, data) => {
      if (event === 'appointment_updated') {
        setAppointments(prev =>
          prev.map(a => a.id === data.appointmentId
            ? { ...a, status: data.status, queueNumber: data.queueNumber ?? a.queueNumber }
            : a
          )
        );
      }
    },
    { topics: user?.id ? [`/topic/patient/${user.id}`] : [], enabled: !!user?.id },
  );

  const handleCancel = async (id: number) => {
    setCancelling(id);
    try {
      await appointmentApi.cancel(id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    } finally {
      setCancelling(null);
      setConfirmCancel(null);
    }
  };

  const filtered = appointments.filter(a => {
    if (tab === 'all') return true;
    if (tab === 'upcoming') return ['pending','confirmed','checked_in','in_progress'].includes(a.status);
    if (tab === 'done') return a.status === 'done';
    if (tab === 'cancelled') return ['cancelled','no_show'].includes(a.status);
    return true;
  });

  const canCancel = (status: string) => ['pending','confirmed'].includes(status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch hẹn của tôi</h1>
          <p className="text-sm text-gray-500 mt-1">
            {appointments.length} lịch hẹn tổng cộng
          </p>
        </div>
        <Link
          to="/patient/booking"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-primary/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Đặt lịch mới
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => {
          const count = t.key === 'all' ? appointments.length
            : t.key === 'upcoming' ? appointments.filter(a => ['pending','confirmed','checked_in','in_progress'].includes(a.status)).length
            : t.key === 'done' ? appointments.filter(a => a.status === 'done').length
            : appointments.filter(a => ['cancelled','no_show'].includes(a.status)).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white text-gray-500 border border-gray-100 hover:border-primary/30'
              }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-bold text-lg">Không có lịch hẹn nào</h3>
          <p className="text-sm text-gray-500 mt-1">
            {tab === 'upcoming' ? 'Bạn chưa có lịch hẹn sắp tới.' : 'Chưa có dữ liệu cho danh mục này.'}
          </p>
          {tab === 'upcoming' && (
            <Link to="/patient/booking" className="inline-flex items-center gap-2 mt-4 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all">
              Đặt lịch ngay
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(apt => (
            <div key={apt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Time block */}
                <div className="flex-shrink-0 w-16 text-center">
                  <div className="text-2xl font-bold text-primary">{apt.time}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{fmtDate(apt.date).split(', ')[0]}</div>
                </div>

                <div className="w-px h-12 bg-gray-100 hidden sm:block flex-shrink-0" />

                {/* Main info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{apt.doctor.user.name}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${STATUS[apt.status]?.cls ?? ''}`}>
                      {STATUS[apt.status]?.label ?? apt.status}
                    </span>
                    {apt.queueNumber && (
                      <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full font-bold">
                        STT #{apt.queueNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{fmtDate(apt.date)}</div>
                  {apt.service && (
                    <div className="text-xs text-gray-400">{apt.service.name}</div>
                  )}
                  {apt.symptoms && (
                    <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                      <span className="font-medium">Triệu chứng:</span> {apt.symptoms}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {canCancel(apt.status) && (
                    confirmCancel === apt.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Xác nhận huỷ?</span>
                        <button
                          onClick={() => handleCancel(apt.id)}
                          disabled={cancelling === apt.id}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-60"
                        >
                          {cancelling === apt.id ? '...' : 'Huỷ lịch'}
                        </button>
                        <button onClick={() => setConfirmCancel(null)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all">
                          Không
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancel(apt.id)}
                        className="px-4 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 transition-all"
                      >
                        Huỷ lịch
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Status progress for upcoming */}
              {['pending','confirmed','checked_in','in_progress'].includes(apt.status) && (
                <div className="px-5 pb-4">
                  <div className="flex items-center gap-0">
                    {(['pending','confirmed','checked_in','in_progress','done'] as const).map((s, i, arr) => {
                      const statuses = ['pending','confirmed','checked_in','in_progress','done'];
                      const curIdx = statuses.indexOf(apt.status);
                      const thisIdx = statuses.indexOf(s);
                      const done = thisIdx <= curIdx;
                      const labels: Record<string, string> = {
                        pending: 'Chờ', confirmed: 'Xác nhận', checked_in: 'Check-in', in_progress: 'Khám', done: 'Xong'
                      };
                      return (
                        <div key={s} className="flex items-center flex-1 last:flex-none">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${done ? 'bg-primary' : 'bg-gray-200'}`} />
                          <span className={`text-[10px] ml-1 font-medium hidden sm:block ${done ? 'text-primary' : 'text-gray-400'}`}>
                            {labels[s]}
                          </span>
                          {i < arr.length - 1 && (
                            <div className={`flex-1 h-px mx-1 ${thisIdx < curIdx ? 'bg-primary' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
