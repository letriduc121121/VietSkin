import React, { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.phone, formData.password);
      } else {
        await register(formData.phone, formData.password, formData.name);
      }
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đã có lỗi xảy ra';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-medical-dark/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-main-bg w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 transition-colors duration-300">
        <div className="p-8 md:p-10">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold">{isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</h2>
            <p className="text-gray-500 mt-2">
              {isLogin ? 'Vui lòng đăng nhập để tiếp tục' : 'Tham gia cùng VietSkin ngay hôm nay'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Họ và tên</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-card-bg border border-border-subtle rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-main-text"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="09xx xxx xxx"
                className="w-full bg-card-bg border border-border-subtle rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-main-text"
              />
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email (Tùy chọn)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  className="w-full bg-card-bg border border-border-subtle rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-main-text"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Mật khẩu</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-card-bg border border-border-subtle rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-main-text"
              />
            </div>

            {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 text-lg mt-4 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="mt-8 text-center text-gray-500 text-sm">
            {isLogin ? (
              <p>
                Chưa có tài khoản?{' '}
                <button onClick={() => setIsLogin(false)} className="text-primary font-bold hover:underline">Đăng ký ngay</button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{' '}
                <button onClick={() => setIsLogin(true)} className="text-primary font-bold hover:underline">Đăng nhập ngay</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
