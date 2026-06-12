import api from '@/shared/lib/axios';

const unwrap = (res: any) => res.data?.data ?? res.data;

export interface Notification {
  id: number;
  title: string;
  message?: string | null;
  isRead: boolean;
  createdAt: string;
  type: string;
}

export const notificationApi = {
  /** Lấy danh sách thông báo của user đang đăng nhập */
  getAll: (): Promise<Notification[]> =>
    api.get('/notifications').then(unwrap),

  /** Số thông báo chưa đọc */
  getUnreadCount: (): Promise<number> =>
    api.get('/notifications/unread-count').then(unwrap),

  /** Đánh dấu 1 thông báo đã đọc */
  markRead: (id: number): Promise<void> =>
    api.put(`/notifications/${id}/read`).then(unwrap),

  /** Đánh dấu tất cả đã đọc */
  markAllRead: (): Promise<void> =>
    api.put('/notifications/read-all').then(unwrap),
};
