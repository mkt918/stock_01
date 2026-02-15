'use client';

import { useToastStore, Toast, ToastType } from '@/hooks/useToast';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} className="text-green-500 shrink-0" />,
    error: <AlertCircle size={18} className="text-red-500 shrink-0" />,
    warning: <AlertTriangle size={18} className="text-yellow-500 shrink-0" />,
    info: <Info size={18} className="text-blue-500 shrink-0" />,
};

const BORDER_COLORS: Record<ToastType, string> = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-yellow-500',
    info: 'border-l-blue-500',
};

function ToastItem({ toast }: { toast: Toast }) {
    const removeToast = useToastStore((s) => s.removeToast);

    return (
        <div
            className={`flex items-start gap-3 bg-white border border-slate-200 border-l-4 ${BORDER_COLORS[toast.type]} rounded-xl px-4 py-3 shadow-lg min-w-[280px] max-w-sm animate-in slide-in-from-right-5 fade-in duration-300`}
        >
            {ICONS[toast.type]}
            <p className="flex-1 text-sm font-medium text-slate-700 leading-snug">{toast.message}</p>
            <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
                <X size={14} />
            </button>
        </div>
    );
}

export function Toaster() {
    const toasts = useToastStore((s) => s.toasts);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} />
                </div>
            ))}
        </div>
    );
}
