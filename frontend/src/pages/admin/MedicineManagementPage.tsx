import { useState, useEffect, useCallback } from 'react';
import { medicineApi } from '@/features/medicines/api/medicine.api';
import type { Medicine } from '@/features/medicines/types/medicine.types';

const emptyForm = {
  name: '',
  unit: '',
  category: '',
  description: '',
};

type MedicineForm = typeof emptyForm;

export default function MedicineManagementPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  /* Modal state for add/edit */
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState<MedicineForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [modalErr, setModalErr] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  /* Modal state for delete confirmation */
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');

  const setFormField = (k: keyof MedicineForm, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
  };

  /* Load medicines from backend */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all medicines. Note: backend filters by active=true by default unless configured otherwise.
      const data = await medicineApi.getAll();
      setMedicines(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load medicines:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* Filtered medicines based on search keyword */
  const q = search.trim().toLowerCase();
  const filtered = medicines.filter(m => {
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      (m.category?.toLowerCase().includes(q) ?? false) ||
      (m.description?.toLowerCase().includes(q) ?? false) ||
      (m.unit?.toLowerCase().includes(q) ?? false)
    );
  });

  /* Open modal for creating new medicine */
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalErr('');
    setModalSuccess('');
    setShowModal(true);
  };

  /* Open modal for editing existing medicine */
  const openEdit = (m: Medicine) => {
    setEditing(m);
    setForm({
      name: m.name,
      unit: m.unit ?? '',
      category: m.category ?? '',
      description: m.description ?? '',
    });
    setModalErr('');
    setModalSuccess('');
    setShowModal(true);
  };

  /* Save (create or update) medicine */
  const handleSave = async () => {
    if (!form.name.trim()) {
      setModalErr('Tên thuốc không được để trống.');
      return;
    }
    setSaving(true);
    setModalErr('');
    setModalSuccess('');
    try {
      const payload = {
        name: form.name.trim(),
        unit: form.unit.trim() || null,
        category: form.category.trim() || null,
        description: form.description.trim() || null,
      };

      if (editing) {
        await medicineApi.update(editing.id, payload);
        setModalSuccess('Cập nhật thuốc thành công!');
      } else {
        await medicineApi.create(payload);
        setModalSuccess('Thêm thuốc mới thành công!');
      }

      await load();
      setTimeout(() => {
        setShowModal(false);
      }, 1200);
    } catch (e: any) {
      setModalErr(e?.response?.data?.message || 'Không thể lưu thông tin thuốc.');
    } finally {
      setSaving(false);
    }
  };

  /* Open delete confirm modal */
  const openDelete = (m: Medicine) => {
    setDeleteTarget(m);
    setDeleteErr('');
  };

  /* Delete (soft delete in backend) */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteErr('');
    try {
      await medicineApi.delete(deleteTarget.id);
      setMedicines(prev => prev.filter(m => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteErr(e?.response?.data?.message || 'Không thể xoá thuốc.');
    } finally {
      setDeleting(false);
    }
  };

  // Helper to extract unique categories for suggestions
  const categories = Array.from(
    new Set(medicines.map(m => m.category).filter(Boolean))
  ) as string[];

  // Helper to extract unique units for suggestions
  const units = Array.from(
    new Set(medicines.map(m => m.unit).filter(Boolean))
  ) as string[];

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all bg-white';
  const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh mục thuốc</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý danh sách, đơn vị tính và danh mục các loại thuốc dùng kê đơn.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all shadow-md flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Thêm thuốc mới
        </button>
      </div>

      {/* Summary Stats */}
      {!loading && medicines.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-gray-700">{medicines.length} loại thuốc hoạt động</span>
          </div>
          {categories.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a3a5c]" />
              <span className="text-sm font-medium text-gray-700">{categories.length} nhóm danh mục</span>
            </div>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-80 bg-gray-50 focus-within:bg-white focus-within:border-[#1a3a5c] focus-within:ring-2 focus-within:ring-[#1a3a5c]/10 transition-all">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, đơn vị, nhóm danh mục..."
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
      </div>

      {/* Count Info */}
      {q && (
        <div className="text-sm text-gray-500">
          Tìm thấy <span className="font-semibold text-gray-700">{filtered.length}</span> loại thuốc phù hợp
        </div>
      )}

      {/* Table Data */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          <div className="w-8 h-8 border-4 border-[#1a3a5c] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          Đang tải danh sách thuốc...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-4xl mb-3">💊</div>
          <div className="font-semibold text-gray-600 mb-1">Không tìm thấy kết quả nào</div>
          <div className="text-sm text-gray-400 mb-4">
            {q ? 'Hãy thử điều chỉnh lại từ khoá tìm kiếm.' : 'Chưa có loại thuốc nào trong hệ thống.'}
          </div>
          {!q && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all"
            >
              Thêm thuốc ngay
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Tên thuốc</th>
                  <th className="py-4 px-6">Đơn vị tính</th>
                  <th className="py-4 px-6">Nhóm danh mục</th>
                  <th className="py-4 px-6">Mô tả chi tiết</th>
                  <th className="py-4 px-6">Ngày tạo</th>
                  <th className="py-4 px-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900">{m.name}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                        {m.unit || 'Chưa rõ'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {m.category ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                          {m.category}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Chưa phân nhóm</span>
                      )}
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate" title={m.description || ''}>
                      {m.description || <span className="text-gray-400 italic">Không có mô tả</span>}
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-xs">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="text-xs px-3 py-1.5 bg-blue-50 text-[#1a3a5c] rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => openDelete(m)}
                          className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors"
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
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-lg text-gray-900">
                {editing ? 'Chỉnh sửa thuốc' : 'Thêm thuốc mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Tên thuốc */}
              <div>
                <label className={labelCls}>Tên thuốc *</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.name}
                  onChange={e => setFormField('name', e.target.value)}
                  placeholder="Ví dụ: Paracetamol 500mg, Differin..."
                  autoFocus
                />
              </div>

              {/* Đơn vị tính */}
              <div>
                <label className={labelCls}>Đơn vị tính</label>
                <input
                  type="text"
                  list="med-units"
                  className={inputCls}
                  value={form.unit}
                  onChange={e => setFormField('unit', e.target.value)}
                  placeholder="Ví dụ: viên, tuýp, vỉ, chai..."
                />
                <datalist id="med-units">
                  {units.map(u => <option key={u} value={u} />)}
                </datalist>
              </div>

              {/* Nhóm danh mục */}
              <div>
                <label className={labelCls}>Nhóm danh mục</label>
                <input
                  type="text"
                  list="med-categories"
                  className={inputCls}
                  value={form.category}
                  onChange={e => setFormField('category', e.target.value)}
                  placeholder="Ví dụ: Kháng sinh, Thuốc bôi, Corticoid..."
                />
                <datalist id="med-categories">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              {/* Mô tả */}
              <div>
                <label className={labelCls}>Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  className={`${inputCls} resize-none`}
                  value={form.description}
                  onChange={e => setFormField('description', e.target.value)}
                  placeholder="Mô tả tác dụng phụ, cách dùng hoặc lưu ý..."
                />
              </div>

              {modalErr && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
                  {modalErr}
                </div>
              )}
              {modalSuccess && (
                <div className="text-green-700 text-sm bg-green-50 border border-green-200 px-4 py-2.5 rounded-xl">
                  {modalSuccess}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Xác nhận xoá thuốc</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600">
                Bạn có chắc chắn muốn xoá thuốc <strong>{deleteTarget.name}</strong> ra khỏi danh mục thuốc hoạt động?
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
                Lưu ý: Hành động này là xoá mềm, các lịch sử kê đơn cũ vẫn giữ nguyên thông tin thuốc này.
              </p>
              {deleteErr && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
                  {deleteErr}
                </div>
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
    </div>
  );
}
