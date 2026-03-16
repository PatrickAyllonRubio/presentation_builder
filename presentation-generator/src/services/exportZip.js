/**
 * Empaqueta la presentación completa en un archivo ZIP
 * con la estructura de la plantilla.
 */

import JSZip from 'jszip';
import useGuionStore from '../stores/guionStore.js';
import useResourcesStore from '../stores/resourcesStore.js';
import useAudioStore from '../stores/audioStore.js';
import { collectAudioEntries } from './tts/audioEntries.js';
import { generateInteractiveStyles } from './svgStyleGenerator.js';

const TEMPLATE_BASE = import.meta.env.BASE_URL + 'templates/plantilla_presentacion';

// Archivos estáticos de la plantilla que se copian tal cual
const TEMPLATE_FILES = [
  'index.html',
  'fondo.png',
  'Animaciones/bounce-in-top.css',
  'Animaciones/fade_in_fwd.css',
  'Animaciones/heartbeat.css',
  'Animaciones/puff-out-center.css',
  'Animaciones/rotate_scale_up.css',
  'Clases/Presentacion.js',
  'Scripts/main.js',
  'Imagenes/start.png',
  'Imagenes/exit.png',
];

// Reglas CSS hardcodeadas en style.css que se reemplazan con las dinámicas
const HARDCODED_RULES = `.items.selected>circle {
    stroke: var(--borderActive);
    stroke-width: 4;
}

.sub_items.selected>g:first-child,
.sub_items.selected>circle:first-child {
    stroke: var(--borderActive);
    stroke-width: 4;

}

.itemSVG.selected>path:first-child {
    stroke: var(--borderActive);
    stroke-width: 4;
}

.items.selected.principal>g:nth-child(2) {
    stroke: var(--borderActive);
    stroke-width: 4;
}`;

/**
 * Limpia atributos internos del editor de un string SVG.
 * Remueve data-editor-id y estilos inline del editor (filter, cursor).
 */
function cleanSvgForExport(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const elements = doc.querySelectorAll('[data-editor-id]');
  elements.forEach((el) => {
    el.removeAttribute('data-editor-id');
    // Limpiar estilos inline del editor
    el.style.removeProperty('filter');
    el.style.removeProperty('cursor');
    // Si el atributo style queda vacío, removerlo
    if (!el.getAttribute('style')?.trim()) {
      el.removeAttribute('style');
    }
  });
  const svgEl = doc.querySelector('svg');
  return svgEl ? svgEl.outerHTML : svgString;
}

/**
 * Asegura que las rutas de audio estén escritas en el guion
 * antes de exportar.
 */
function ensureAudioPaths() {
  const guion = useGuionStore.getState();
  const { metadata, items } = guion;
  const audios = useAudioStore.getState().audios;
  const entries = collectAudioEntries(metadata, items);

  for (const entry of entries) {
    if (!audios[entry.key]?.blob) continue;

    if (entry.source === 'meta') {
      if (entry.key === 'meta_presentacion') {
        guion.updateMetadata('audio_presentacion', entry.outputPath);
      } else if (entry.key === 'meta_despedida') {
        guion.updateMetadata('audio_despedida', entry.outputPath);
      }
    } else if (entry.source === 'item') {
      const itemIdx = items.findIndex((it) => `item_${it.id}` === entry.key);
      if (itemIdx !== -1) {
        guion.updateItem(itemIdx, 'url_audio', entry.outputPath);
      }
    } else if (entry.source === 'subitem') {
      // key format: item_{N}_sub_{M}
      const match = entry.key.match(/^item_(\d+)_sub_(\d+)$/);
      if (match) {
        const itemIdx = items.findIndex((it) => it.id === match[1]);
        const subIdx = Number(match[2]) - 1;
        if (itemIdx !== -1) {
          guion.updateSubItem(itemIdx, subIdx, 'url_audio', entry.outputPath);
        }
      }
    }
  }
}

/**
 * Convierte una data URL (base64) a un Uint8Array de datos binarios.
 */
function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Obtiene un Blob a partir de un Object URL.
 */
async function fetchBlob(objectUrl) {
  const res = await fetch(objectUrl);
  return res.blob();
}

async function tryFetchTemplateBlob(relativePath) {
  try {
    const cacheBuster = Date.now();
    const response = await fetch(`${TEMPLATE_BASE}/${relativePath}?t=${cacheBuster}`);
    if (!response.ok) return null;
    return await response.blob();
  } catch {
    return null;
  }
}

