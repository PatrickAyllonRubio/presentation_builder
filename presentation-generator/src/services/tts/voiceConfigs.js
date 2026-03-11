/**
 * Configuraciones de voz para Google Cloud Text-to-Speech API.
 * Basado en el script original de AutomatizacionAudios/main.py
 */

export const VOICE_CONFIGS = {
  hombre: {
    label: 'Hombre',
    voice: {
      languageCode: 'es-US',
      name: 'es-US-Chirp3-HD-Algenib',
    },
    audioConfig: {
      audioEncoding: 'LINEAR16',
      effectsProfileId: ['small-bluetooth-speaker-class-device'],
      pitch: 0,
      speakingRate: 1.04,
    },
  },
  mujer: {
    label: 'Mujer',
    voice: {
      languageCode: 'es-US',
      name: 'es-US-Chirp3-HD-Aoede',
    },
    audioConfig: {
      audioEncoding: 'LINEAR16',
      effectsProfileId: ['small-bluetooth-speaker-class-device'],
      pitch: 0,
      speakingRate: 1,
    },
  },
};

export const VOICE_GENDERS = Object.keys(VOICE_CONFIGS);

export const DEFAULT_VOICE = 'hombre';
