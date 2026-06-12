import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/shared/hooks/useSocket';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';

interface Patient {
  id: number;
  name: string;
  phone: string;
}

type QueueItem = Appointment;

const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  confirmed:   { label: 'Đã xác nhận',  cls: 'bg-blue-100 text-[#1a3a5c]' },
  checked_in:  { label: 'Đã check-in',  cls: 'bg-teal-100 text-teal-700' },
  in_progress: { label: 'Đang khám',    cls: 'bg-purple-100 text-purple-700' },
  done:        { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700' },
};

export default function CheckInPage() {
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [lookupResult, setLookupResult] = useState<{ appointments: Appointment[]; patient: Patient | null } | null>(null);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkedInApt, setCheckedInApt] = useState<Appointment | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const today = todayISO();

  const loadQueue = () => {
    appointmentApi.getList({ date: today })
      .then(all => {
        setQueue(all.filter(a => ['checked_in', 'in_progress'].includes(a.status)));
      })
      .finally(() => setQueueLoading(false));
  };

  useEffect(() => { loadQueue(); }, []);

  useSocket(
    (event) => {
      if (event === 'appointment_created' || event === 'appointment_updated') loadQueue();
    },
    { topics: ['/topic/appointments'] },
  );

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setSearching(true);
    setError('');
    setLookupResult(null);
    setSelectedApt(null);
    setSuccess(false);
    try {
      const result = await appointmentApi.lookup(phone.trim(), today) as any;
      setLookupResult(result);
      const eligible = result.appointments.filter(
        (a: Appointment) => a.status === 'confirmed' || a.status === 'pending'
      );
      if (eligible.length === 1) setSelectedApt(eligible[0]);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Không tìm thấy lịch hẹn cho số điện thoại này hôm nay');
    } finally {
      setSearching(false);
    }
  };

  const handleCheckin = async () => {
    if (!selectedApt) return;
    setProcessing(true);
    setError('');
    try {
      await appointmentApi.updateStatus(selectedApt.id, 'checked_in');
      // Reload để lấy queueNumber vừa được gán
      const updated = await appointmentApi.getById(selectedApt.id);
      setCheckedInApt(updated ?? selectedApt);
      setSuccess(true);
      loadQueue();
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setPhone('');
    setLookupResult(null);
    setSelectedApt(null);
    setSuccess(false);
    setCheckedInApt(null);
    setError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const canCheckin = selectedApt && (selectedApt.status === 'confirmed' || selectedApt.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Check-in bệnh nhân</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tiếp nhận bệnh nhân và cấp số thứ tự vào hàng chờ.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-3 space-y-5">

          {/* Step 1: Search */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-base flex items-center gap-2">
              <span className="w-6 h-6 bg-[#1a3a5c] text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
              Tìm bệnh nhân theo số điện thoại
            </h2>
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Nhập số điện thoại..."
                className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm border border-transparent focus:border-[#1a3a5c]/30 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !phone.trim()}
                className="px-5 py-3 bg-[#1a3a5c] text-white rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all disabled:opacity-60 min-w-[110px] flex items-center justify-center gap-2"
              >
                {searching ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Tìm kiếm
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            {lookupResult && !success && (
              <div className="space-y-3">
                {lookupResult.patient && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-[#1a3a5c] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {lookupResult.patient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{lookupResult.patient.name}</div>
                      <div className="text-xs text-gray-500">{lookupResult.patient.phone} · Tài khoản đã đăng ký</div>
                    </div>
                  </div>
                )}

                {lookupResult.appointments.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    <div className="text-2xl mb-2">📅</div>
                    <p className="text-sm">Không có lịch hẹn hôm nay cho số này</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                      {lookupResult.appointments.length} lịch hẹn hôm nay — chọn lịch cần check-in
                    </div>
                    {lookupResult.appointments.map(a => {
                      const alreadyDone = ['checked_in', 'in_progress', 'done'].includes(a.status);
                      return (
                        <button
                          key={a.id}
                          onClick={() => !alreadyDone && setSelectedApt(a)}
                          disabled={alreadyDone}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedApt?.id === a.id
                              ? 'border-[#1a3a5c] bg-blue-50'
                              : alreadyDone
                              ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                              : 'border-gray-100 bg-white hover:border-[#1a3a5c]/40 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-sm truncate">{a.patientName}</div>
                              <div className="text-xs text-gray-500 mt-0.5 truncate">
                                {a.time} · {a.doctor.user.name}
                                {a.service && ` · ${a.service.name}`}
                              </div>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0 ${STATUS_CFG[a.status]?.cls ?? ''}`}>
                              {STATUS_CFG[a.status]?.label ?? a.status}
                            </span>
                          </div>
                          {alreadyDone && a.queueNumber && (
                            <div className="mt-2 text-xs text-teal-600 font-semibold">STT: #{a.queueNumber}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Confirm check-in */}
          {canCheckin && !success && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="font-bold text-base flex items-center gap-2">
                <span className="w-6 h-6 bg-[#1a3a5c] text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
                Xác nhận check-in
              </h2>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Bệnh nhân</span>
                  <span className="font-semibold">{selectedApt.patientName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Bác sĩ</span>
                  <span className="font-semibold">{selectedApt.doctor.user.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Giờ đặt</span>
                  <span className="font-semibold">{selectedApt.time}</span>
                </div>
                {selectedApt.service && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">Dịch vụ</span>
                    <span className="font-semibold">{selectedApt.service.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sau check-in, bệnh nhân sẽ được cấp số thứ tự và chờ bác sĩ gọi vào.
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <button
                onClick={handleCheckin}
                disabled={processing}
                className="w-full bg-teal-500 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-teal-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-teal-500/20"
              >
                {processing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Xác nhận Check-in
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success */}
          {success && checkedInApt && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-5">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-teal-600">Check-in thành công!</h3>
                <p className="text-sm text-gray-500 mt-1">{checkedInApt.patientName} đã được thêm vào hàng chờ</p>
              </div>

              {/* Queue number highlight */}
              {(checkedInApt as any).queueNumber && (
                <div className="inline-flex flex-col items-center justify-center w-24 h-24 bg-[#1a3a5c] text-white rounded-2xl mx-auto">
                  <span className="text-xs font-medium opacity-70">Số thứ tự</span>
                  <span className="text-4xl font-bold">{(checkedInApt as any).queueNumber}</span>
                </div>
              )}

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bác sĩ</span>
                  <span className="font-semibold">{(checkedInApt as any).doctor?.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Giờ đặt</span>
                  <span className="font-semibold">{(checkedInApt as any).time}</span>
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full bg-[#1a3a5c] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all"
              >
                Check-in bệnh nhân tiếp theo
              </button>
            </div>
          )}
        </div>

        {/* Right: Queue */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-base">Hàng chờ hôm nay</h2>
              <span className="text-xs px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full font-bold">
                {queue.length} người
              </span>
            </div>

            {queueLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : queue.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <div className="text-3xl mb-2">🪑</div>
                <p className="text-sm">Chưa có bệnh nhân trong hàng chờ</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {queue.map((q, i) => (
                  <div key={q.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      q.status === 'in_progress'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}>
                      {q.queueNumber ?? i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{q.patientName}</div>
                      <div className="text-xs text-gray-400 truncate">{q.time} · {q.doctor.user.name}</div>
                    </div>
                    {q.status === 'in_progress' && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-bold flex-shrink-0">
                        Đang khám
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
