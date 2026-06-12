import { useState, useEffect, useCallback } from 'react';
import { imgSrc } from '@/shared/lib/utils';
import { serviceApi } from '@/features/services/api/service.api';
import { uploadFile } from '@/shared/lib/upload';
import type { Service } from '@/features/services/types/service.types';

const emptyForm = {
  name: '', description: '', price: '', duration: '30',
  category: '', imageUrl: '', active: true,
};
type ServiceForm = typeof emptyForm;

const fmt = (n: string | number) => Number(n).toLocaleString('vi-VN') + 'đ';



/* ─── Component ──────────────────────────────────────────────────────────── */
export default function ServiceManagementPage() {
  const [services,  setServices]  = useState<Service[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');

  /* modal add/edit */
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState<Service | null>(null);
  const [form,      setForm]      = useState<ServiceForm>(emptyForm);
  const [saving,    setSaving]    = useState(false);
  const [modalErr,  setModalErr]  = useState('');
  const [uploading, setUploading] = useState(false);

  /* delete confirm */
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteErr,    setDeleteErr]    = useState('');

  const set = (k: keyof ServiceForm, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  /* ── load ───────────────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await serviceApi.getAll({ all: true });
      setServices(Array.isArray(data) ? data : []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── filtered list ───────────────────────────────────────────────────────── */
  const q = search.trim().toLowerCase();
  const filtered = services.filter(s => {
    if (!s.active) return false;          // ẩn dịch vụ đã xoá mềm (active=false)
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.category?.toLowerCase().includes(q) ?? false) ||
      (s.description?.toLowerCase().includes(q) ?? false)
    );
  });

  /* ── open add/edit ───────────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalErr('');
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name:        s.name,
      description: s.description ?? '',
      price:       String(s.price),
      duration:    String(s.duration),
      category:    s.category ?? '',
      imageUrl:    s.imageUrl ?? '',
      active:      s.active,
    });
    setModalErr('');
    setShowModal(true);
  };

  /* ── upload image ────────────────────────────────────────────────────────── */
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, 'vietskin/services');
      set('imageUrl', url);
    } catch {
      setModalErr('Không thể upload ảnh.');
    } finally {
      setUploading(false);
    }
  };

  /* ── save ────────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true); setModalErr('');
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim() || null,
        price:       Number(form.price),
        duration:    Number(form.duration) || 30,
        category:    form.category.trim() || null,
        imageUrl:    form.imageUrl || null,
        active:      form.active,
      };
      if (editing) {
        await serviceApi.update(editing.id, payload);
      } else {
        await serviceApi.create(payload);
      }
      await load();
      setShowModal(false);
    } catch (e: any) {
      setModalErr(e?.response?.data?.message || 'Không thể lưu dịch vụ.');
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ──────────────────────────────────────────────────────────────── */
  const openDelete = (s: Service) => {
    setDeleteTarget(s);
    setDeleteErr('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteErr('');
    try {
      await serviceApi.delete(deleteTarget.id);
      setServices(prev => prev.filter(s => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteErr(e?.response?.data?.message ?? 'Không thể xoá dịch vụ.');
    } finally {
      setDeleting(false);
    }
  };

  /* ── helpers ─────────────────────────────────────────────────────────────── */
  const categories = [...new Set(services.map(s => s.category).filter(Boolean))] as string[];

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all bg-white';
  const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

  /* ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dịch vụ & Giá</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý danh mục dịch vụ và bảng giá.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#1a3a5c] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0f2540] transition-all shadow-md flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Thêm dịch vụ
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-full sm:w-72 shadow-sm">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, danh mục..."
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

      {/* Count chip */}
      {q && (
        <div className="text-sm text-gray-500">
          Tìm thấy <span className="font-semibold text-gray-700">{filtered.length}</span> dịch vụ
        </div>
      )}

      {/* Card grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          {q ? 'Không tìm thấy dịch vụ phù hợp.' : 'Chưa có dịch vụ nào.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(s => (
            <ServiceCard
              key={s.id}
              service={s}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-lg text-gray-900">
                {editing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Ảnh */}
              <div>
                <label className={labelCls}>Ảnh dịch vụ</label>
                <div className="flex items-center gap-4">
                  {form.imageUrl ? (
                    <img
                      src={imgSrc(form.imageUrl)!}
                      alt="preview"
                      className="w-24 h-20 object-cover rounded-xl border border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-center ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {uploading ? 'Đang tải...' : 'Chọn ảnh'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                    </label>
                    {form.imageUrl && (
                      <button type="button" onClick={() => set('imageUrl', '')} className="text-xs text-red-500 hover:text-red-700 text-center">Xoá ảnh</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tên */}
              <div>
                <label className={labelCls}>Tên dịch vụ *</label>
                <input type="text" className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Khám da tổng quát" />
              </div>

              {/* Giá + Thời gian */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Giá (VNĐ) *</label>
                  <input type="number" className={inputCls} value={form.price} onChange={e => set('price', e.target.value)} placeholder="150000" min={0} />
                </div>
                <div>
                  <label className={labelCls}>Thời gian (phút)</label>
                  <input type="number" className={inputCls} value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="30" min={5} />
                </div>
              </div>

              {/* Danh mục */}
              <div>
                <label className={labelCls}>Danh mục</label>
                <input
                  type="text"
                  list="svc-categories"
                  className={inputCls}
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  placeholder="Khám thường, Thẩm mỹ..."
                />
                <datalist id="svc-categories">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              {/* Mô tả */}
              <div>
                <label className={labelCls}>Mô tả</label>
                <textarea
                  rows={2}
                  className={`${inputCls} resize-none`}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Mô tả ngắn về dịch vụ..."
                />
              </div>

              {modalErr && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{modalErr}</div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Huỷ</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.price}
                className="flex-1 bg-[#1a3a5c] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#0f2540] transition-colors disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Xoá dịch vụ</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600">
                Bạn có chắc muốn xoá dịch vụ <strong>{deleteTarget.name}</strong>?
                Hành động này không thể hoàn tác.
              </p>
              {deleteErr && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">{deleteErr}</div>
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

/* ─── ServiceCard ────────────────────────────────────────────────────────── */
function ServiceCard({
  service: s,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
}) {


  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      {/* Image */}
      {s.imageUrl ? (
        <div className="h-40 bg-gray-100 overflow-hidden">
          <img
            src={imgSrc(s.imageUrl)!}
            alt={s.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center">
          <svg className="w-14 h-14 text-sky-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
      )}

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Name */}
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 leading-snug">{s.name}</h3>
        </div>

        {/* Category */}
        {s.category && (
          <span className="inline-block text-[11px] px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium mb-3 w-fit">
            {s.category}
          </span>
        )}

        {/* Description */}
        {s.description && (
          <p className="text-xs text-gray-400 mb-3 line-clamp-2">{s.description}</p>
        )}

        {/* Info rows */}
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Giá</span>
            <span className="font-bold text-[#1a3a5c]">{fmt(s.price)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Thời gian</span>
            <span className="font-semibold text-gray-700">{s.duration} phút</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => onEdit(s)}
            className="flex-1 text-xs py-2 bg-blue-50 text-[#1a3a5c] rounded-xl font-semibold hover:bg-blue-100 transition-colors"
          >
            Sửa
          </button>
          <button
            onClick={() => onDelete(s)}
            className="flex-1 text-xs py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
          >
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}
