import { useState, useEffect, useCallback } from 'react';
import { imgSrc } from '@/shared/lib/utils';
import { userApi } from '@/features/users/api/user.api';
import { doctorApi } from '@/features/doctors/api/doctor.api';
import { uploadFile } from '@/shared/lib/upload';
import type { UserRecord } from '@/features/users/types/user.types';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface DoctorProfile {
  id: number;
  specialty: string | null;
  degree: string | null;
  experience: string | null;   // string, VD: "10 năm"
  consultationFee: number | null;
  description: string | null;
}

interface Specialty { id: number; name: string; description?: string | null }
interface Degree    { id: number; name: string }

interface CreateForm {
  name: string; phone: string; email: string; password: string;
  roleCode: 'doctor' | 'receptionist' | 'admin'; avatar: string;
  specialty: string; specialtyCustom: string;
  degree: string; degreeCustom: string;
  experience: string; consultationFee: string; description: string;
}

interface EditForm {
  name: string; email: string; avatar: string;
  specialty: string; specialtyCustom: string;
  degree: string; degreeCustom: string;
  experience: string; consultationFee: string; description: string;
}

const EMPTY_CREATE: CreateForm = {
  name: '', phone: '', email: '', password: 'Vietskin@123',
  roleCode: 'doctor', avatar: '',
  specialty: '', specialtyCustom: '',
  degree: '', degreeCustom: '',
  experience: '', consultationFee: '', description: '',
};

const EMPTY_EDIT: EditForm = {
  name: '', email: '', avatar: '',
  specialty: '', specialtyCustom: '',
  degree: '', degreeCustom: '',
  experience: '', consultationFee: '', description: '',
};

