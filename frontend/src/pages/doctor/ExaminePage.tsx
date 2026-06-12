import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { appointmentApi } from '@/features/appointments/api/appointment.api';
import { medicalRecordApi } from '@/features/medical-records/api/medical-record.api';
import { medicalRecordImageApi } from '@/features/medical-record-images/api/medical-record-image.api';
import { prescriptionApi } from '@/features/prescriptions/api/prescription.api';
import { medicineApi } from '@/features/medicines/api/medicine.api';
import type { Appointment } from '@/features/appointments/types/appointment.types';
import type { MedicalRecord } from '@/features/medical-records/types/medical-record.types';
import type { Medicine } from '@/features/medicines/types/medicine.types';
import type { MedicalRecordImage } from '@/features/medical-record-images/types/medical-record-image.types';

/* ── Local types not covered by shared type files ───────────── */
interface HistoryRecord {
  id: number;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  createdAt: string;
  appointment: { date: string; service: { name: string } | null } | null;
}
interface PresItem {
  medicineId?: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  note: string;
}

type RecordDetail = MedicalRecord;

/* ── Helpers ────────────────────────────────────────────────── */
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');
const calcAge  = (dob: string) => new Date().getFullYear() - new Date(dob).getFullYear();
const gLabel   = (g: string | null) => g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : g ?? '–';
const todayStr = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

const formatInstruction = (dosage?: string | null, frequency?: string | null, duration?: string | null) => {
  const parts: string[] = [];
  if (dosage) {
    const d = dosage.trim();
    if (d.match(/^\d+(\.\d+)?$/)) {
      parts.push(`Uống/Dùng: ${d} viên`);
    } else {
      parts.push(d);
    }
  }
  if (frequency) {
    const f = frequency.trim();
    if (f.match(/^\d+$/)) {
      parts.push(`ngày ${f} lần`);
    } else {
      parts.push(f);
    }
  }
  if (duration) {
    const dur = duration.trim();
    if (dur.match(/^\d+$/)) {
      parts.push(`trong ${dur} ngày`);
    } else {
      parts.push(dur);
    }
  }
  return parts.filter(Boolean).join(', ');
};

