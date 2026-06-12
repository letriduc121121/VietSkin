import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { userApi } from '@/features/users/api/user.api';
import { authApi } from '@/features/auth/api/auth.api';
import { medicalRecordApi } from '@/features/medical-records/api/medical-record.api';
import type { MedicalRecord } from '@/features/medical-records/types/medical-record.types';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface PatientProfile {
  patientCode: string;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  ward: string | null;
  bloodType: string | null;
  ethnicity: string | null;
  citizenId: string | null;
  emergencyContact: string | null;
  allergies: string | null;
  medicalHistory: string | null;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface EditForm {
  name: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  ethnicity: string;
  citizenId: string;
  emergencyContact: string;
  address: string;
  ward: string;
  district: string;
  province: string;
  allergies: string;
  medicalHistory: string;
}

interface UserRecord {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  active: boolean;
  createdAt: string;
  role: { code: string; name: string };
  patientProfile?: PatientProfile | null;
}

/* ─── helpers ────────────────────────────────────────────────────────────── */
const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
};

const genderLabel: Record<string, string> = {
  male: 'Nam', female: 'Nữ', other: 'Khác',
};

const statusLabel: Record<string, { text: string; cls: string }> = {
  pending:     { text: 'Chờ xác nhận', cls: 'bg-yellow-50 text-yellow-700' },
  confirmed:   { text: 'Đã xác nhận',  cls: 'bg-blue-50 text-blue-700' },
  checked_in:  { text: 'Đã check-in',  cls: 'bg-indigo-50 text-indigo-700' },
  in_progress: { text: 'Đang khám',    cls: 'bg-purple-50 text-purple-700' },
  done:        { text: 'Hoàn thành',   cls: 'bg-green-50 text-green-700' },
  cancelled:   { text: 'Đã huỷ',      cls: 'bg-red-50 text-red-600' },
  no_show:     { text: 'Không đến',   cls: 'bg-gray-100 text-gray-500' },
};

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function PatientManagementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role?.code === 'admin';
  const [patients, setPatients] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  /* detail modal */
  const [detailTarget,  setDetailTarget]  = useState<UserRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab,     setDetailTab]     = useState<'info' | 'history'>('info');
  const [appointments,  setAppointments]  = useState<any[]>([]);
  const [apptLoading,   setApptLoading]   = useState(false);
  const [expandedApt,   setExpandedApt]   = useState<number | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  /* edit name */
  const [editingName, setEditingName] = useState(false);
  const [nameVal,     setNameVal]     = useState('');
  const [nameSaving,  setNameSaving]  = useState(false);
  /* edit modal */
  const [editTarget,  setEditTarget]  = useState<UserRecord | null>(null);
  const [editForm,    setEditForm]    = useState<EditForm>({
    name: '', email: '', dateOfBirth: '', gender: '', bloodType: '',
    ethnicity: '', citizenId: '', emergencyContact: '',
    address: '', ward: '', district: '', province: '',
    allergies: '', medicalHistory: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError,  setEditError]  = useState('');
  /* create modal */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    ethnicity: '',
    citizenId: '',
    emergencyContact: '',
    address: '',
    ward: '',
    district: '',
    province: '',
    allergies: '',
    medicalHistory: '',
  });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  /* delete */
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState('');

  /* ── load ───────────────────────────────────────────────────────────────── */
  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await userApi.getAll();
      const list: UserRecord[] = (Array.isArray(raw) ? raw : []).filter(
        (u: UserRecord) => u.role?.code === 'patient' && u.active,
      );
      setPatients(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);

  const saveName = async () => {
    if (!detailTarget || !nameVal.trim()) return;
    setNameSaving(true);
    try {
      await userApi.update(detailTarget.id, { name: nameVal.trim() });
      const updated = { ...detailTarget, name: nameVal.trim() };
      setDetailTarget(updated);
      setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingName(false);
    } catch { /* silent */ } finally {
      setNameSaving(false);
    }
  };

  /* ── open detail ─────────────────────────────────────────────────────────── */
  const openDetail = async (u: UserRecord) => {
    setDetailTarget(u);
    setDetailTab('info');
    setAppointments([]);
    setEditingName(false);
    if (u.patientProfile !== undefined) return;
    setDetailLoading(true);
    try {
      const full = await userApi.getById(u.id);
      setDetailTarget(full);
      setPatients(prev => prev.map(p => p.id === full.id ? full : p));
    } catch { /* silent */ } finally {
      setDetailLoading(false);
    }
  };

  const loadHistory = async (patientId: number) => {
    setApptLoading(true);
    try {
      const raw = await userApi.getPatientAppointments(patientId);
      setAppointments(Array.isArray(raw) ? raw : []);
    } catch { setAppointments([]); } finally {
      setApptLoading(false);
    }
  };

  const switchTab = (tab: 'info' | 'history') => {
    setDetailTab(tab);
    setViewingRecord(null);
    if (tab === 'history' && detailTarget && appointments.length === 0 && !apptLoading) {
      loadHistory(detailTarget.id);
    }
  };

  const loadMedicalRecord = async (recordId: number) => {
    setRecordLoading(true);
    try {
      const data = await medicalRecordApi.getById(recordId);
      setViewingRecord(data);
    } catch { /* silent */ } finally {
      setRecordLoading(false);
    }
  };

  /* ── open edit ──────────────────────────────────────────────────────────── */
  const openEdit = async (u: UserRecord) => {
    setEditError('');
    let full = u;
    if (u.patientProfile === undefined) {
      try {
        full = await userApi.getById(u.id);
        setPatients(prev => prev.map(p => p.id === full.id ? full : p));
      } catch { /* use original */ }
    }
    const pp = full.patientProfile;
    const dobRaw = pp?.dateOfBirth ?? '';
    const dobVal = dobRaw ? dobRaw.slice(0, 10) : '';
    setEditForm({
      name:             full.name,
      email:            full.email ?? '',
      dateOfBirth:      dobVal,
      gender:           pp?.gender ?? '',
      bloodType:        pp?.bloodType ?? '',
      ethnicity:        pp?.ethnicity ?? '',
      citizenId:        pp?.citizenId ?? '',
      emergencyContact: pp?.emergencyContact ?? '',
      address:          pp?.address ?? '',
      ward:             pp?.ward ?? '',
      district:         pp?.district ?? '',
      province:         pp?.province ?? '',
      allergies:        pp?.allergies ?? '',
      medicalHistory:   pp?.medicalHistory ?? '',
    });
    setEditTarget(full);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditSaving(true); setEditError('');
    try {
      const body: any = {
        name:             editForm.name.trim() || undefined,
        email:            editForm.email.trim() || undefined,
        dateOfBirth:      editForm.dateOfBirth || undefined,
        gender:           editForm.gender || undefined,
        bloodType:        editForm.bloodType || undefined,
        ethnicity:        editForm.ethnicity.trim() || undefined,
        citizenId:        editForm.citizenId.trim() || undefined,
        emergencyContact: editForm.emergencyContact.trim() || undefined,
        address:          editForm.address.trim() || undefined,
        ward:             editForm.ward.trim() || undefined,
        district:         editForm.district.trim() || undefined,
        province:         editForm.province.trim() || undefined,
        allergies:        editForm.allergies.trim() || undefined,
        medicalHistory:   editForm.medicalHistory.trim() || undefined,
      };
      await userApi.update(editTarget.id, body);
      // Reload full record to get patientProfile
      const fullUpdated = await userApi.getById(editTarget.id);
      setPatients(prev => prev.map(p => p.id === editTarget.id ? fullUpdated : p));
      setEditTarget(null);
    } catch (e: any) {
      setEditError(e?.response?.data?.message ?? 'Không thể cập nhật thông tin.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreateSave = async () => {
    if (!createForm.name.trim() || !createForm.phone.trim()) {
      setCreateError('Họ tên và số điện thoại không được để trống.');
      return;
    }
    setCreateSaving(true);
    setCreateError('');
    try {
      const regRes = await authApi.register({
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        password: createForm.phone.trim(), // default password as phone number
        email: createForm.email.trim() || undefined,
        dateOfBirth: createForm.dateOfBirth || undefined,
        gender: createForm.gender ? createForm.gender as 'male' | 'female' | 'other' : undefined,
        address: createForm.address.trim() || undefined,
      });

      const newUserId = regRes.user.id;

      const body: any = {
        bloodType:        createForm.bloodType || undefined,
        ethnicity:        createForm.ethnicity.trim() || undefined,
        citizenId:        createForm.citizenId.trim() || undefined,
        emergencyContact: createForm.emergencyContact.trim() || undefined,
        ward:             createForm.ward.trim() || undefined,
        district:         createForm.district.trim() || undefined,
        province:         createForm.province.trim() || undefined,
        allergies:        createForm.allergies.trim() || undefined,
        medicalHistory:   createForm.medicalHistory.trim() || undefined,
      };

      const hasAdditionalData = Object.values(body).some(v => v !== undefined);
      if (hasAdditionalData) {
        await userApi.update(newUserId, body);
      }

      await loadPatients();
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        gender: '',
        bloodType: '',
        ethnicity: '',
        citizenId: '',
        emergencyContact: '',
        address: '',
        ward: '',
        district: '',
        province: '',
        allergies: '',
        medicalHistory: '',
      });
    } catch (e: any) {
      setCreateError(e?.response?.data?.message ?? 'Không thể tạo hồ sơ bệnh nhân.');
    } finally {
      setCreateSaving(false);
    }
  };

  /* ── delete ──────────────────────────────────────────────────────────────── */
  const openDelete = (u: UserRecord) => {
    setDeleteTarget(u);
    setDeleteError('');
    setDetailTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError('');
    try {
      await userApi.delete(deleteTarget.id);
      setPatients(prev => prev.filter(u => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteError(e?.response?.data?.message ?? 'Không thể xoá tài khoản.');
    } finally {
      setDeleting(false);
    }
  };

  /* ── filtered list ───────────────────────────────────────────────────────── */
  const q = search.trim().toLowerCase();
  const filtered = patients.filter(u => {
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.patientProfile?.patientCode?.toLowerCase().includes(q) ?? false)
    );
  });

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ bệnh nhân</h1>
          <p className="text-sm text-gray-500 mt-0.5">Danh sách tất cả bệnh nhân đã đăng ký.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-72 shadow-sm">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, SĐT, mã BN..."
              className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#1a3a5c] hover:bg-[#15304d] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Thêm bệnh nhân
          </button>
        </div>
      </div>

      {/* Stats chip */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="bg-[#1a3a5c]/10 text-[#1a3a5c] font-semibold px-3 py-1 rounded-full text-xs">
          {filtered.length} bệnh nhân
        </span>
        {q && <span className="text-gray-400">trong tổng {patients.length}</span>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400 text-sm">Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-400 text-sm">Không tìm thấy bệnh nhân nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Bệnh nhân</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Liên hệ</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Ngày sinh / Giới tính</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Ngày tạo</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Avatar + name + code */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {initials(u.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{u.name}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {u.patientProfile?.patientCode ?? `#${u.id}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="text-gray-700">{u.phone}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{u.email ?? '—'}</div>
                    </td>
                    {/* DOB / Gender */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="text-gray-700">{fmtDate(u.patientProfile?.dateOfBirth)}</div>
                      <div className="text-gray-400 text-xs mt-0.5">
                        {genderLabel[u.patientProfile?.gender ?? ''] ?? '—'}
                      </div>
                    </td>
                    {/* Created at */}
                    <td className="px-5 py-4 hidden lg:table-cell text-gray-500">
                      {fmtDate(u.createdAt)}
                    </td>
                    {/* Action */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetail(u)}
                          className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="text-xs px-3 py-1.5 bg-blue-50 text-[#1a3a5c] rounded-lg font-medium hover:bg-blue-100 transition-colors"
                        >
                          Sửa
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => openDelete(u)}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                          >
                            Xoá
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {initials(detailTarget.name)}
                </div>
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={nameVal}
                        onChange={e => setNameVal(e.target.value)}
                        className="text-sm font-bold border-b border-[#1a3a5c] outline-none bg-transparent w-36"
                        onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                      />
                      <button onClick={saveName} disabled={nameSaving} className="text-xs text-teal-600 font-semibold hover:text-teal-700 disabled:opacity-50">
                        {nameSaving ? '...' : 'Lưu'}
                      </button>
                      <button onClick={() => setEditingName(false)} className="text-xs text-gray-400 hover:text-gray-600">Huỷ</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 truncate">{detailTarget.name}</h3>
                      <button onClick={() => { setNameVal(detailTarget.name); setEditingName(true); }} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {detailTarget.patientProfile?.patientCode ?? `#${detailTarget.id}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-2 border-b border-gray-100">
              {(['info', 'history'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                    detailTab === t
                      ? 'border-[#1a3a5c] text-[#1a3a5c]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t === 'info' ? 'Thông tin cá nhân' : 'Lịch sử khám'}
                </button>
              ))}
            </div>

            {/* body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {detailLoading ? (
                <div className="py-8 text-center text-gray-400 text-sm">Đang tải...</div>
              ) : detailTab === 'info' ? (
                <>
                  {/* Thông tin cơ bản — khớp mục "Thông tin cơ bản" của form tạo */}
                  <section>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Thông tin cơ bản</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <InfoRow label="Họ tên" value={detailTarget.name} />
                      <InfoRow label="Mã bệnh nhân" value={detailTarget.patientProfile?.patientCode ?? `#${detailTarget.id}`} />
                      <InfoRow label="Số điện thoại" value={detailTarget.phone} />
                      <InfoRow label="Email" value={detailTarget.email || '—'} />
                      <InfoRow label="Trạng thái" value={detailTarget.active ? 'Đang hoạt động' : 'Đã khoá'} />
                      <InfoRow label="Ngày tạo" value={fmtDate(detailTarget.createdAt)} />
                    </div>
                  </section>

                  {/* Hồ sơ bệnh nhân — khớp mục "Hồ sơ bệnh nhân" của form tạo */}
                  <section className="border-t border-gray-100 pt-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Hồ sơ bệnh nhân</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <InfoRow label="Ngày sinh" value={fmtDate(detailTarget.patientProfile?.dateOfBirth)} />
                      <InfoRow label="Giới tính" value={genderLabel[detailTarget.patientProfile?.gender ?? ''] ?? '—'} />
                      <InfoRow label="Nhóm máu" value={detailTarget.patientProfile?.bloodType || '—'} />
                      <InfoRow label="Dân tộc" value={detailTarget.patientProfile?.ethnicity || '—'} />
                      <InfoRow label="Số CCCD / CMND" value={detailTarget.patientProfile?.citizenId || '—'} />
                      <InfoRow label="Liên hệ khẩn cấp" value={detailTarget.patientProfile?.emergencyContact || '—'} />
                      <div className="col-span-2">
                        <InfoRow
                          label="Địa chỉ"
                          value={
                            [
                              detailTarget.patientProfile?.address,
                              detailTarget.patientProfile?.ward,
                              detailTarget.patientProfile?.district,
                              detailTarget.patientProfile?.province,
                            ].filter(Boolean).join(', ') || '—'
                          }
                        />
                      </div>
                    </div>

                    {/* Tiền sử y tế (dạng đoạn văn) */}
                    <div className="space-y-3 text-sm mt-4 border-t border-gray-50 pt-4">
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">Dị ứng</span>
                        <p className="text-gray-700 mt-1">{detailTarget.patientProfile?.allergies || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">Tiền sử bệnh</span>
                        <p className="text-gray-700 mt-1">{detailTarget.patientProfile?.medicalHistory || '—'}</p>
                      </div>
                    </div>
                  </section>

                </>
              ) : (
                /* ── Lịch sử khám ── */
                viewingRecord ? (
                  /* ── Chi tiết hồ sơ bệnh án ── */
                  <div className="space-y-4">
                    <button
                      onClick={() => setViewingRecord(null)}
                      className="flex items-center gap-1.5 text-sm text-[#1a3a5c] font-medium hover:underline"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Quay lại lịch sử
                    </button>

                    <div className="bg-[#1a3a5c] rounded-xl p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs opacity-70">Ngày khám</div>
                          <div className="font-bold">
                            {viewingRecord.appointment?.date ? fmtDate(viewingRecord.appointment.date) : fmtDate(viewingRecord.createdAt)}
                            {viewingRecord.appointment?.time ? ` · ${viewingRecord.appointment.time}` : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs opacity-70">Bác sĩ</div>
                          <div className="font-bold">{viewingRecord.doctor?.user.name ?? '—'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin khám — luôn hiển thị */}
                    {[
                      { label: 'Triệu chứng', value: viewingRecord.symptoms },
                      { label: 'Chẩn đoán', value: viewingRecord.diagnosis },
                      { label: 'Phác đồ điều trị', value: viewingRecord.treatment },
                      { label: 'Ghi chú bác sĩ', value: viewingRecord.note },
                    ].map(f => (
                      <div key={f.label}>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{f.label}</div>
                        <div className={`text-sm rounded-lg px-3 py-2.5 ${
                          f.value ? 'text-gray-700 bg-gray-50' : 'text-gray-400 bg-gray-50/50 italic'
                        }`}>
                          {f.value || 'Chưa có thông tin'}
                        </div>
                      </div>
                    ))}

                    {viewingRecord.followUpDate && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200 w-fit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Tái khám: {fmtDate(viewingRecord.followUpDate)}
                      </div>
                    )}

                    {/* Ảnh tổn thương */}
                    {(viewingRecord.images?.length ?? 0) > 0 && (
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ảnh tổn thương da</div>
                        <div className="grid grid-cols-3 gap-2">
                          {viewingRecord.images!.map((img: any) => (
                            <div key={img.id} className="aspect-square rounded-lg overflow-hidden border border-gray-100">
                              <img src={img.imageUrl} alt={img.note ?? 'Ảnh'} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Đơn thuốc */}
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Đơn thuốc {(viewingRecord.prescriptions?.length ?? 0) > 0 ? `(${viewingRecord.prescriptions!.length})` : ''}
                      </div>
                      {(viewingRecord.prescriptions?.length ?? 0) === 0 ? (
                        <div className="text-sm text-gray-400 italic bg-gray-50/50 rounded-lg px-3 py-2.5">
                          Chưa có đơn thuốc
                        </div>
                      ) : (
                        viewingRecord.prescriptions!.map((p: any, pi: number) => (
                          <div key={p.id} className="rounded-lg border border-gray-100 overflow-hidden mb-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                              <span className="text-xs font-bold text-gray-600">Đơn #{pi + 1}</span>
                              {p.note && <span className="text-xs text-gray-500 italic flex-1 truncate">— {p.note}</span>}
                            </div>
                            <div className="divide-y divide-gray-50">
                              {p.items.map((item: any, i: number) => (
                                <div key={item.id ?? i} className="flex gap-2 px-3 py-2">
                                  <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0 mt-0.5">
                                    {i + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm">{item.medicineName}</div>
                                    <div className="text-xs text-gray-500">
                                      {[item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ')}
                                      {item.quantity ? ` · ${item.quantity} đv` : ''}
                                    </div>
                                    {item.note && <div className="text-xs text-gray-400 italic">{item.note}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : apptLoading ? (
                  <div className="py-8 text-center text-gray-400 text-sm">Đang tải lịch sử...</div>
                ) : appointments.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">Bệnh nhân chưa có lịch khám nào.</div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt: any) => {
                      const st = statusLabel[apt.status] ?? { text: apt.status, cls: 'bg-gray-100 text-gray-500' };
                      const mr = apt.medicalRecord;
                      const hasMr = !!mr;
                      return (
                        <div key={apt.id} className="border border-gray-100 rounded-xl overflow-hidden">
                          <div className="flex items-start justify-between gap-2 px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-gray-900">
                                {fmtDate(apt.date)}
                                {apt.time && (
                                  <span className="text-gray-500 font-normal"> · {apt.time}</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {apt.doctor?.user?.name ?? '—'}
                                {apt.service?.name && <span> · {apt.service.name}</span>}
                              </div>
                              {mr?.diagnosis && (
                                <div className="text-xs text-gray-400 mt-1 italic truncate">{mr.diagnosis}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>{st.text}</span>
                              {hasMr && (
                                <button
                                  onClick={() => loadMedicalRecord(mr.id)}
                                  className="text-xs px-2.5 py-1 bg-blue-50 text-[#1a3a5c] rounded-lg font-medium hover:bg-blue-100 transition-colors"
                                >
                                  Xem chi tiết
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {/* footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setDetailTarget(null)} className="w-full border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-gray-900">Sửa thông tin bệnh nhân</h3>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Thông tin cơ bản */}
              <section>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin cơ bản</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Họ tên *</label>
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="Nhập họ tên"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Số điện thoại</label>
                    <input
                      value={editTarget.phone}
                      disabled
                      className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                    <input
                      value={editForm.email}
                      onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="email@example.com"
                      type="email"
                    />
                  </div>
                </div>
              </section>

              {/* Hồ sơ bệnh nhân */}
              <section className="border-t border-gray-100 pt-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Hồ sơ bệnh nhân</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={e => setEditForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Giới tính</label>
                    <select
                      value={editForm.gender}
                      onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors bg-white"
                    >
                      <option value="">-- Chọn --</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nhóm máu</label>
                    <select
                      value={editForm.bloodType}
                      onChange={e => setEditForm(f => ({ ...f, bloodType: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors bg-white"
                    >
                      <option value="">-- Chọn --</option>
                      {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Dân tộc</label>
                    <input
                      value={editForm.ethnicity}
                      onChange={e => setEditForm(f => ({ ...f, ethnicity: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="Kinh, Tày, Mường..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Số CCCD / CMND</label>
                    <input
                      value={editForm.citizenId}
                      onChange={e => setEditForm(f => ({ ...f, citizenId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="012345678901"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Liên hệ khẩn cấp</label>
                    <input
                      value={editForm.emergencyContact}
                      onChange={e => setEditForm(f => ({ ...f, emergencyContact: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="Tên - SĐT"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Địa chỉ</label>
                    <input
                      value={editForm.address}
                      onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="Số nhà, đường..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Phường / Xã</label>
                    <input
                      value={editForm.ward}
                      onChange={e => setEditForm(f => ({ ...f, ward: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Quận / Huyện</label>
                    <input
                      value={editForm.district}
                      onChange={e => setEditForm(f => ({ ...f, district: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tỉnh / Thành phố</label>
                    <input
                      value={editForm.province}
                      onChange={e => setEditForm(f => ({ ...f, province: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Dị ứng</label>
                    <input
                      value={editForm.allergies}
                      onChange={e => setEditForm(f => ({ ...f, allergies: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="Penicillin, hải sản..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tiền sử bệnh</label>
                    <textarea
                      value={editForm.medicalHistory}
                      onChange={e => setEditForm(f => ({ ...f, medicalHistory: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors resize-none"
                      placeholder="Tiểu đường, cao huyết áp..."
                    />
                  </div>
                </div>
              </section>

              {editError && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{editError}</div>
              )}
            </div>

            {/* footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editForm.name.trim()}
                className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#15304d] transition-colors disabled:opacity-60"
              >
                {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Xoá tài khoản bệnh nhân</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600">
                Bạn có chắc muốn xoá tài khoản <strong>{deleteTarget.name}</strong>?
                Tài khoản sẽ bị vô hiệu hoá, lịch sử khám và bệnh án vẫn được giữ nguyên.
              </p>
              {deleteError && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{deleteError}</div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Đang xoá...' : 'Xác nhận xoá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-lg">Thêm hồ sơ bệnh nhân mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Thông tin cơ bản */}
              <section>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin cơ bản</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Họ tên *</label>
                    <input
                      value={createForm.name}
                      onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="Nhập họ tên"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Số điện thoại *</label>
                    <input
                      value={createForm.phone}
                      onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="Nhập số điện thoại"
                      type="tel"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                    <input
                      value={createForm.email}
                      onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="email@example.com"
                      type="email"
                    />
                  </div>
                </div>
              </section>

              {/* Hồ sơ bệnh nhân */}
              <section className="border-t border-gray-100 pt-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Hồ sơ bệnh nhân</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={createForm.dateOfBirth}
                      onChange={e => setCreateForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Giới tính</label>
                    <select
                      value={createForm.gender}
                      onChange={e => setCreateForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors bg-white"
                    >
                      <option value="">-- Chọn --</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Nhóm máu</label>
                    <select
                      value={createForm.bloodType}
                      onChange={e => setCreateForm(f => ({ ...f, bloodType: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors bg-white"
                    >
                      <option value="">-- Chọn --</option>
                      {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Dân tộc</label>
                    <input
                      value={createForm.ethnicity}
                      onChange={e => setCreateForm(f => ({ ...f, ethnicity: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="Kinh, Tày, Mường..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Số CCCD / CMND</label>
                    <input
                      value={createForm.citizenId}
                      onChange={e => setCreateForm(f => ({ ...f, citizenId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="012345678901"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Liên hệ khẩn cấp</label>
                    <input
                      value={createForm.emergencyContact}
                      onChange={e => setCreateForm(f => ({ ...f, emergencyContact: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="Tên - SĐT"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Địa chỉ</label>
                    <input
                      value={createForm.address}
                      onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="Số nhà, đường..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Phường / Xã</label>
                    <input
                      value={createForm.ward}
                      onChange={e => setCreateForm(f => ({ ...f, ward: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Quận / Huyện</label>
                    <input
                      value={createForm.district}
                      onChange={e => setCreateForm(f => ({ ...f, district: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tỉnh / Thành phố</label>
                    <input
                      value={createForm.province}
                      onChange={e => setCreateForm(f => ({ ...f, province: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Dị ứng</label>
                    <input
                      value={createForm.allergies}
                      onChange={e => setCreateForm(f => ({ ...f, allergies: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors"
                      placeholder="Penicillin, hải sản..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tiền sử bệnh</label>
                    <textarea
                      value={createForm.medicalHistory}
                      onChange={e => setCreateForm(f => ({ ...f, medicalHistory: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] transition-colors resize-none"
                      placeholder="Tiểu đường, cao huyết áp..."
                    />
                  </div>
                </div>
              </section>

              {createError && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{createError}</div>
              )}
            </div>

            {/* footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleCreateSave}
                disabled={createSaving || !createForm.name.trim() || !createForm.phone.trim()}
                className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#15304d] transition-colors disabled:opacity-60"
              >
                {createSaving ? 'Đang tạo...' : 'Tạo hồ sơ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-component ──────────────────────────────────────────────────────── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-400 font-semibold block">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
