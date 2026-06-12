import { useState, useCallback, useRef } from 'react';
import { useSocket } from '@/shared/hooks/useSocket';
import { useAuth } from '@/app/providers/AuthProvider';

interface ToastItem {
  id: number;
  appointmentId: number;
  patientName: string;
  doctorName: string;
  exiting?: boolean;
}

/**
 * Toast thông báo khám xong — hiển thị ở góc dưới bên trái.
 * Chỉ hiển thị cho role receptionist.
 * Tự động ẩn sau 8 giây hoặc khi bấm đóng.
 */
export default function ExamToast() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const removeToast = useCallback((id: number) => {
    // Bắt đầu animation thoát
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    // Xóa khỏi DOM sau 400ms (thời gian animation)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 400);
  }, []);

  useSocket(
    useCallback((event: string, data: any) => {
      if (event === 'examination_completed') {
        const id = ++counter.current;
        setToasts(prev => [
          ...prev,
          {
            id,
            appointmentId: data.appointmentId,
            patientName: data.patientName,
            doctorName: data.doctorName,
          },
        ]);
        setTimeout(() => removeToast(id), 8000);
      }
    }, [removeToast]),
    { topics: ['/topic/appointments'], enabled: user?.role?.code === 'receptionist' },
  );

  // Không render nếu không phải receptionist hoặc không có toast
  if (user?.role?.code !== 'receptionist' || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden
            ${t.exiting ? 'animate-toast-exit' : 'animate-toast-enter'}`}
          style={{ minWidth: 320 }}
        >
          {/* Thanh tiến trình */}
          <div className="h-1 bg-gray-100 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-green-500 animate-toast-progress" />
          </div>

          <div className="p-4 flex gap-3">
            {/* Icon */}
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Nội dung */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-gray-900">Khám xong</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-0.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">
                Bệnh nhân <span className="font-semibold text-gray-900">{t.patientName}</span> đã khám xong.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Bác sĩ: {t.doctorName}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* CSS Animations */}
      <style>{`
        @keyframes toast-enter {
          from {
            opacity: 0;
            transform: translateX(-100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes toast-exit {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(-100%) scale(0.95);
          }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .animate-toast-enter {
          animation: toast-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-toast-exit {
          animation: toast-exit 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-toast-progress {
          animation: toast-progress 8s linear forwards;
        }
      `}</style>
    </div>
  );
}
