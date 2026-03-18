/**
 * Google Cloud Text-to-Speech — ahora proxied por el backend.
 * La API key ya NO se envía desde el frontend; vive en el .env del servidor.
 */

import { encodePcmToMp3 } from './mp3Encoder.js';

const BACKEND_TTS = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/tts/synthesize`;

/**
 * Sintetiza texto a audio llamando al proxy del backend.
 * @param {string} text
 * @param {string} voiceGender - 'hombre' | 'mujer'
 * @param {string} _apiKey - ignorado (se mantiene firma por compatibilidad)
 * @param {object} [overrides] - speakingRate, pitch, etc.
 */
export async function synthesize(text, voiceGender, _apiKey, overrides = {}) {
  if (!text?.trim()) throw new Error('El texto está vacío');

  const response = await fetch(BACKEND_TTS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voice: voiceGender,
      speaking_rate: overrides.speakingRate ?? null,
      pitch: overrides.pitch ?? 0,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData?.detail || `HTTP ${response.status}`;
    throw new Error(`Error de TTS: ${msg}`);
  }

  const data = await response.json();
  const rawPcm = base64ToArrayBuffer(data.audioContent);

  const blob = encodePcmToMp3(rawPcm, 24000, 192);
  const url = URL.createObjectURL(blob);

  return { blob, url };
}

/**
 * Genera audios para múltiples textos secuencialmente.
 */
export async function synthesizeBatch(entries, voiceGender, _apiKey, overrides = {}, onProgress) {
  const results = new Map();
  const validEntries = entries.filter((e) => e.text?.trim());

  for (let i = 0; i < validEntries.length; i++) {
    const { key, text } = validEntries[i];
    try {
      const result = await synthesize(text, voiceGender, null, overrides);
      results.set(key, result);
    } catch (err) {
      results.set(key, { error: err.message });
    }
    onProgress?.(i + 1, validEntries.length, key);
  }

  return results;
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
