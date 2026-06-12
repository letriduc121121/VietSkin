import { useState, useEffect } from 'react';
import { imgSrc } from '@/shared/lib/utils';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { roomApi } from '@/features/rooms/api/room.api';
import type { Room } from '@/features/rooms/types/room.types';

interface DoctorOption {
  id: number;
  user: { name: string; avatar: string | null } | null;
}

const emptyForm = { name: '', doctorId: '' };

export default function RoomsPage() {
  const [rooms,     setRooms]     = useState<Room[]>([]);
  const [doctors,   setDoctors]   = useState<DoctorOption[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState<Room | null>(null);
  const [form,      setForm]      = useState(emptyForm);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [toggling,  setToggling]  = useState<number | null>(null);
  const [toggleError, setToggleError] = useState('');

  const load = async () => {
    try {
      const [roomData, docData] = await Promise.all([
        roomApi.getAll(),
        doctorApi.getAll(),
      ]);
      setRooms(Array.isArray(roomData) ? roomData : []);
      setDoctors(Array.isArray(docData) ? docData : []);
    } catch { /* silent */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Bác sĩ nào đã được gán phòng (trừ phòng đang edit)
  const assignedDoctorIds = rooms
    .filter(r => r.doctorId !== null && r.id !== editing?.id)
    .map(r => r.doctorId!);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSuccess(''); setError('');
    setShowModal(true);
  };

  const openEdit = (r: Room) => {
    setEditing(r);
    setForm({ name: r.name, doctorId: r.doctorId ? String(r.doctorId) : '' });
    setSuccess(''); setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true); setError('');
    const payload: any = {
      name:     form.name,
      doctorId: form.doctorId ? Number(form.doctorId) : null,
    };
    try {
      if (editing) {
        await roomApi.update(editing.id, payload);
      } else {
        await roomApi.create(payload);
      }
      setSuccess(editing ? 'Đã cập nhật phòng!' : 'Đã thêm phòng!');
      await load();
      setTimeout(() => { setSuccess(''); setShowModal(false); }, 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể lưu phòng.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (r: Room) => {
    setToggling(r.id);
    setToggleError('');
    try {
      const updated = await roomApi.toggleActive(r.id);
      setRooms(prev => prev.map(x => x.id === r.id ? { ...x, active: updated.active } : x));
    } catch (e: any) {
      // Thường gặp: tắt phòng khi còn bác sĩ phụ trách → backend trả 400 kèm message
      setToggleError(e?.response?.data?.message || 'Không thể đổi trạng thái phòng.');
    } finally {
      setToggling(null);
    }
  };

  const activeCount   = rooms.filter(r => r.active).length;
  const inactiveCount = rooms.length - activeCount;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Phòng khám</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý phòng khám và phân công bác sĩ phụ trách.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Thêm phòng
        </button>
      </div>

      {/* Banner lỗi khi bật/tắt phòng thất bại */}
      {toggleError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">{toggleError}</span>
          <button onClick={() => setToggleError('')} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {/* Summary badges */}
      {!loading && rooms.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="text-sm font-medium text-gray-700">{activeCount} đang hoạt động</span>
          </div>
          {inactiveCount > 0 && (
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-sm font-medium text-gray-400">{inactiveCount} tạm ngừng</span>
            </div>
          )}
        </div>
      )}

      {/* Rooms grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">Đang tải...</div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-4xl mb-3">🏥</div>
          <div className="font-semibold text-gray-600 mb-1">Chưa có phòng nào</div>
          <div className="text-sm text-gray-400 mb-4">Thêm phòng khám đầu tiên để bắt đầu phân công.</div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all"
          >
            Thêm phòng ngay
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {rooms.map(r => {
            const docName = r.doctor?.user?.name ?? null;
            const docAvatar = r.doctor?.user?.avatar ?? null;
            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border shadow-sm p-6 space-y-4 transition-all ${r.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${r.active ? 'bg-[#1a3a5c]/10' : 'bg-gray-100'}`}>
                  <svg className={`w-6 h-6 ${r.active ? 'text-[#1a3a5c]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>

                {/* Name & status */}
                <div>
                  <div className="font-bold text-gray-900">{r.name}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-2 h-2 rounded-full ${r.active ? 'bg-green-400' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-500">{r.active ? 'Đang hoạt động' : 'Tạm ngừng'}</span>
                  </div>
                </div>

                {/* Assigned doctor */}
                <div className="border-t border-gray-50 pt-3">
                  {docName ? (
                    <div className="flex items-center gap-2.5">
                      {docAvatar ? (
                        <img
                          src={imgSrc(docAvatar)!}
                          alt={docName}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#1a3a5c] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {docName.split(' ').pop()?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs text-gray-400">Bác sĩ phụ trách</div>
                        <div className="text-sm font-semibold text-gray-700 truncate">{docName}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Chưa gán bác sĩ
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openEdit(r)}
                    className="flex-1 text-xs px-3 py-2 bg-blue-50 text-[#1a3a5c] rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => toggleActive(r)}
                    disabled={toggling === r.id}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      r.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {toggling === r.id ? '...' : r.active ? 'Tắt' : 'Bật'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg">{editing ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tên phòng */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tên phòng *</label>
                <input
                  type="text"
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                  placeholder="Phòng 1, Phòng Da liễu..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all"
                />
              </div>

              {/* Bác sĩ phụ trách */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bác sĩ phụ trách</label>
                <select
                  value={form.doctorId}
                  onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] bg-white"
                >
                  <option value="">-- Chưa gán --</option>
                  {doctors
                    .filter(d => !assignedDoctorIds.includes(d.id))
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.user?.name ?? `BS #${d.id}`}</option>
                    ))
                  }
                </select>
                <p className="text-xs text-gray-400 mt-1">Mỗi phòng chỉ gán 1 bác sĩ. Bác sĩ đã có phòng sẽ không hiển thị.</p>
              </div>

              {success && <div className="text-green-700 text-sm bg-green-50 border border-green-200 px-4 py-2.5 rounded-xl">{success}</div>}
              {error   && <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{error}</div>}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Huỷ</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : editing ? 'Lưu' : 'Thêm phòng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
