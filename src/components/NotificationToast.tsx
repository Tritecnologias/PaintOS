import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertCircle, ShieldAlert, X } from 'lucide-react';
import { tacticalNotifications } from '../utils/notifications';

interface ToastData {
  id: string;
  title: string;
  body: string;
  type: 'warning' | 'urgent' | 'danger';
}

export const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const unsubscribe = tacticalNotifications.onInAppToast(({ title, body, type }) => {
      const newToast: ToastData = {
        id: `toast-${Date.now()}-${Math.random()}`,
        title,
        body,
        type,
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 6000);
    });

    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-3 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isDanger = toast.type === 'danger';
        const isUrgent = toast.type === 'urgent';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 ${
              isDanger
                ? 'bg-red-950/95 border-red-500 text-white shadow-red-500/20'
                : isUrgent
                ? 'bg-amber-950/95 border-amber-500 text-white shadow-amber-500/20'
                : 'bg-slate-900/95 border-orange-500/80 text-white shadow-orange-500/20'
            }`}
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isDanger
                      ? 'bg-red-500/20 text-red-400 animate-pulse'
                      : isUrgent
                      ? 'bg-amber-500/20 text-amber-400 animate-bounce'
                      : 'bg-orange-500/20 text-orange-400'
                  }`}
                >
                  {isDanger ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : isUrgent ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Bell className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <h4 className="font-tactical font-black text-sm uppercase tracking-wide">
                    {toast.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 font-medium leading-relaxed">
                    {toast.body}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-white p-1 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
