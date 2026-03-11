/**
 * Google Cloud Text-to-Speech API service.
 * Adapta la lógica de AutomatizacionAudios/main.py al browser.
 */

import { VOICE_CONFIGS } from './voiceConfigs.js';
import { encodePcmToMp3 } from './mp3Encoder.js';

const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/**
 * Sintetiza texto a audio usando Google Cloud TTS.
 * @param {string} text - Texto a sintetizar
 * @param {string} voiceGender - 'hombre' | 'mujer'
 * @param {string} apiKey - API key de Google Cloud
 * @param {object} [overrides] - Overrides opcionales para audioConfig (speakingRate, pitch, etc.)
 * @returns {Promise<{ blob: Blob, url: string }>} Audio como Blob y Object URL
 */
export async function synthesize(text, voiceGender, apiKey, overrides = {}) {
  if (!text?.trim()) throw new Error('El texto está vacío');
  if (!apiKey?.trim()) throw new Error('API Key no configurada');

  const config = VOICE_CONFIGS[voiceGender];
  if (!config) throw new Error(`Voz "${voiceGender}" no válida`);

  const requestBody = {
    input: { text },
    voice: { ...config.voice },
    audioConfig: {
      ...config.audioConfig,
      ...overrides,
    },
  };

  const response = await fetch(`${TTS_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Error de TTS: ${msg}`);
  }

  const data = await response.json();
  const rawPcm = base64ToArrayBuffer(data.audioContent);

  // LINEAR16 → MP3 de alta calidad (192 kbps) via lamejs
  const blob = encodePcmToMp3(rawPcm, 24000, 192);
  const url = URL.createObjectURL(blob);

  return { blob, url };
}

/**
 * Genera audios para múltiples textos secuencialmente.
 * @param {Array<{key: string, text: string}>} entries
 * @param {string} voiceGender
 * @param {string} apiKey
 * @param {object} [overrides]
 * @param {function} [onProgress] - Callback (completed, total, key)
 * @returns {Promise<Map<string, {blob: Blob, url: string}>>}
 */
export async function synthesizeBatch(entries, voiceGender, apiKey, overrides = {}, onProgress) {
  const results = new Map();
  const validEntries = entries.filter((e) => e.text?.trim());

  for (let i = 0; i < validEntries.length; i++) {
    const { key, text } = validEntries[i];
    try {
      const result = await synthesize(text, voiceGender, apiKey, overrides);
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
