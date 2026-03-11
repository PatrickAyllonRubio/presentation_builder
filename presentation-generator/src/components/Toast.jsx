import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const CONFIG = {
  success: { icon: CheckCircle2, bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
  error:   { icon: XCircle,     bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
  warning: { icon: AlertTriangle, bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
  info:    { icon: Info,         bg: '#f0f9ff', border: '#bae6fd', color: '#075985' },
};

export function Toast({ message, type = 'success', duration = 4000, onClose }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onClose?.(), 250);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const { icon: Icon, bg, border, color } = CONFIG[type] || CONFIG.info;

  return (
    <div
      className="fixed top-4 right-4 z-50 max-w-sm flex items-center gap-3 px-4 py-3 rounded-lg border shadow-sm"
      style={{
        background: bg,
        borderColor: border,
        color,
        transform: visible && !leaving ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'transform .35s cubic-bezier(.4,0,.2,1), opacity .3s ease',
      }}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={() => { setLeaving(true); setTimeout(() => onClose?.(), 250); }}
        className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}