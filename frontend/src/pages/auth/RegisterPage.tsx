import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (user) {
    navigate('/patient/dashboard', { replace: true });
    return null;
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await register(form.phone, form.password, form.name);
      navigate('/patient/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left panel — clinic info ─────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[460px] flex-shrink-0 bg-[#1a3a5c] text-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">VietSkin</span>
          </Link>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div>
              <h2 className="text-3xl font-bold leading-snug">
                Tạo tài khoản<br />bệnh nhân
              </h2>
              <p className="text-blue-200/70 mt-3 text-sm leading-relaxed">
                Đăng ký để đặt lịch khám, theo dõi hồ sơ sức khoẻ và nhận thông báo từ bác sĩ.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: 'calendar', text: 'Đặt lịch khám trực tuyến 24/7' },
                { icon: 'record',   text: 'Xem lịch sử bệnh án cá nhân' },
                { icon: 'notify',   text: 'Nhắc nhở tái khám tự động' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {f.icon === 'calendar' && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {f.icon === 'record' && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {f.icon === 'payment' && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    )}
                    {f.icon === 'notify' && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    )}
                  </div>
                  <span className="text-blue-100/80">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-blue-200/40">© 2024 VietSkin Clinic</div>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <Link to="/" className="lg:hidden flex items-center gap-2 text-[#1a3a5c] font-bold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            VietSkin
          </Link>
          <Link to="/" className="hidden lg:flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Trang chủ
          </Link>
          <span className="text-sm text-gray-400">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[#1a3a5c] font-semibold hover:underline">Đăng nhập</Link>
          </span>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
              <p className="text-sm text-gray-500 mt-1">Điền thông tin bên dưới để đăng ký bệnh nhân</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Nguyễn Văn A"
                  required
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="09xx xxx xxx"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Ít nhất 6 ký tự"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="Nhập lại mật khẩu"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/10 transition-all"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a3a5c] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#0f2540] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </button>
            </form>

            {/* Divider + login link */}
            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-[#1a3a5c] font-semibold hover:underline">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