/**
 * Exporta toda la presentación como archivo ZIP.
 * @param {function} [onProgress] - Callback (step, total, label)
 * @returns {Promise<void>}
 */
export async function exportPresentation(onProgress) {
  const zip = new JSZip();

  // Asegurar que las rutas de audio estén escritas en el guion
  ensureAudioPaths();

  // Re-leer estado después de asignar rutas
  const guionState = useGuionStore.getState();
  const guionJSON = guionState.toJSON();
  const { svgContent, items, metadata } = guionState;
  const resources = useResourcesStore.getState().resources;
  const { audios } = useAudioStore.getState();
  const audioEntries = collectAudioEntries(metadata, items);

  // Calcular total de pasos para progreso
  const totalSteps =
    TEMPLATE_FILES.length +
    resources.svg.length +
    resources.image.length +
    resources.video.length +
    audioEntries.filter((e) => audios[e.key]?.blob).length +
    1; // +1 para guion.json

  let completed = 0;
  const progress = (label) => {
    completed++;
    onProgress?.(completed, totalSteps, label);
  };

  // 1. Agregar guion.json
  zip.file('guion.json', JSON.stringify(guionJSON, null, 2));
  progress('guion.json');

  // 2. Copiar archivos estáticos de la plantilla
  for (const path of TEMPLATE_FILES) {
    try {
      const res = await fetch(`${TEMPLATE_BASE}/${path}`);
      if (res.ok) {
        const blob = await res.blob();
        zip.file(path, blob);
      }
    } catch {
      // Archivo no disponible, se omite
    }
    progress(path);
  }

  // 2b. Procesar style.css: reemplazar reglas hardcodeadas con las dinámicas
  try {
    const styleRes = await fetch(`${TEMPLATE_BASE}/Scripts/style.css`);
    if (styleRes.ok) {
      let cssText = await styleRes.text();
      const dynamicRules = generateInteractiveStyles(guionState);
      // Normalizar line endings para que el replace funcione
      const normalized = cssText.replace(/\r\n/g, '\n');
      const replaced = normalized.replace(HARDCODED_RULES, dynamicRules || '/* Sin reglas interactivas */');
      zip.file('Scripts/style.css', replaced);
    }
  } catch {
    // style.css no disponible
  }

  // 3. Agregar SVGs (con contenido editado si existe, limpiando atributos del editor)
  for (const svgResource of resources.svg) {
    let content;

    if (svgResource.id === metadata.url_svg && svgContent) {
      // SVG principal editado — limpiar atributos internos del editor
      content = cleanSvgForExport(svgContent);
    } else {
      // Verificar si algún item svgAudio usa este SVG y tiene edición
      const itemUsing = items.find(
        (item) =>
          item.tipo === 'svgAudio' &&
          item.url_imagen === svgResource.id &&
          item._svgContent
      );
      content = itemUsing
        ? cleanSvgForExport(itemUsing._svgContent)
        : svgResource.content;
    }

    zip.file(`Svgs/${svgResource.name}`, content);
    progress(`Svgs/${svgResource.name}`);
  }

  // 4. Agregar imágenes (base64 data URL → binario)
  for (const imgResource of resources.image) {
    const persisted = await tryFetchTemplateBlob(`Imagenes/${imgResource.name}`);
    if (persisted) {
      zip.file(`Imagenes/${imgResource.name}`, persisted);
    } else {
      const bytes = dataUrlToBytes(imgResource.content);
      zip.file(`Imagenes/${imgResource.name}`, bytes);
    }
    progress(`Imagenes/${imgResource.name}`);
  }

  // 5. Agregar videos (Object URL → fetch blob)
  for (const vidResource of resources.video) {
    try {
      const persisted = await tryFetchTemplateBlob(`Videos/${vidResource.name}`);
      const blob = persisted || await fetchBlob(vidResource.content);
      zip.file(`Videos/${vidResource.name}`, blob);
    } catch {
      // Video no accesible
    }
    progress(`Videos/${vidResource.name}`);
  }

  // 6. Agregar audios generados
  for (const entry of audioEntries) {
    const audio = audios[entry.key];
    if (audio?.blob) {
      zip.file(entry.outputPath, audio.blob);
      progress(entry.outputPath);
    }
  }

  // 7. Generar y descargar ZIP
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(zipBlob);
  a.download = `${guionJSON.nombre || 'presentacion'}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
