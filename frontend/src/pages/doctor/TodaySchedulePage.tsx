import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import { useSocket } from '@/shared/hooks/useSocket';

interface QueueItem {
  id: number;
  queueNumber: number | null;
  patientName: string;
  patientPhone: string | null;
  time: string;
  status: 'checked_in' | 'in_progress' | 'done';
  symptoms: string | null;
  service: { name: string } | null;
  patient: {
    name: string;
    phone: string;
    patientProfile: {
      patientCode: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      province: string | null;
      address: string | null;
    } | null
  } | null;
}

const getName = (item: QueueItem) => item.patientName || item.patient?.name || 'Khách lẻ';
const getCode = (item: QueueItem) => item.patient?.patientProfile?.patientCode ?? 'Khách lẻ';

export default function TodaySchedulePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'waiting' | 'in_progress' | 'done'>('waiting');
  const [searchTxt, setSearchTxt] = useState('');

  const load = useCallback(async (docId: number) => {
    try {
      const [queue, schedule] = await Promise.all([
        appointmentApi.getQueue(docId, todayStr),
        appointmentApi.getSchedule(docId, todayStr),
      ]);

      // We need to merge them to ensure we have patientProfile for done items.
      // Since schedule has 'done' items, we filter them out from schedule and combine with queue.
      const doneItems = schedule.filter((a: any) => a.status === 'done');
      const inProgressItems = queue.filter((a: any) => a.status === 'in_progress');
      const waitingItems = queue.filter((a: any) => a.status === 'checked_in');

      setItems([...waitingItems, ...inProgressItems, ...doneItems]);
      setError('');
    } catch {
      setError('Không thể tải danh sách.');
    }
  }, [todayStr]);

  useEffect(() => {
    const init = async () => {
      try {
        const docs = await doctorApi.getAll();
        const me = docs.find((d: any) => d.user.id === user?.id);
        if (!me) { setLoading(false); return; }
        setDoctorId(me.id);
        await load(me.id);
      } catch { /* silent */ }
      setLoading(false);
    };
    if (user?.id) init();
  }, [user?.id, load]);

  // WebSocket: nhận queue_updated trực tiếp từ topic của bác sĩ này
  useSocket(
    (event) => {
      if (event === 'queue_updated' && doctorId) load(doctorId);
    },
    { topics: doctorId ? [`/topic/doctor/${doctorId}`] : [], enabled: !!doctorId },
  );

  const callIn = async (item: QueueItem) => {
    setCalling(item.id);
    try {
      await appointmentApi.updateStatus(item.id, 'in_progress');
      navigate(`/doctor/examine/${item.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Lỗi khi gọi bệnh nhân.');
      setCalling(null);
      if (doctorId) load(doctorId);
    }
  };

  const actionHandler = (item: QueueItem) => {
    if (item.status === 'checked_in') callIn(item);
    else navigate(`/doctor/examine/${item.id}`);
  };

  const waiting = items.filter(i => i.status === 'checked_in').sort((a, b) => (a.queueNumber ?? 99) - (b.queueNumber ?? 99));
  const inProgress = items.filter(i => i.status === 'in_progress');
  const done = items.filter(i => i.status === 'done').sort((a, b) => (a.queueNumber ?? 99) - (b.queueNumber ?? 99));

  let currentList = waiting;
  if (activeTab === 'in_progress') currentList = inProgress;
  if (activeTab === 'done') currentList = done;

  const displayedList = currentList.filter(item =>
    getName(item).toLowerCase().includes(searchTxt.toLowerCase()) ||
    getCode(item).toLowerCase().includes(searchTxt.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-[#1a3a5c]">Danh sách bệnh nhân</h1>

      {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</div>}

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Tabs */}
        <div className="flex items-center gap-8 px-6 pt-5 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('waiting')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'waiting' ? 'border-[#115e59] text-[#115e59]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
            TIẾP NHẬN
            <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full leading-none pt-0.5">
              {waiting.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('in_progress')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'in_progress' ? 'border-[#115e59] text-[#115e59]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
            ĐANG KHÁM
            <span className="bg-blue-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full leading-none pt-0.5">
              {inProgress.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('done')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'done' ? 'border-[#115e59] text-[#115e59]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}>
            ĐÃ KHÁM
            <span className="bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full leading-none pt-0.5">
              {done.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6">
          <div className="relative flex items-center w-full max-w-full">
            <div className="absolute left-4 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTxt}
              onChange={(e) => setSearchTxt(e.target.value)}
              placeholder="Tìm kiếm theo tên khách hàng"
              className="w-full border border-gray-200 rounded-lg pl-11 pr-28 py-3 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20"
            />
            <button
              className="absolute right-2 text-xs font-bold text-[#1a3a5c] hover:text-[#0f2540] px-4 py-1.5 rounded-md hover:bg-gray-50 transition-colors uppercase"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto pb-4">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f8fafc] text-[#475569]">
              <tr>
                <th className="px-6 py-4 font-bold w-16">#</th>
                <th className="px-4 py-4 font-bold">Mã bệnh nhân</th>
                <th className="px-4 py-4 font-bold">Họ và tên</th>
                <th className="px-4 py-4 font-bold">SĐT</th>
                <th className="px-4 py-4 font-bold">Giờ khám</th>
                <th className="px-4 py-4 font-bold w-1/3">Triệu chứng</th>
                <th className="px-6 py-4 font-bold text-center">Tuỳ Chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Không có bệnh nhân nào
                  </td>
                </tr>
              ) : (
                displayedList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.queueNumber ?? index + 1}
                    </td>
                    <td className="px-4 py-4 text-gray-600 font-mono text-xs">
                      {getCode(item)}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {getName(item)}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {item.patientPhone || item.patient?.phone || '–'}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      <span className="font-semibold text-gray-800">{item.time.slice(0, 5)}</span>
                      {item.service && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[120px]">{item.service.name}</div>}
                    </td>
                    <td className="px-4 py-4 text-gray-600 truncate max-w-[200px]" title={item.symptoms || ''}>
                      {item.symptoms || '–'}
                    </td>
                    <td className="px-6 py-4 flex justify-center">
                      <button
                        title={
                          item.status === 'checked_in' ? 'Gọi khám' :
                            item.status === 'in_progress' ? 'Tiếp tục khám' : 'Xem bệnh án'
                        }
                        onClick={() => actionHandler(item)}
                        disabled={calling === item.id}
                        className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center hover:bg-cyan-100 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      >
                        {calling === item.id ? (
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
