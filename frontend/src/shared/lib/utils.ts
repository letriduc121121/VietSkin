import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Chuyển URL ảnh thành src hiển thị.
 * - URL đã full (Cloudinary) → dùng thẳng
 * - URL path local (/uploads/...) → nối với backend
 */
export const imgSrc = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `http://localhost:8080${url}`;
};
