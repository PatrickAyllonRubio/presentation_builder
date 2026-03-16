import { create } from 'zustand';

let toastId = 0;

const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // Confirmación
  confirmData: null,

  confirm: (message) => {
    return new Promise((resolve) => {
      set({
        confirmData: {
          message,
          resolve,
        },
      });
    });
  },

  resolveConfirm: (value) => {
    set((state) => {
      state.confirmData?.resolve(value);
      return { confirmData: null };
    });
  },
}));

// Helpers para uso directo
export const toast = {
  success: (msg, duration) => useToastStore.getState().addToast(msg, 'success', duration),
  error: (msg, duration) => useToastStore.getState().addToast(msg, 'error', duration),
  warning: (msg, duration) => useToastStore.getState().addToast(msg, 'warning', duration),
  info: (msg, duration) => useToastStore.getState().addToast(msg, 'info', duration),
};

export const confirm = (message) => useToastStore.getState().confirm(message);

export default useToastStore;
