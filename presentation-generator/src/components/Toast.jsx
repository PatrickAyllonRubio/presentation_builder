import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import useToastStore from '../stores/toastStore.js';

const CONFIG = {
  success: { icon: CheckCircle2, light: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' }, dark: { bg: '#052e16', border: '#14532d', color: '#86efac' } },
  error:   { icon: XCircle,     light: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' }, dark: { bg: '#2a0a0a', border: '#7f1d1d', color: '#fca5a5' } },
  warning: { icon: AlertTriangle, light: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' }, dark: { bg: '#1c1a05', border: '#78350f', color: '#fcd34d' } },
  info:    { icon: Info,         light: { bg: '#f0f9ff', border: '#bae6fd', color: '#075985' }, dark: { bg: '#0a1929', border: '#0c4a6e', color: '#7dd3fc' } },
};

function SingleToast({ id, message, type = 'success', duration = 4000, index }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const removeToast = useToastStore((s) => s.removeToast);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => removeToast(id), 250);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, id, removeToast]);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(() => removeToast(id), 250);
  };

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const cfg = CONFIG[type] || CONFIG.info;
  const Icon = cfg.icon;
  const colors = isDark ? cfg.dark : cfg.light;

  return (
    <div
      className="max-w-sm flex items-center gap-3 px-4 py-3 rounded-lg border shadow-sm"
      style={{
        background: colors.bg,
        borderColor: colors.border,
        color: colors.color,
        transform: visible && !leaving ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
        opacity: visible && !leaving ? 1 : 0,
        transition: 'transform .35s cubic-bezier(.4,0,.2,1), opacity .3s ease',
        marginTop: index > 0 ? 8 : 0,
      }}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0" />
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={handleClose}
        className="shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ConfirmDialog() {
  const confirmData = useToastStore((s) => s.confirmData);
  const resolveConfirm = useToastStore((s) => s.resolveConfirm);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (confirmData) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [confirmData]);

  if (!confirmData) return null;

  const handleResolve = (value) => {
    setVisible(false);
    setTimeout(() => resolveConfirm(value), 200);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{
        background: visible ? 'rgba(0,0,0,.5)' : 'rgba(0,0,0,0)',
        transition: 'background .2s ease',
      }}
      onClick={() => handleResolve(false)}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-xl border p-6"
        style={{
          background: 'var(--c-surface)',
          borderColor: 'var(--c-border)',
          transform: visible ? 'scale(1)' : 'scale(.95)',
          opacity: visible ? 1 : 0,
          transition: 'transform .2s ease, opacity .2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--c-danger)' }} />
          <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text)' }}>
            {confirmData.message}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleResolve(false)}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleResolve(true)}
            className="btn-danger"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex flex-col">
        {toasts.map((t, i) => (
          <SingleToast key={t.id} {...t} index={i} />
        ))}
      </div>
      <ConfirmDialog />
    </>
  );
}

// Mantener export legacy para compatibilidad
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

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const cfg = CONFIG[type] || CONFIG.info;
  const Icon = cfg.icon;
  const colors = isDark ? cfg.dark : cfg.light;

  return (
    <div
      className="fixed top-4 right-4 z-50 max-w-sm flex items-center gap-3 px-4 py-3 rounded-lg border shadow-sm"
      style={{
        background: colors.bg,
        borderColor: colors.border,
        color: colors.color,
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