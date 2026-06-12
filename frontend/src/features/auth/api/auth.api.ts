import api from '@/shared/lib/axios';

const unwrap = (res: any) => res.data?.data ?? res.data;

export interface RegisterDto {
  name: string;
  phone: string;
  password: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
}

export interface RegisterResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    phone: string;
  };
}

export const authApi = {
  /** Đăng ký tài khoản mới (bệnh nhân walk-in tạo tài khoản tại quầy) */
  register: (dto: RegisterDto): Promise<RegisterResult> =>
    api.post('/auth/register', dto).then(unwrap),
};
