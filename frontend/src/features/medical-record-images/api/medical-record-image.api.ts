import api from '@/shared/lib/axios';
import type { MedicalRecordImage } from '../types/medical-record-image.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const medicalRecordImageApi = {
  /** Upload 1 ảnh tổn thương da lên Cloudinary (multipart/form-data) */
  upload: (medicalRecordId: number, file: File, note?: string): Promise<MedicalRecordImage> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('medicalRecordId', String(medicalRecordId));
    if (note?.trim()) fd.append('note', note.trim());
    return api.post('/medical-record-images/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap);
  },

  /** Lấy toàn bộ ảnh của 1 bệnh án */
  getByRecord: (medicalRecordId: number): Promise<MedicalRecordImage[]> =>
    api.get('/medical-record-images', { params: { medicalRecordId } }).then(unwrap),

  /** Xoá ảnh (xoá cả trên Cloudinary) */
  delete: (id: number): Promise<void> =>
    api.delete(`/medical-record-images/${id}`).then(unwrap),
};
