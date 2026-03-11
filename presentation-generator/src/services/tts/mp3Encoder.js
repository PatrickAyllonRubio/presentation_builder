/**
 * Convierte PCM 16-bit (LINEAR16) a MP3 de alta calidad en el browser.
 * Usa lamejs (port de LAME) — equivalente a `ffmpeg -q:a 0`.
 */

import lamejs from '@jambonz/lamejs';

/**
 * Codifica datos PCM crudos a MP3 de alta calidad.
 * @param {ArrayBuffer} pcmBuffer - PCM 16-bit signed LE mono (de Google TTS LINEAR16)
 * @param {number} [sampleRate=24000] - Frecuencia de muestreo
 * @param {number} [kbps=192] - Bitrate en kbps (128, 160, 192, 256, 320)
 * @returns {Blob} MP3 blob
 */
export function encodePcmToMp3(pcmBuffer, sampleRate = 24000, kbps = 192) {
  const samples = new Int16Array(pcmBuffer);
  const channels = 1;
  const encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);

  const mp3Parts = [];
  const blockSize = 1152; // LAME frame size

  for (let i = 0; i < samples.length; i += blockSize) {
    const chunk = samples.subarray(i, i + blockSize);
    const mp3buf = encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      mp3Parts.push(mp3buf);
    }
  }

  // Flush remaining
  const end = encoder.flush();
  if (end.length > 0) {
    mp3Parts.push(end);
  }

  return new Blob(mp3Parts, { type: 'audio/mpeg' });
}