/* ─── helpers ────────────────────────────────────────────────────────────── */
const fmtFee = (fee: number | null | undefined) =>
  fee ? fee.toLocaleString('vi-VN') + ' đ' : '—';

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all';

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function StaffManagementPage() {
  const [tab, setTab] = useState<'doctor' | 'receptionist' | 'admin'>('doctor');
  const [staff, setStaff] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [degrees, setDegrees]         = useState<Degree[]>([]);

  /* create modal */
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  /* edit modal */
  const [editTarget, setEditTarget] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  /* delete */
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  /* upload */
  const [createUploading, setCreateUploading] = useState(false);
  const [editUploading, setEditUploading]     = useState(false);

  /* ── load ───────────────────────────────────────────────────────────────── */
  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, doctorsRes] = await Promise.allSettled([
        userApi.getAll(),
        doctorApi.getAll(),
      ]);

      let users: UserRecord[] = [];
      if (usersRes.status === 'fulfilled') {
        const raw = usersRes.value ?? [];
        users = (Array.isArray(raw) ? raw : []).filter(
          (u: UserRecord) => (u.role?.code === 'doctor' || u.role?.code === 'receptionist' || u.role?.code === 'admin') && u.active,
        );
      }

      if (doctorsRes.status === 'fulfilled') {
        const docs = doctorsRes.value ?? [];
        const docMap = new Map<number, DoctorProfile>();
        (Array.isArray(docs) ? docs : []).forEach((d: any) => {
          const uid: number = d.userId ?? d.user?.id;
          if (uid) docMap.set(uid, d);
        });
        users = users.map(u => ({
          ...u,
          doctorProfile: u.role?.code === 'doctor' ? (docMap.get(u.id) ?? null) : null,
        }));
      }

      setStaff(users);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLookups = useCallback(async () => {
    try {
      const [sp, dg] = await Promise.all([
        doctorApi.getSpecialties(),
        doctorApi.getDegrees(),
      ]);
      setSpecialties(Array.isArray(sp) ? sp : []);
      setDegrees(Array.isArray(dg) ? dg : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadStaff(); loadLookups(); }, [loadStaff, loadLookups]);

  /* ── create ──────────────────────────────────────────────────────────────── */
  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.phone.trim() || !createForm.password.trim()) {
      setCreateError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setCreateSaving(true); setCreateError('');
    try {
      const body: Record<string, unknown> = {
        name: createForm.name.trim(),
        phone: createForm.phone.trim(),
        email: createForm.email.trim() || undefined,
        password: createForm.password,
        roleCode: createForm.roleCode,
        avatar: createForm.avatar || undefined,
      };
      if (createForm.roleCode === 'doctor') {
        const resolvedSpecialty = createForm.specialty === '__other__' ? createForm.specialtyCustom : createForm.specialty;
        const resolvedDegree    = createForm.degree    === '__other__' ? createForm.degreeCustom    : createForm.degree;
        if (resolvedSpecialty)          body.specialty       = resolvedSpecialty;
        if (resolvedDegree)             body.degree          = resolvedDegree;
        if (createForm.experience)      body.experience      = createForm.experience;  // gửi string
        if (createForm.consultationFee) body.consultationFee = Number(createForm.consultationFee);
        if (createForm.description)     body.description     = createForm.description;
      }
      await userApi.createStaff(body as any);
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE);
      await loadStaff();
    } catch (e: any) {
      setCreateError(e?.response?.data?.message ?? 'Không thể tạo nhân sự.');
    } finally {
      setCreateSaving(false);
    }
  };

  /* ── edit ────────────────────────────────────────────────────────────────── */
  const openEdit = (u: UserRecord) => {
    setEditTarget(u);
    const spInList  = specialties.some(s => s.name === u.doctorProfile?.specialty);
    const degInList = degrees.some(d => d.name === u.doctorProfile?.degree);
    setEditForm({
      name:            u.name,
      email:           u.email ?? '',
      avatar:          u.avatar ?? '',
      specialty:       spInList  ? (u.doctorProfile?.specialty ?? '') : (u.doctorProfile?.specialty ? '__other__' : ''),
      specialtyCustom: spInList  ? '' : (u.doctorProfile?.specialty ?? ''),
      degree:          degInList ? (u.doctorProfile?.degree    ?? '') : (u.doctorProfile?.degree    ? '__other__' : ''),
      degreeCustom:    degInList ? '' : (u.doctorProfile?.degree ?? ''),
      experience:      u.doctorProfile?.experience ?? '',
      consultationFee: u.doctorProfile?.consultationFee != null ? String(u.doctorProfile.consultationFee) : '',
      description:     u.doctorProfile?.description ?? '',
    });
    setEditError('');
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditSaving(true); setEditError('');
    try {
      const userPatch: Record<string, unknown> = {};
      if (editForm.name.trim() && editForm.name.trim() !== editTarget.name)
        userPatch.name = editForm.name.trim();
      if (editForm.email.trim() !== (editTarget.email ?? ''))
        userPatch.email = editForm.email.trim() || null;
      if (editForm.avatar !== (editTarget.avatar ?? ''))
        userPatch.avatar = editForm.avatar || null;
      if (Object.keys(userPatch).length > 0)
        await userApi.update(editTarget.id, userPatch);

      if (editTarget.doctorProfile) {
        const resolvedSpecialty = editForm.specialty === '__other__' ? editForm.specialtyCustom : editForm.specialty;
        const resolvedDegree    = editForm.degree    === '__other__' ? editForm.degreeCustom    : editForm.degree;
        const body: Record<string, unknown> = {
          specialty:       resolvedSpecialty || undefined,
          degree:          resolvedDegree    || undefined,
          experience:      editForm.experience      || undefined,    // string
          consultationFee: editForm.consultationFee ? Number(editForm.consultationFee) : undefined,
          description:     editForm.description     || undefined,
        };
        await doctorApi.update(editTarget.doctorProfile.id, body);
      }
      setEditTarget(null);
      await loadStaff();
    } catch (e: any) {
      setEditError(e?.response?.data?.message ?? 'Không thể cập nhật.');
    } finally {
      setEditSaving(false);
    }
  };

  /* ── delete ──────────────────────────────────────────────────────────────── */
  const openDelete = (u: UserRecord) => {
    setDeleteTarget(u);
    setDeleteError('');
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError('');
    try {
      await userApi.delete(deleteTarget.id);
      setStaff(prev => prev.filter(u => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteError(e?.response?.data?.message ?? 'Không thể xoá tài khoản.');
    } finally {
      setDeleting(false);
    }
  };

  /* ── upload helpers ─────────────────────────────────────────────────────── */
  const uploadAvatar = async (file: File, mode: 'create' | 'edit') => {
    const setUploading = mode === 'create' ? setCreateUploading : setEditUploading;
    const setFormAvatar = mode === 'create'
      ? (url: string) => setCreateForm(f => ({ ...f, avatar: url }))
      : (url: string) => setEditForm(f => ({ ...f, avatar: url }));
    setUploading(true);
    try {
      const url = await uploadFile(file, 'vietskin/avatars');
      setFormAvatar(url);
    } catch { /* silent */ }
    finally { setUploading(false); }
  };

  /* ── helpers render dropdown ────────────────────────────────────────────── */
  const SpecialtySelect = ({
    value, customValue, onChange, onCustomChange,
  }: {
    value: string; customValue: string;
    onChange: (v: string) => void; onCustomChange: (v: string) => void;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Chuyên khoa</label>
      <select
        className={inputCls + ' bg-white'}
        value={value}
        onChange={e => { onChange(e.target.value); if (e.target.value !== '__other__') onCustomChange(''); }}
      >
        <option value="">— Chọn chuyên khoa —</option>
        {specialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        <option value="__other__">Khác (nhập tay)</option>
      </select>
      {value === '__other__' && (
        <input
          type="text" className={inputCls + ' mt-2'} value={customValue} autoFocus
          placeholder="Nhập chuyên khoa..." onChange={e => onCustomChange(e.target.value)}
        />
      )}
    </div>
  );

  const DegreeSelect = ({
    value, customValue, onChange, onCustomChange,
  }: {
    value: string; customValue: string;
    onChange: (v: string) => void; onCustomChange: (v: string) => void;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Học hàm / Bằng cấp</label>
      <select
        className={inputCls + ' bg-white'}
        value={value}
        onChange={e => { onChange(e.target.value); if (e.target.value !== '__other__') onCustomChange(''); }}
      >
        <option value="">— Chọn học hàm —</option>
        {degrees.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
        <option value="__other__">Khác (nhập tay)</option>
      </select>
      {value === '__other__' && (
        <input
          type="text" className={inputCls + ' mt-2'} value={customValue} autoFocus
          placeholder="Nhập học hàm..." onChange={e => onCustomChange(e.target.value)}
        />
      )}
    </div>
  );

  const [search, setSearch] = useState('');

  /* ── filtered list ───────────────────────────────────────────────────────── */
  const filtered = staff.filter(u => {
    if (u.role?.code !== tab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.doctorProfile?.specialty ?? '').toLowerCase().includes(q)
    );
  });

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân sự</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bác sĩ và lễ tân làm việc tại phòng khám.</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateForm(EMPTY_CREATE); setCreateError(''); }}
          className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0f2540] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm nhân sự
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {(['doctor', 'receptionist', 'admin'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(''); }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t ? 'bg-white text-[#1a3a5c] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'doctor' ? 'Bác sĩ' : t === 'receptionist' ? 'Lễ tân' : 'Quản trị viên'}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t ? 'bg-[#1a3a5c]/10 text-[#1a3a5c]' : 'bg-gray-200 text-gray-500'
              }`}>
                {staff.filter(u => u.role?.code === t).length}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'doctor' ? 'Tên, SĐT, chuyên khoa...' : 'Tên, SĐT, email...'}
            className="w-full pl-9 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all bg-white"
          />
        </div>
        {search && (
          <span className="text-xs text-gray-400">{filtered.length} kết quả</span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400 text-sm">Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-400 text-sm">Chưa có nhân sự nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân sự</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Liên hệ</th>
                  {tab === 'doctor' && (
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Chuyên khoa / Phí khám</th>
                  )}
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={imgSrc(u.avatar)!} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            tab === 'doctor' ? 'bg-green-100 text-green-700' : tab === 'receptionist' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {initials(u.name)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{u.name}</div>
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                            tab === 'doctor' ? 'bg-green-50 text-green-700' : tab === 'receptionist' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {tab === 'doctor' ? 'Bác sĩ' : tab === 'receptionist' ? 'Lễ tân' : 'Quản trị viên'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="text-gray-700">{u.phone}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{u.email ?? '—'}</div>
                    </td>
                    {tab === 'doctor' && (
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <div className="text-gray-700">{u.doctorProfile?.specialty ?? '—'}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{fmtFee(u.doctorProfile?.consultationFee)}</div>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="text-xs px-3 py-1.5 bg-blue-50 text-[#1a3a5c] rounded-lg font-medium hover:bg-blue-100 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => openDelete(u)}
                          className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">Thêm nhân sự mới</h3>
                <p className="text-xs text-gray-400 mt-0.5">Điền đầy đủ thông tin bên dưới</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Avatar */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ảnh đại diện</label>
                <div className="flex items-center gap-4">
                  {createForm.avatar ? (
                    <img src={imgSrc(createForm.avatar)!} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <label className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${createUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {createUploading ? 'Đang tải...' : 'Chọn ảnh'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0], 'create')} />
                  </label>
                  {createForm.avatar && (
                    <button type="button" onClick={() => setCreateForm(f => ({ ...f, avatar: '' }))} className="text-xs text-red-500 hover:text-red-700">Xoá</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Họ tên *</label>
                  <input type="text" value={createForm.name} placeholder="Nguyễn Văn A"
                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Số điện thoại *</label>
                  <input type="text" value={createForm.phone} placeholder="09xxxxxxxx"
                    onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" value={createForm.email} placeholder="example@email.com"
                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mật khẩu *</label>
                  <input type="text" value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    className={inputCls + ' font-mono'} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Vai trò *</label>
                  <select value={createForm.roleCode}
                    onChange={e => setCreateForm(f => ({ ...f, roleCode: e.target.value as 'doctor' | 'receptionist' | 'admin' }))}
                    className={inputCls + ' bg-white'}>
                    <option value="doctor">Bác sĩ</option>
                    <option value="receptionist">Lễ tân</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
              </div>

              {createForm.roleCode === 'doctor' && (
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin chuyên môn</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Chuyên khoa dropdown */}
                    <div className="sm:col-span-2">
                      <SpecialtySelect
                        value={createForm.specialty}
                        customValue={createForm.specialtyCustom}
                        onChange={v => setCreateForm(f => ({ ...f, specialty: v }))}
                        onCustomChange={v => setCreateForm(f => ({ ...f, specialtyCustom: v }))}
                      />
                    </div>
                    {/* Học hàm dropdown */}
                    <div className="sm:col-span-2">
                      <DegreeSelect
                        value={createForm.degree}
                        customValue={createForm.degreeCustom}
                        onChange={v => setCreateForm(f => ({ ...f, degree: v }))}
                        onCustomChange={v => setCreateForm(f => ({ ...f, degreeCustom: v }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Kinh nghiệm</label>
                      <input type="text" value={createForm.experience} placeholder="10 năm"
                        onChange={e => setCreateForm(f => ({ ...f, experience: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phí khám (VNĐ)</label>
                      <input type="number" min={0} value={createForm.consultationFee} placeholder="200000"
                        onChange={e => setCreateForm(f => ({ ...f, consultationFee: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mô tả</label>
                      <textarea rows={3} value={createForm.description} placeholder="Giới thiệu ngắn về bác sĩ..."
                        onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                        className={inputCls + ' resize-none'} />
                    </div>
                  </div>
                </div>
              )}

              {createError && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{createError}</div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Huỷ</button>
              <button onClick={handleCreate} disabled={createSaving}
                className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-60">
                {createSaving ? 'Đang tạo...' : 'Tạo nhân sự'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">Chỉnh sửa — {editTarget.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editTarget.phone}</p>
              </div>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Avatar */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ảnh đại diện</label>
                <div className="flex items-center gap-4">
                  {editForm.avatar ? (
                    <img src={imgSrc(editForm.avatar)!} alt="ảnh đại diện" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <label className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${editUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {editUploading ? 'Đang tải...' : 'Chọn ảnh'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0], 'edit')} />
                  </label>
                  {editForm.avatar && (
                    <button type="button" onClick={() => setEditForm(f => ({ ...f, avatar: '' }))} className="text-xs text-red-500 hover:text-red-700">Xoá</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Họ tên *</label>
                  <input type="text" value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Số điện thoại</label>
                  <input type="text" value={editTarget.phone} readOnly
                    className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" value={editForm.email} placeholder="example@email.com"
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>

              {editTarget.role?.code === 'doctor' && (
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin chuyên môn</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <SpecialtySelect
                        value={editForm.specialty}
                        customValue={editForm.specialtyCustom}
                        onChange={v => setEditForm(f => ({ ...f, specialty: v }))}
                        onCustomChange={v => setEditForm(f => ({ ...f, specialtyCustom: v }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <DegreeSelect
                        value={editForm.degree}
                        customValue={editForm.degreeCustom}
                        onChange={v => setEditForm(f => ({ ...f, degree: v }))}
                        onCustomChange={v => setEditForm(f => ({ ...f, degreeCustom: v }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Kinh nghiệm</label>
                      <input type="text" value={editForm.experience} placeholder="10 năm"
                        onChange={e => setEditForm(f => ({ ...f, experience: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phí khám (VNĐ)</label>
                      <input type="number" min={0} value={editForm.consultationFee} placeholder="200000"
                        onChange={e => setEditForm(f => ({ ...f, consultationFee: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mô tả</label>
                      <textarea rows={3} value={editForm.description} placeholder="Giới thiệu ngắn về bác sĩ..."
                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        className={inputCls + ' resize-none'} />
                    </div>
                  </div>
                </div>
              )}

              {editError && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{editError}</div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setEditTarget(null)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Đóng</button>
              <button onClick={handleEdit} disabled={editSaving}
                className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-60">
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
              <h3 className="font-bold text-gray-900">Xoá tài khoản nhân sự</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600">
                Bạn có chắc muốn xoá tài khoản <strong>{deleteTarget.name}</strong>?
                Tài khoản sẽ bị vô hiệu hoá, dữ liệu lịch sử vẫn được giữ nguyên.
              </p>
              {deleteError && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{deleteError}</div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Huỷ
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60">
                {deleting ? 'Đang xoá...' : 'Xác nhận xoá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
