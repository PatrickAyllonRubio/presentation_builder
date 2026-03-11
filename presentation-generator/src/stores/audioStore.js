import { create } from 'zustand';
import { DEFAULT_VOICE } from '../services/tts/voiceConfigs.js';

const useAudioStore = create((set, get) => ({
  // Configuración
  apiKey: '',
  voiceGender: DEFAULT_VOICE,
  speakingRate: 1,
  pitch: 0,

  // Audios generados: Map-like { [key]: { blob, url, error? } }
  audios: {},

  // Estado de generación
  generating: false,
  batchProgress: { completed: 0, total: 0, currentKey: '' },

  // --- Acciones de configuración ---
  setApiKey: (key) => set({ apiKey: key }),
  setVoiceGender: (gender) => set({ voiceGender: gender }),
  setSpeakingRate: (rate) => set({ speakingRate: rate }),
  setPitch: (pitch) => set({ pitch }),

  // --- Acciones de audios ---
  setAudio: (key, data) => {
    set((state) => ({
      audios: { ...state.audios, [key]: data },
    }));
  },

  removeAudio: (key) => {
    const audio = get().audios[key];
    if (audio?.url) {
      URL.revokeObjectURL(audio.url);
    }
    set((state) => {
      const { [key]: _, ...rest } = state.audios;
      return { audios: rest };
    });
  },

  clearAllAudios: () => {
    const { audios } = get();
    Object.values(audios).forEach((a) => {
      if (a?.url) URL.revokeObjectURL(a.url);
    });
    set({ audios: {} });
  },

  // --- Estado de batch ---
  setGenerating: (val) => set({ generating: val }),
  setBatchProgress: (progress) => set({ batchProgress: progress }),

  // --- Helpers ---
  getOverrides: () => {
    const { speakingRate, pitch } = get();
    return { speakingRate, pitch };
  },

  hasAudio: (key) => !!get().audios[key]?.url,
}));

export default useAudioStore;
