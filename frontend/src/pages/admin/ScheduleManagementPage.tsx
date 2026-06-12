import { useState, useEffect, useCallback, useRef } from 'react';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { workDayApi } from '@/features/work-days/api/work-day.api';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Doctor {
  id: number;
  specialty: string | null;
  user: { name: string } | null;
  room: { id: number; name: string } | null;
}
interface WorkDay {
  id: number;
  date: string;
  doctorId: number;
  roomId: number | null;
  room?: { name?: string };
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const MONTH_NAMES = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
];
const DAY_LABELS = ['T2','T3','T4','T5','T6','T7','CN'];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function buildCalendar(year: number, month: number): (Date | null)[][] {
  const weeks: (Date | null)[][] = [];
  const d = new Date(year, month, 1);
  const startDow = d.getDay();
  const offset = startDow === 0 ? 6 : startDow - 1;
  let week: (Date | null)[] = Array(offset).fill(null);
  while (d.getMonth() === month) {
    week.push(new Date(d));
    if (week.length === 7) { weeks.push(week); week = []; }
    d.setDate(d.getDate() + 1);
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

const isoDate = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function ScheduleManagementPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selDoctorId, setSelDoctorId] = useState('');

  // Diff-based tracking
  const [toAdd, setToAdd] = useState<string[]>([]);
  const [toRemove, setToRemove] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  // Success popup
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Load data ──────────────────────────────────────────────────────────── */
  const loadWorkDays = useCallback(async (y: number, m: number) => {
    try {
      const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
      const data = await workDayApi.getAll({ month: monthStr });
      setWorkDays(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const init = async () => {
      const docs = await doctorApi.getAll().catch(() => null);
      if (docs) {
        setDoctors(Array.isArray(docs) ? docs : []);
      }
      await loadWorkDays(now.getFullYear(), now.getMonth());
      setLoading(false);
    };
    init();
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
  }, []); // eslint-disable-line

  /* ── Navigate month ─────────────────────────────────────────────────────── */
  const navMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
    resetChanges();
    loadWorkDays(y, m);
  };

  const resetChanges = () => {
    setToAdd([]); setToRemove([]); setSaveErr('');
  };

  /* ── Doctor helpers ─────────────────────────────────────────────────────── */
  const selDoctor = selDoctorId ? doctors.find(d => d.id === Number(selDoctorId)) ?? null : null;
  const selDocWorkDays = selDoctorId ? workDays.filter(wd => wd.doctorId === Number(selDoctorId)) : [];
  const savedDatesMap = new Map(selDocWorkDays.map(wd => [wd.date.split('T')[0], wd]));

  const hasChanges = toAdd.length > 0 || toRemove.length > 0;

  /* ── Click handler: single click to toggle ──────────────────────────────── */
  const handleToggle = (iso: string) => {
    if (!selDoctorId) return;

    const isSaved = savedDatesMap.has(iso);

    if (isSaved) {
      // Toggle mark-for-removal on a saved date
      setToRemove(prev =>
        prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso]
      );
    } else {
      // Toggle mark-for-addition on an empty date
      setToAdd(prev =>
        prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso]
      );
    }
  };

  /* ── Save all changes ───────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!selDoctorId || !hasChanges) return;
    setSaving(true); setSaveErr('');

    try {
      // 1) Delete removed dates
      for (const dateStr of toRemove) {
        const wd = savedDatesMap.get(dateStr);
        if (wd) await workDayApi.delete(wd.id);
      }
      // 2) Add new dates
      if (toAdd.length === 1) {
        await workDayApi.create({ doctorId: Number(selDoctorId), date: toAdd[0] });
      } else if (toAdd.length > 1) {
        await workDayApi.bulkCreate({ doctorId: Number(selDoctorId), dates: toAdd });
      }

      const parts: string[] = [];
      if (toAdd.length > 0) parts.push(`thêm ${toAdd.length} ngày`);
      if (toRemove.length > 0) parts.push(`xóa ${toRemove.length} ngày`);

      resetChanges();
      await loadWorkDays(year, month);

      // Show success popup
      setSuccessMsg(`Đã ${parts.join(' và ')}`);
      setShowSuccess(true);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setShowSuccess(false), 3500);
    } catch (e: any) {
      setSaveErr(e?.response?.data?.message ?? 'Không thể lưu lịch.');
    } finally {
      setSaving(false);
    }
  };

  const calendar = buildCalendar(year, month);
  const todayStr = isoDate(new Date());

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* ── Success Popup ─────────────────────────────────────────────────── */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Lưu lịch thành công</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {successMsg} cho{' '}
                  <strong className="text-gray-700">{selDoctor?.user?.name ?? 'bác sĩ'}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
              >
                Đóng
              </button>
            </div>
            <div className="h-1 bg-emerald-100">
              <div
                className="h-full bg-emerald-400 transition-all ease-linear"
                style={{ width: '100%', animation: 'shrink 3.5s linear forwards' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lịch làm việc bác sĩ</h1>
        <p className="text-sm text-gray-500 mt-0.5">Phân công lịch làm việc cho từng bác sĩ theo tháng.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">

        {/* ── Left panel ──────────────────────────────────────────────────── */}
        <aside className="space-y-4">

          {/* Doctor picker */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chọn bác sĩ</p>
            <select
              value={selDoctorId}
              onChange={e => { setSelDoctorId(e.target.value); resetChanges(); }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] bg-white"
            >
              <option value="">-- Chọn bác sĩ --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.user?.name ?? `BS #${d.id}`}</option>
              ))}
            </select>

            {selDoctor && selDoctor.room && (
              <div className="rounded-xl px-4 py-3 text-sm bg-teal-50 border border-teal-100">
                <div className="flex items-center gap-2 text-teal-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Phòng: <strong>{selDoctor.room.name}</strong></span>
                </div>
              </div>
            )}

            {selDoctor && !selDoctor.room && (
              <div className="rounded-xl px-4 py-3 text-sm bg-amber-50 border border-amber-100">
                <div className="flex items-start gap-2 text-amber-700">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Bác sĩ chưa được phân phòng — vui lòng gán phòng trước tại <strong>Quản lý phòng khám</strong></span>
                </div>
              </div>
            )}

            {!selDoctorId && (
              <p className="text-xs text-gray-400 italic">Chọn bác sĩ để bắt đầu phân lịch.</p>
            )}

            {selDoctorId && (
              <div className="text-xs text-[#1a3a5c] bg-[#1a3a5c]/5 px-3 py-2 rounded-lg space-y-0.5">
                <p>• Click vào ô ngày trống để <strong>chọn thêm</strong></p>
                <p>• Click lại ô đã chọn để <strong>hủy chọn</strong></p>
                <p>• Click vào ô đã lưu để <strong>đánh dấu xóa</strong></p>
                <p>• Ấn <strong>"Lưu"</strong> để cập nhật lịch</p>
              </div>
            )}
          </div>

          {/* Stats */}
          {selDoctor && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                {MONTH_NAMES[month]} {year} — {selDoctor.user?.name}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-teal-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-teal-600">{selDocWorkDays.length - toRemove.length}</div>
                  <div className="text-xs text-teal-600 mt-0.5">đã phân lịch</div>
                </div>
                <div className="flex-1 bg-[#1a3a5c]/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-[#1a3a5c]">{toAdd.length}</div>
                  <div className="text-xs text-[#1a3a5c]/70 mt-0.5">đang chọn thêm</div>
                </div>
                {toRemove.length > 0 && (
                  <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-red-500">{toRemove.length}</div>
                    <div className="text-xs text-red-500/70 mt-0.5">sẽ xóa</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save panel */}
          {selDoctorId && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              {saveErr && (
                <div className="text-red-600 text-xs bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{saveErr}</div>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="w-full bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Lưu{hasChanges ? ` (${toAdd.length > 0 ? `+${toAdd.length}` : ''}${toAdd.length > 0 && toRemove.length > 0 ? ', ' : ''}${toRemove.length > 0 ? `-${toRemove.length}` : ''})` : ''}
                  </>
                )}
              </button>
              {!hasChanges && (
                <p className="text-xs text-gray-400 text-center">Chưa có thay đổi nào</p>
              )}
            </div>
          )}
        </aside>

        {/* ── Right panel: calendar ────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 text-lg">{MONTH_NAMES[month]} {year}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => navMonth(-1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={() => navMonth(1)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-teal-400 inline-block" />
              Đã phân lịch
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#1a3a5c] inline-block" />
              Đang chọn thêm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-red-400 inline-block" />
              Sẽ xóa
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border-2 border-dashed border-gray-300 inline-block" />
              Chủ nhật (không làm việc)
            </span>
          </div>

          {/* Calendar grid */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAY_LABELS.map(d => (
                <div
                  key={d}
                  className={`py-3 text-xs font-bold text-center uppercase tracking-wide ${
                    d === 'CN' ? 'text-red-300 bg-red-50/50' : 'text-gray-500'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="p-16 text-center text-gray-400 text-sm">Đang tải...</div>
            ) : (
              calendar.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-0">
                  {week.map((date, di) => {
                    const iso = date ? isoDate(date) : null;
                    const isToday = iso === todayStr;
                    const isSunday = di === 6;
                    const isSaved = iso ? savedDatesMap.has(iso) : false;
                    const isAdding = iso ? toAdd.includes(iso) : false;
                    const isRemoving = iso ? toRemove.includes(iso) : false;
                    const wd = iso ? savedDatesMap.get(iso) ?? null : null;
                    const canClick = !!date && !isSunday && !!selDoctorId;

                    // Determine cell style
                    let cellBg = '';
                    let cursor = '';
                    if (!date) {
                      cellBg = 'bg-gray-50/20';
                    } else if (isSunday) {
                      cellBg = 'bg-red-50/30';
                      cursor = 'cursor-not-allowed';
                    } else if (isRemoving) {
                      cellBg = 'bg-red-50 ring-1 ring-inset ring-red-300';
                      cursor = 'cursor-pointer';
                    } else if (isAdding) {
                      cellBg = 'bg-[#1a3a5c]/8 ring-1 ring-inset ring-[#1a3a5c]/30';
                      cursor = 'cursor-pointer';
                    } else if (isSaved) {
                      cellBg = 'bg-teal-50';
                      cursor = canClick ? 'cursor-pointer' : '';
                    } else if (canClick) {
                      cellBg = 'hover:bg-blue-50';
                      cursor = 'cursor-pointer';
                    }

                    // Day number style
                    let dayNumClass = 'text-gray-600';
                    if (isToday && !isAdding && !isRemoving) dayNumClass = 'bg-[#1a3a5c] text-white';
                    else if (isAdding) dayNumClass = 'bg-[#1a3a5c] text-white';
                    else if (isRemoving) dayNumClass = 'bg-red-500 text-white';
                    else if (isSaved) dayNumClass = 'text-teal-700 font-bold';
                    else if (isSunday) dayNumClass = 'text-red-300';

                    return (
                      <div
                        key={di}
                        onClick={() => { if (canClick && iso) handleToggle(iso); }}
                        className={[
                          'min-h-[76px] border-r border-gray-100 last:border-0 p-2 transition-all duration-150 select-none',
                          cellBg, cursor,
                        ].join(' ')}
                      >
                        {date && (
                          <>
                            <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${dayNumClass}`}>
                              {date.getDate()}
                            </div>

                            {/* Saved badge */}
                            {isSaved && !isRemoving && (
                              <div className="text-[10px] px-1.5 py-0.5 rounded font-semibold truncate bg-teal-100 text-teal-700">
                                {wd?.room?.name ?? 'Đã phân'}
                              </div>
                            )}

                            {/* Removing badge */}
                            {isRemoving && (
                              <div className="text-[10px] px-1.5 py-0.5 rounded font-semibold truncate bg-red-100 text-red-600 flex items-center gap-1">
                                <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Sẽ xóa
                              </div>
                            )}

                            {/* Adding badge */}
                            {isAdding && (
                              <div className="text-[10px] px-1.5 py-0.5 rounded font-semibold mt-0.5 bg-[#1a3a5c]/15 text-[#1a3a5c] flex items-center gap-1">
                                <svg className="w-2.5 h-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Đã chọn
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Keyframe for progress bar shrink */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </div>
  );
}
