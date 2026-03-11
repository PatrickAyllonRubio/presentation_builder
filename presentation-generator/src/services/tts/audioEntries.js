/**
 * Construye la lista de todas las narraciones del guion
 * que necesitan audio generado.
 */

/**
 * @typedef {Object} AudioEntry
 * @property {string} key - Clave única para el audioStore
 * @property {string} label - Etiqueta legible
 * @property {string} text - Texto a sintetizar
 * @property {string} outputPath - Ruta relativa de salida (Audios/...)
 * @property {'meta'|'item'|'subitem'} source - Origen del texto
 */

/**
 * Extrae todas las entradas de audio del guion.
 * @param {object} metadata - Metadatos del guion
 * @param {Array} items - Items del guion
 * @returns {AudioEntry[]}
 */
export function collectAudioEntries(metadata, items) {
  const entries = [];

  // Audio de presentación
  if (metadata.audio_presentacion_narracion) {
    entries.push({
      key: 'meta_presentacion',
      label: 'Narración de presentación',
      text: metadata.audio_presentacion_narracion,
      outputPath: 'Audios/audio_presentacion.mp3',
      source: 'meta',
    });
  }

  // Audio de despedida
  if (metadata.audio_despedida_narracion) {
    entries.push({
      key: 'meta_despedida',
      label: 'Narración de despedida',
      text: metadata.audio_despedida_narracion,
      outputPath: 'Audios/audio_despedida.mp3',
      source: 'meta',
    });
  }

  // Items
  items.forEach((item, i) => {
    const itemNum = item.id || String(i + 1);

    if (item.audio) {
      entries.push({
        key: `item_${itemNum}`,
        label: `Item ${itemNum}: ${item.sub_titulo || item.tipo}`,
        text: item.audio,
        outputPath: `Audios/item_${itemNum}.mp3`,
        source: 'item',
      });
    }

    // Sub-items
    (item.sub_items || []).forEach((sub, si) => {
      if (sub.audio) {
        entries.push({
          key: `item_${itemNum}_sub_${si + 1}`,
          label: `Item ${itemNum} → Sub ${si + 1}`,
          text: sub.audio,
          outputPath: `Audios/item_${itemNum}_sub_${si + 1}.mp3`,
          source: 'subitem',
        });
      }
    });
  });

  return entries;
}

/**
 * Cuenta cuántas narraciones tienen texto.
 */
export function countNarrations(metadata, items) {
  return collectAudioEntries(metadata, items).length;
}
