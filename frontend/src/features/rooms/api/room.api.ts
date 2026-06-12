import api from '@/shared/lib/axios';
import type { Room, CreateRoomDto, UpdateRoomDto } from '../types/room.types';

const unwrap = (res: any) => res.data?.data ?? res.data;

export const roomApi = {
  /** Danh sách phòng khám */
  getAll: (): Promise<Room[]> =>
    api.get('/rooms').then(unwrap),

  /** Tạo phòng mới (admin) */
  create: (dto: CreateRoomDto): Promise<Room> =>
    api.post('/rooms', dto).then(unwrap),

  /** Cập nhật phòng (admin) */
  update: (id: number, dto: UpdateRoomDto): Promise<Room> =>
    api.put(`/rooms/${id}`, dto).then(unwrap),

  /** Bật / tắt trạng thái phòng (admin). Server tự lật trạng thái và
   *  chặn nếu phòng còn bác sĩ phụ trách. */
  toggleActive: (id: number): Promise<Room> =>
    api.put(`/rooms/${id}/toggle-active`).then(unwrap),
};