const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-1 focus:ring-[#1a3a5c]/20 bg-white';

/* ════════════════════════════════════════════════════════════ */
export default function ExaminePage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [apt,       setApt]      = useState<Appointment | null>(null);
  const [history,   setHistory]  = useState<HistoryRecord[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [saving,    setSaving]   = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [success,   setSuccess]  = useState('');
  const [error,     setError]    = useState('');

  /* Medical record */
  const [record,      setRecord]      = useState<RecordDetail | null>(null);
  const [hasFollowUp, setHasFollowUp] = useState(false);
  const [recForm, setRecForm] = useState({
    symptoms: '', diagnosis: '', skinType: '', lesionLocation: '', treatment: '', note: '', followUpDate: '',
  });

  /* Prescription */
  const [openPres,      setOpenPres]     = useState(false);
  const [medicines,     setMedicines]    = useState<Medicine[]>([]);
  const [presItems,     setPresItems]    = useState<PresItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<{ id: number; note?: string | null; items: PresItem[] }[]>([]);
  const [presNote,      setPresNote]     = useState('');
  const [medSearch,     setMedSearch]    = useState('');
  const [savingPres,    setSavingPres]   = useState(false);
  const [printData,     setPrintData]    = useState<{ note?: string | null; items: PresItem[] } | null>(null);

  const handlePrintAllPrescriptions = () => {
    const allItems = prescriptions.flatMap(p => p.items);
    const allNotes = prescriptions
      .map(p => p.note)
      .filter(Boolean)
      .join('; ');

    setPrintData({
      note: allNotes || null,
      items: allItems
    });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDeletePrescription = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn thuốc này không?')) return;
    try {
      await prescriptionApi.delete(id);
      setPrescriptions(prev => prev.filter(p => p.id !== id));
      flash('Đã xóa đơn thuốc thành công!');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể xóa đơn thuốc.');
    }
  };

  /* Images */
  const [images,        setImages]       = useState<MedicalRecordImage[]>([]);
  const [uploadingImg,  setUploadingImg] = useState(false);
  const [lightbox,      setLightbox]     = useState<MedicalRecordImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Load data ─────────────────────────────────────────── */
  useEffect(() => {
    if (!appointmentId) return;
    (async () => {
      try {
        const [a, meds] = await Promise.all([
          appointmentApi.getById(Number(appointmentId)),
          medicineApi.getAll(),
        ]);
        setApt(a);
        setMedicines(meds ?? []);
        setRecForm(f => ({ ...f, symptoms: a.symptoms ?? '' }));

        if (a.medicalRecord?.id) {
          const r: RecordDetail = await medicalRecordApi.getById(a.medicalRecord.id);
          setRecord(r);
          setHasFollowUp(!!r.followUpDate);
          setRecForm({
            symptoms:       r.symptoms       ?? a.symptoms ?? '',
            diagnosis:      r.diagnosis      ?? '',
            skinType:       r.skinType       ?? '',
            lesionLocation: r.lesionLocation ?? '',
            treatment:      r.treatment      ?? '',
            note:           r.note           ?? '',
            followUpDate:   r.followUpDate   ? r.followUpDate.split('T')[0] : '',
          });
          if (r.prescriptions && r.prescriptions.length > 0) {
            setPrescriptions(r.prescriptions.map((p: any) => ({
              id: p.id, note: p.note ?? '', items: p.items ?? [],
            })));
            setOpenPres(true);
          }
          // Load ảnh tổn thương nếu bệnh án đã có
          try {
            const imgs = await medicalRecordImageApi.getByRecord(r.id);
            setImages(Array.isArray(imgs) ? imgs : []);
          } catch { /* không có ảnh */ }
        }

        if (a.patientId) {
          try {
            const hData = await medicalRecordApi.getByPatient(a.patientId);
            setHistory(
              (Array.isArray(hData) ? hData : [])
                .filter((h: any) => h.id !== a.medicalRecord?.id)
            );
          } catch { /* no history */ }
        }
      } catch {
        setError('Không thể tải dữ liệu.');
      }
      setLoading(false);
    })();
  }, [appointmentId]);

  /* ── Flash ──────────────────────────────────────────────── */
  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  /* ── Upload ảnh tổn thương ─────────────────────────────── */
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Nếu chưa lưu hồ sơ → lưu trước rồi mới upload ảnh
    let recId = record?.id;
    if (!recId) {
      recId = await saveRecord() ?? undefined;
      if (!recId) return; // saveRecord thất bại
    }

    setUploadingImg(true);
    try {
      const uploads = Array.from(files).slice(0, 10); // tối đa 10 ảnh 1 lần
      const results = await Promise.allSettled(
        uploads.map(f => medicalRecordImageApi.upload(recId!, f))
      );
      const newImgs = results
        .filter((r): r is PromiseFulfilledResult<MedicalRecordImage> => r.status === 'fulfilled')
        .map(r => r.value);
      setImages(prev => [...prev, ...newImgs]);
      if (newImgs.length > 0) flash(`Đã tải lên ${newImgs.length} ảnh!`);
    } catch {
      setError('Không thể tải ảnh lên.');
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (img: MedicalRecordImage) => {
    try {
      await medicalRecordImageApi.delete(img.id);
      setImages(prev => prev.filter(i => i.id !== img.id));
      if (lightbox?.id === img.id) setLightbox(null);
    } catch {
      setError('Không thể xoá ảnh.');
    }
  };

  /* ── Save medical record ────────────────────────────────── */
  const saveRecord = useCallback(async (): Promise<number | null> => {
    if (!apt) return null;
    setSaving(true);
    try {
      const payload = {
        appointmentId:  apt.id,
        symptoms:       recForm.symptoms       || undefined,
        diagnosis:      recForm.diagnosis      || undefined,
        skinType:       recForm.skinType       || undefined,
        lesionLocation: recForm.lesionLocation || undefined,
        treatment:      recForm.treatment      || undefined,
        note:           recForm.note           || undefined,
        followUpDate:   hasFollowUp && recForm.followUpDate ? recForm.followUpDate : undefined,
      };
      if (record?.id) {
        await medicalRecordApi.update(record.id, payload);
        flash('Đã cập nhật hồ sơ!');
        return record.id;
      } else {
        const r = await medicalRecordApi.create(payload);
        setRecord(r);
        flash('Đã lưu hồ sơ!');
        return r.id;
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Lỗi lưu hồ sơ.');
      return null;
    } finally {
      setSaving(false);
    }
  }, [apt, recForm, record, hasFollowUp]);

  /* ── Save prescription ──────────────────────────────────── */
  const savePrescription = async () => {
    if (!apt || presItems.length === 0) { setError('Thêm ít nhất 1 thuốc.'); return; }
    setSavingPres(true);
    try {
      const recId = record?.id ?? await saveRecord();
      const result = await prescriptionApi.create({
        appointmentId:   apt.id,
        medicalRecordId: recId ?? undefined,
        note:            presNote || undefined,
        items: presItems.map(i => ({
          medicineId:   i.medicineId,
          medicineName: i.medicineName,
          dosage:       i.dosage    || undefined,
          frequency:    i.frequency || undefined,
          duration:     i.duration  || undefined,
          quantity:     i.quantity  || undefined,
          note:         i.note      || undefined,
        })),
      });
      // Append đơn mới vào danh sách, reset form để kê tiếp
      setPrescriptions(prev => [...prev, { id: result.id, note: presNote, items: [...presItems] }]);
      setPresItems([]);
      setPresNote('');
      flash('Đã lưu đơn thuốc!');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Lỗi lưu toa thuốc.');
    } finally {
      setSavingPres(false);
    }
  };

  /* ── Finish ─────────────────────────────────────────────── */
  const handleFinish = async () => {
    if (!apt) return;
    setFinishing(true);
    try {
      if (!record?.id) await saveRecord();
      await appointmentApi.updateStatus(apt.id, 'done');
      navigate('/doctor/today');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Lỗi hoàn tất khám.');
    } finally {
      setFinishing(false);
    }
  };

  /* ── Medicine helpers ───────────────────────────────────── */
  const filteredMeds = medicines
    .filter(m => m.name.toLowerCase().includes(medSearch.toLowerCase()))
    .slice(0, 8);

  const addMed = (m: Medicine) => {
    if (presItems.some(i => i.medicineId === m.id)) return;
    setPresItems(p => [...p, { medicineId: m.id, medicineName: m.name, dosage: '', frequency: '', duration: '', quantity: 1, note: '' }]);
    setMedSearch('');
  };

  const updatePres = (idx: number, k: keyof PresItem, v: string | number) =>
    setPresItems(p => p.map((it, i) => i === idx ? { ...it, [k]: v } : it));

  const removePres = (i: number) =>
    setPresItems(p => p.filter((_, idx) => idx !== i));

  /* ── Render guards ──────────────────────────────────────── */
  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="w-6 h-6 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin mr-3" />
      Đang tải...
    </div>
  );
  if (!apt) return (
    <div className="text-center py-16">
      <p className="text-gray-400">Không tìm thấy lịch hẹn.</p>
      <Link to="/doctor/today" className="text-[#1a3a5c] underline text-sm mt-2 inline-block">← Quay lại</Link>
    </div>
  );

  const patient      = apt.patient;
  const profile      = patient?.patientProfile;
  const displayName  = patient?.name ?? apt.patientName;
  const displayPhone = patient?.phone ?? apt.patientPhone ?? '–';
  const initials     = displayName.split(' ').slice(-2).map((w: string) => w[0]).join('').toUpperCase();
  const isDone       = apt.status === 'done';

  return (
    <>
      <div className="space-y-4 no-print">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link to="/doctor/today"
          className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-[#1a3a5c]">
            {profile?.patientCode ? `[${profile.patientCode}] ` : ''}{displayName}
          </h1>
          <p className="text-xs text-gray-500">
            Khám lúc <span className="font-medium text-gray-700">{fmtDate(apt.date)} · {apt.time.slice(0, 5)}</span>
            {apt.queueNumber && <strong className="ml-2 text-[#1a3a5c]">· STT #{apt.queueNumber}</strong>}
            {apt.service && <span className="ml-2 text-gray-400">· {apt.service.name}</span>}
          </p>
        </div>
        {isDone && (
          <span className="ml-auto text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">✓ Đã hoàn thành</span>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">

        {/* ══════════ CỘT TRÁI: Thông tin bệnh nhân ══════════ */}
        <div className="lg:col-span-2 space-y-4">

          {/* Card thông tin */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            {/* Avatar + tên */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1a3a5c] text-white rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0">
                {initials}
              </div>
              <div>
                <div className="font-bold text-gray-900">{displayName}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {gLabel(profile?.gender ?? null)}
                  {profile?.dateOfBirth && ` · ${calcAge(profile.dateOfBirth)} tuổi`}
                </div>
              </div>
            </div>

            {/* Chi tiết */}
            <div className="space-y-2.5">
              {profile?.dateOfBirth && (
                <InfoRow icon="📅" label="Ngày sinh" value={fmtDate(profile.dateOfBirth)} />
              )}
              <InfoRow icon="📞" label="SĐT" value={displayPhone} />
              {(profile?.province || profile?.address) && (
                <InfoRow icon="📍" label="Địa chỉ" value={profile.province ?? profile.address ?? ''} />
              )}
              {profile?.bloodType && (
                <InfoRow icon="🩸" label="Nhóm máu" value={profile.bloodType} />
              )}
              {profile?.allergies && (
                <InfoRow icon="⚠️" label="Dị ứng" value={profile.allergies} highlight />
              )}
              {profile?.medicalHistory && (
                <InfoRow icon="📋" label="Tiền sử" value={profile.medicalHistory} />
              )}
            </div>
          </div>

          {/* Lịch sử khám */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <span className="text-sm">🕐</span>
              <span className="text-sm font-bold text-gray-700">Lịch sử khám bệnh</span>
              {history.length > 0 && (
                <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                  {history.length} lần
                </span>
              )}
            </div>
            <div className="p-4">
              {history.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-3">Chưa có lịch sử khám</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {history.map(h => <HistoryRow key={h.id} record={h} />)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ CỘT PHẢI: Tạo hồ sơ khám ══════════ */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Title */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Tạo hồ sơ khám bệnh</h3>
              {record?.id && (
                <span className="text-[11px] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-semibold">
                  Đang cập nhật
                </span>
              )}
            </div>

            <div className="p-6 space-y-5">

              {/* ── Triệu chứng ── */}
              <FormField label="Triệu chứng" required>
                <textarea rows={2} className={`${inp} resize-none`}
                  value={recForm.symptoms} disabled={isDone}
                  onChange={e => setRecForm(f => ({ ...f, symptoms: e.target.value }))}
                  placeholder="Mô tả triệu chứng bệnh nhân..." />
              </FormField>

              {/* ── Chuẩn đoán ── */}
              <FormField label="Chuẩn đoán" required>
                <textarea rows={2} className={`${inp} resize-none`}
                  value={recForm.diagnosis} disabled={isDone}
                  onChange={e => setRecForm(f => ({ ...f, diagnosis: e.target.value }))}
                  placeholder="Chẩn đoán của bác sĩ..." />
              </FormField>

              {/* ── 2 cột: Loại da + Vị trí tổn thương ── */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Loại da">
                  <select className={inp} value={recForm.skinType} disabled={isDone}
                    onChange={e => setRecForm(f => ({ ...f, skinType: e.target.value }))}>
                    <option value="">-- Chọn --</option>
                    <option value="da_dau">Da dầu</option>
                    <option value="da_kho">Da khô</option>
                    <option value="da_hon_hop">Da hỗn hợp</option>
                    <option value="da_nhay_cam">Da nhạy cảm</option>
                    <option value="da_thuong">Da thường</option>
                  </select>
                </FormField>
                <FormField label="Vị trí tổn thương">
                  <input type="text" className={inp}
                    value={recForm.lesionLocation} disabled={isDone}
                    onChange={e => setRecForm(f => ({ ...f, lesionLocation: e.target.value }))}
                    placeholder="VD: trán, má, cằm..." />
                </FormField>
              </div>

              {/* ── Hướng điều trị ── */}
              <FormField label="Hướng điều trị">
                <textarea rows={2} className={`${inp} resize-none`}
                  value={recForm.treatment} disabled={isDone}
                  onChange={e => setRecForm(f => ({ ...f, treatment: e.target.value }))}
                  placeholder="Phác đồ điều trị, lưu ý..." />
              </FormField>

              {/* ── Ghi chú ── */}
              <FormField label="Ghi chú">
                <input type="text" className={inp}
                  value={recForm.note} disabled={isDone}
                  onChange={e => setRecForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Ghi chú thêm (nếu có)..." />
              </FormField>

              {/* ── Tái khám ── */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
                  <input type="checkbox" checked={hasFollowUp} disabled={isDone}
                    onChange={e => setHasFollowUp(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1a3a5c]" />
                  <span className="font-medium">Hẹn tái khám</span>
                </label>
                {hasFollowUp && (
                  <input type="date" className={`${inp} flex-1`} min={todayStr()}
                    value={recForm.followUpDate} disabled={isDone}
                    onChange={e => setRecForm(f => ({ ...f, followUpDate: e.target.value }))} />
                )}
              </div>

              {/* ══════ Accordion: Toa thuốc ══════ */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setOpenPres(v => !v)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${openPres ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-semibold flex-1 text-left">Toa thuốc</span>
                  {prescriptions.length > 0 && (
                    <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">
                      {prescriptions.length} đơn đã lưu
                    </span>
                  )}
                  {presItems.length > 0 && (
                    <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                      +{presItems.length} thuốc mới
                    </span>
                  )}
                </button>

                {openPres && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">

                    {/* ── Nút in toàn bộ đơn thuốc ── */}
                    {prescriptions.length > 0 && (
                      <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-xl p-3">
                        <div className="text-xs text-blue-800">
                          Đã lưu <strong>{prescriptions.length}</strong> đơn thuốc (Tổng <strong>{prescriptions.flatMap(p => p.items).length}</strong> loại thuốc).
                        </div>
                        <button
                          type="button"
                          onClick={handlePrintAllPrescriptions}
                          className="flex items-center gap-1.5 bg-[#1a3a5c] hover:bg-[#0f2540] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          In toa thuốc (A6)
                        </button>
                      </div>
                    )}

                    {/* ── Danh sách đơn đã lưu ── */}
                    {prescriptions.map((p, pi) => (
                      <div key={p.id} className="rounded-xl border border-green-100 bg-green-50/50 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-100/60 border-b border-green-100">
                          <span className="text-xs font-bold text-green-700">✓ Đơn thuốc #{pi + 1}</span>
                          {p.note && <span className="text-[11px] text-green-600 italic flex-1 truncate">— {p.note}</span>}
                          {!isDone && (
                            <button
                              type="button"
                              onClick={() => handleDeletePrescription(p.id)}
                              className="ml-auto text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Xóa đơn thuốc"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="p-2 space-y-1">
                          {p.items.map((it, i) => (
                            <div key={i} className="flex justify-between text-xs px-2 py-1.5 bg-white rounded-lg">
                              <span className="font-semibold text-gray-700">{it.medicineName}</span>
                              <span className="text-gray-400">
                                {formatInstruction(it.dosage, it.frequency, it.duration)}
                                {it.quantity ? ` · Số lượng: ${it.quantity}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* ── Form kê đơn mới ── */}
                    {!isDone && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50/30 overflow-hidden">
                        <div className="px-3 py-2 bg-amber-50 border-b border-amber-100">
                          <span className="text-xs font-bold text-amber-700">
                            {prescriptions.length > 0 ? `+ Thêm đơn thuốc #${prescriptions.length + 1}` : 'Kê đơn thuốc'}
                          </span>
                        </div>
                        <div className="p-3 space-y-3">
                          {/* Tìm kiếm thuốc */}
                          <div className="relative">
                            <input type="text" className={`${inp} text-xs py-2`}
                              value={medSearch}
                              onChange={e => setMedSearch(e.target.value)}
                              placeholder="🔍  Tìm tên thuốc..." />
                            {medSearch && filteredMeds.length > 0 && (
                              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                {filteredMeds.map(m => (
                                  <button key={m.id} onClick={() => addMed(m)}
                                    className="w-full px-3 py-2.5 text-left text-xs hover:bg-blue-50 flex justify-between items-center transition-colors">
                                    <span className="font-medium text-gray-800">{m.name}</span>
                                    <span className="text-gray-400">{m.unit ?? m.category}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Bảng thuốc đang chọn */}
                          {presItems.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-500 w-6">#</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Thuốc</th>
                                    <th className="px-2 py-2 text-left font-semibold text-gray-500">Liều</th>
                                    <th className="px-2 py-2 text-left font-semibold text-gray-500">Tần suất</th>
                                    <th className="px-2 py-2 text-left font-semibold text-gray-500">Ngày</th>
                                    <th className="px-2 py-2 text-left font-semibold text-gray-500">SL</th>
                                    <th className="px-2 py-2 w-6"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {presItems.map((it, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                      <td className="px-3 py-2 font-medium text-gray-700 max-w-[90px]">
                                        <div className="truncate" title={it.medicineName}>{it.medicineName}</div>
                                      </td>
                                      {(['dosage', 'frequency', 'duration'] as const).map(k => (
                                        <td key={k} className="px-2 py-2">
                                          <input type="text" value={it[k] as string}
                                            onChange={e => updatePres(i, k, e.target.value)}
                                            className="w-16 border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-[#1a3a5c]"
                                            placeholder="..." />
                                        </td>
                                      ))}
                                      <td className="px-2 py-2">
                                        <input type="number" value={it.quantity} min={1}
                                          onChange={e => updatePres(i, 'quantity', Number(e.target.value))}
                                          className="w-12 border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-[#1a3a5c]" />
                                      </td>
                                      <td className="px-2 py-2 text-center">
                                        <button onClick={() => removePres(i)} className="text-red-400 hover:text-red-600">
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          <input type="text" className={`${inp} text-xs py-2`}
                            value={presNote}
                            onChange={e => setPresNote(e.target.value)}
                            placeholder="Ghi chú đơn thuốc (nếu có)..." />

                          <button onClick={savePrescription}
                            disabled={savingPres || presItems.length === 0}
                            className="w-full py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors disabled:opacity-40">
                            {savingPres ? 'Đang lưu...' : `💊  Lưu đơn thuốc${prescriptions.length > 0 ? ` #${prescriptions.length + 1}` : ''}`}
                          </button>
                        </div>
                      </div>
                    )}

                    {isDone && prescriptions.length === 0 && (
                      <p className="text-xs text-gray-400 italic text-center py-1">Không có đơn thuốc</p>
                    )}
                  </div>
                )}
              </div>

              {/* ══════ Ảnh tổn thương da ══════ */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-sm">🖼️</span>
                  <span className="text-sm font-bold text-gray-700 flex-1">Ảnh tổn thương da</span>
                  {images.length > 0 && (
                    <span className="text-[10px] bg-[#1a3a5c] text-white px-2 py-0.5 rounded-full font-bold">
                      {images.length} ảnh
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  {/* Grid ảnh */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map(img => (
                        <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-100">
                          <img
                            src={img.imageUrl}
                            alt={img.note ?? 'Ảnh tổn thương'}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightbox(img)}
                          />
                          {!isDone && (
                            <button
                              onClick={() => handleDeleteImage(img)}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] hover:bg-red-600"
                            >✕</button>
                          )}
                          {img.note && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">
                              {img.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  {!isDone && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={e => handleImageUpload(e.target.files)}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImg}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-[#1a3a5c] hover:text-[#1a3a5c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {uploadingImg ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
                            Đang tải lên...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {record?.id ? 'Thêm ảnh tổn thương' : 'Thêm ảnh (tự động lưu hồ sơ)'}
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-gray-400 text-center">
                        JPG, PNG, WebP · Tối đa 15MB / ảnh · Tối đa 10 ảnh 1 lần
                      </p>
                    </>
                  )}

                  {images.length === 0 && isDone && (
                    <p className="text-xs text-gray-400 italic text-center py-2">Không có ảnh tổn thương</p>
                  )}
                </div>
              </div>

              {/* ── Flash messages ── */}
              {success && (
                <div className="text-green-700 text-sm bg-green-50 border border-green-200 px-4 py-2.5 rounded-xl">
                  ✓ {success}
                </div>
              )}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2">✕</button>
                </div>
              )}

              {/* ── Action buttons ── */}
              {!isDone ? (
                <div className="flex gap-3 pt-1">
                  <button onClick={() => saveRecord()} disabled={saving}
                    className="flex-1 border-2 border-[#1a3a5c] text-[#1a3a5c] py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors disabled:opacity-50">
                    {saving ? 'Đang lưu...' : record?.id ? '📝  Cập nhật hồ sơ' : '📝  Lưu hồ sơ'}
                  </button>
                  <button onClick={handleFinish} disabled={finishing || saving}
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {finishing && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {finishing ? 'Đang xử lý...' : '✓  Hoàn tất khám'}
                  </button>
                </div>
              ) : (
                <Link to="/doctor/today"
                  className="block text-center w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors">
                  ← Quay lại danh sách
                </Link>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.imageUrl}
              alt={lightbox.note ?? 'Ảnh tổn thương'}
              className="w-full rounded-xl object-contain max-h-[80vh]"
            />
            {lightbox.note && (
              <p className="text-white text-sm text-center mt-3 opacity-80">{lightbox.note}</p>
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 bg-white text-gray-700 rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-gray-100 font-bold text-sm"
            >✕</button>
            {/* Prev / Next */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const idx = images.findIndex(i => i.id === lightbox.id);
                    setLightbox(images[(idx - 1 + images.length) % images.length]);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
                >‹</button>
                <button
                  onClick={() => {
                    const idx = images.findIndex(i => i.id === lightbox.id);
                    setLightbox(images[(idx + 1) % images.length]);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
                >›</button>
              </>
            )}
          </div>
        </div>
      )}

      </div>

      {/* A6 Printable Area */}
      {printData && (
        <div className="print-only print-container">
          <div className="print-header">
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>HỆ THỐNG PHÒNG KHÁM DA LIỄU VIETSKIN</div>
            <div style={{ fontSize: '8px', color: '#333' }}>Địa chỉ: 123 Đường ABC, Quận 1, TP. HCM - Hotline: 1900 6060</div>
            <div className="print-title">ĐƠN THUỐC</div>
          </div>

          <div className="print-info-grid">
            <div><strong>Họ tên BN:</strong> {displayName}</div>
            <div><strong>Điện thoại:</strong> {displayPhone}</div>
            <div><strong>Bác sĩ kê:</strong> {apt.doctor?.user?.name || '—'}</div>
            <div><strong>Ngày kê đơn:</strong> {new Date().toLocaleDateString('vi-VN')}</div>
          </div>

          {recForm.diagnosis && (
            <div style={{ marginBottom: '8px', fontSize: '9px' }}>
              <strong>Chẩn đoán:</strong> {recForm.diagnosis}
            </div>
          )}

          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '6%', textAlign: 'center' }}>STT</th>
                <th style={{ width: '44%' }}>Tên thuốc</th>
                <th style={{ width: '12%', textAlign: 'center' }}>SL</th>
                <th style={{ width: '38%' }}>Cách dùng chỉ dẫn</th>
              </tr>
            </thead>
            <tbody>
              {printData.items.map((it, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center' }}>{i + 1}</td>
                  <td>
                    <strong style={{ fontSize: '9px' }}>{it.medicineName}</strong>
                    {it.note && <div style={{ fontSize: '8px', color: '#555', fontStyle: 'italic', marginTop: '1px' }}>* Lưu ý: {it.note}</div>}
                  </td>
                  <td style={{ textAlign: 'center' }}>{it.quantity || '—'}</td>
                  <td>
                    {formatInstruction(it.dosage, it.frequency, it.duration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {printData.note && (
            <div style={{ fontSize: '9px', marginBottom: '8px', borderTop: '1px dashed #ccc', paddingTop: '4px' }}>
              <strong>Lời dặn của bác sĩ:</strong> {printData.note}
            </div>
          )}

          <div className="print-footer">
            <div style={{ fontSize: '7.5px', color: '#444', maxWidth: '200px' }}>
              <div>* Đơn thuốc có giá trị mua trong vòng 05 ngày.</div>
              <div>* Quý khách vui lòng mang theo đơn khi tái khám.</div>
            </div>
            <div className="print-signatures">
              <div>Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
              <div style={{ fontWeight: 'bold', marginTop: '2px', fontSize: '9px' }}>Bác sĩ điều trị</div>
              <div style={{ height: '40px' }}></div>
              <div style={{ fontWeight: 'bold', fontSize: '9.5px' }}>{apt.doctor?.user?.name || '—'}</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media screen {
          .print-only {
            display: none !important;
          }
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          @page {
            size: A6 portrait;
            margin: 5mm;
          }
          body {
            margin: 0;
            padding: 0;
            font-size: 10px;
            line-height: 1.3;
            color: #000;
            background: #fff;
            font-family: 'Helvetica Neue', Arial, sans-serif;
          }
          .print-container {
            width: 100%;
            box-sizing: border-box;
            padding: 2px;
          }
          .print-header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
          }
          .print-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 6px 0 2px 0;
            letter-spacing: 1px;
          }
          .print-info-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 4px;
            margin-bottom: 6px;
            font-size: 9px;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          .print-table th, .print-table td {
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: left;
            font-size: 8.5px;
            line-height: 1.2;
          }
          .print-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .print-footer {
            margin-top: 15px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .print-signatures {
            text-align: center;
            width: 140px;
            font-size: 8px;
          }
        }
      `}</style>
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */
function InfoRow({ icon, label, value, highlight }: {
  icon: string; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <span className="text-xs text-gray-400 w-20 flex-shrink-0 mt-0.5">{label}:</span>
      <span className={`text-xs font-medium flex-1 ${highlight ? 'text-red-600' : 'text-gray-700'}`}>{value}</span>
    </div>
  );
}

function FormField({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function HistoryRow({ record }: { record: HistoryRecord }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors">
        <div>
          <div className="text-xs font-semibold text-gray-700">
            {record.appointment?.date ? fmtDate(record.appointment.date) : fmtDate(record.createdAt)}
          </div>
          {record.appointment?.service && (
            <div className="text-[11px] text-gray-400 mt-0.5">{record.appointment.service.name}</div>
          )}
        </div>
        <svg className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-gray-50 space-y-1 text-xs text-gray-500">
          {record.symptoms  && <p><span className="font-semibold text-gray-600">TC:</span> {record.symptoms}</p>}
          {record.diagnosis && <p><span className="font-semibold text-gray-600">CĐ:</span> {record.diagnosis}</p>}
          {record.treatment && <p><span className="font-semibold text-gray-600">ĐT:</span> {record.treatment}</p>}
        </div>
      )}
    </div>
  );
}
