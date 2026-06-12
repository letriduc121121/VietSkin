import api from './axios';

export type UploadFolder =
  | 'vietskin/avatars'
  | 'vietskin/services'
  | 'vietskin/lab-results';

/** Upload 1 file lên server, trả về URL string */
export async function uploadFile(file: File, folder: UploadFolder): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post(`/upload?folder=${folder}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const data = res.data?.data ?? res.data;
  // Backend trả { url, publicId } — lấy field url
  return (data?.url ?? data) as string;
}
