import { useRef, useEffect, useState, useCallback } from 'react';
import { Monitor, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import useGuionStore from '../stores/guionStore.js';
import useResourcesStore from '../stores/resourcesStore.js';
import useAudioStore from '../stores/audioStore.js';
import { generateInteractiveStyles } from '../services/svgStyleGenerator.js';

const TEMPLATE_BASE = '/templates/plantilla_presentacion';

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

const TEMPLATE_CSS_FILES = [
  'Scripts/style.css',
  'Animaciones/rotate_scale_up.css',
  'Animaciones/heartbeat.css',
  'Animaciones/fade_in_fwd.css',
  'Animaciones/puff-out-center.css',
  'Animaciones/bounce-in-top.css',
];

const TEMPLATE_JS_FILES = [
  'Clases/Presentacion.js',
  'Scripts/main.js',
];

function cleanSvgForPreview(svgString) {
  if (!svgString) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  doc.querySelectorAll('[data-editor-id]').forEach((el) => {
    el.removeAttribute('data-editor-id');
    el.style.removeProperty('filter');
    el.style.removeProperty('cursor');
    if (!el.getAttribute('style')?.trim()) el.removeAttribute('style');
  });
  const svgEl = doc.querySelector('svg');
  return svgEl ? svgEl.outerHTML : svgString;
}

/** Escapa JSON para incrustar de forma segura dentro de un <script> */
function safeJsonEmbed(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** HTML del body de la plantilla (modals, estructura, audio elements) */
const TEMPLATE_BODY = `
<div id="main">
  <div id="start">
    <img src="Imagenes/start.png" alt style="height: 10%;">
  </div>
  <div id="header" class="d-none">
    <h1 id="title" class="mb-auto text-center"></h1>
  </div>
  <div id="svg"></div>

  <div id="tipo_imagen" class="modal_personalizado d-none" tabindex="-1" aria-hidden="true">
    <div class="content">
      <div class="titulo"><span id="tipo_imagen_subtitulo" class="sub_titulo"></span></div>
      <div class="contenedor flip-container" id="flipContainerImage">
        <div class="flipper">
          <div class="front"><img src="" id="tipo_imagen_imagen" alt=""></div>
          <div class="back"><div id="tipo_imagen_texto" class="texto"></div></div>
        </div>
      </div>
      <button onclick="toggleFlip('flipContainerImage')" class="btn_flipper" id="btn_flipper_image1"
        data-target="flipContainerImage"><i class="bi bi-file-text"></i></button>
      <img src="Imagenes/exit.png" class="btn_exit">
    </div>
  </div>

  <div id="tipo_svg" class="modal_personalizado d-none" tabindex="-1" aria-hidden="true">
    <div class="content">
      <div class="titulo"><span id="tipo_svg_subtitulo" class="sub_titulo"></span></div>
      <div class="contenedor" id="containerSVG"></div>
      <img src="Imagenes/exit.png" class="btn_exit">
    </div>
  </div>

  <div id="tipo_video" class="modal_personalizado d-none" tabindex="-1" aria-hidden="true">
    <div class="content">
      <div class="titulo"><span id="tipo_video_subtitulo" class="sub_titulo"></span></div>
      <div class="contenedor" id="containerVideo">
        <video id="tipo_video_video" width="100%" height="100%" controls>
          <source src="" type="video/mp4">
        </video>
      </div>
      <img src="Imagenes/exit.png" class="btn_exit">
    </div>
  </div>

  <div id="tipo_galeria_2d" class="modal_personalizado d-none" tabindex="-1" aria-hidden="true">
    <div class="content">
      <div class="titulo"><span id="tipo_galeria_2d_subtitulo" class="sub_titulo"></span></div>
      <div class="contenedor flip-container" id="flipContainerGallery2D">
        <div class="flipper">
          <div class="front"><img src="" id="tipo_galeria_2d_imagen" alt=""></div>
          <div class="back"><div id="tipo_galeria_2d_texto" class="texto"></div></div>
        </div>
        <button onclick="toggleFlip('flipContainerGallery2D')" class="btn_flipper" id="btn_flipper_gallery2d"
          data-target="flipContainerGallery2D"><i class="bi bi-file-text"></i></button>
      </div>
      <div class="miniaturas" id="miniaturas"></div>
      <img src="Imagenes/exit.png" class="btn_exit">
    </div>
  </div>
</div>

<audio id="principal" class="d-none"></audio>
<audio id="secundario" class="d-none"></audio>
`;

export function PresentationPreview() {
  const iframeRef = useRef(null);
  const templateRef = useRef(null);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Solo para la detección de "hay algo que previsualizar"
  const metadata = useGuionStore((s) => s.metadata);
  const svgContent = useGuionStore((s) => s.svgContent);
  const items = useGuionStore((s) => s.items);
  const resources = useResourcesStore((s) => s.resources);

  // Cargar archivos de la plantilla una sola vez
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [cssResults, jsResults] = await Promise.all([
          Promise.all(TEMPLATE_CSS_FILES.map((f) =>
            fetch(`${TEMPLATE_BASE}/${f}`).then((r) => r.text())
          )),
          Promise.all(TEMPLATE_JS_FILES.map((f) =>
            fetch(`${TEMPLATE_BASE}/${f}`).then((r) => r.text())
          )),
        ]);
        if (cancelled) return;
        templateRef.current = {
          styleCss: cssResults[0],
          animationCss: cssResults.slice(1).join('\n'),
          presentacionJs: jsResults[0],
          mainJs: jsResults[1],
        };
        setTemplateLoaded(true);
      } catch (err) {
        console.error('Error cargando archivos de plantilla para preview:', err);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const buildPreview = useCallback(() => {
    if (!templateRef.current) return '';
    const t = templateRef.current;

    // Snapshot de los stores
    const guionState = useGuionStore.getState();
    const guionJSON = guionState.toJSON();
    const { svgContent: mainSvg, items: storeItems } = guionState;
    const { resources } = useResourcesStore.getState();
    const { audios } = useAudioStore.getState();

    // CSS dinámico
    const dynamicStyles = generateInteractiveStyles(guionState);

    // --- Mapas de recursos ---
    const svgByName = {};
    resources.svg.forEach((r) => { svgByName[r.name] = r; });
    const imageByName = {};
    resources.image.forEach((r) => { imageByName[r.name] = r.content; });
    const videoByName = {};
    resources.video.forEach((r) => { videoByName[r.name] = r.content; });

    // --- Mapa SVG para intercepción de fetch ---
    const svgContentMap = {};
    if (guionJSON.url_svg) {
      const name = guionJSON.url_svg.split('/').pop();
      if (mainSvg) {
        svgContentMap[guionJSON.url_svg] = cleanSvgForPreview(mainSvg);
      } else if (svgByName[name]) {
        svgContentMap[guionJSON.url_svg] = svgByName[name].content;
      }
    }

    // --- Resolver URLs de recursos en el guion ---
    if (audios.meta_presentacion?.url) guionJSON.audio_presentacion = audios.meta_presentacion.url;
    if (audios.meta_despedida?.url) guionJSON.audio_despedida = audios.meta_despedida.url;

    guionJSON.items.forEach((item) => {
      // Imágenes
      if (['imagen', 'galeria2D', 'galeriaTexto'].includes(item.tipo) && item.url_imagen) {
        const name = item.url_imagen.split('/').pop();
        if (imageByName[name]) item.url_imagen = imageByName[name];
      }

      // SVG Audio: registrar SVG para intercepción
      if (item.tipo === 'svgAudio' && item.url_imagen) {
        const editorItem = storeItems.find((i) => i.id === item.id);
        if (editorItem?._svgContent) {
          svgContentMap[item.url_imagen] = cleanSvgForPreview(editorItem._svgContent);
        } else {
          const name = item.url_imagen.split('/').pop();
          if (svgByName[name]) svgContentMap[item.url_imagen] = svgByName[name].content;
        }
      }

      // Videos
      if (item.tipo === 'video' && item.url_video) {
        const name = item.url_video.split('/').pop();
        if (videoByName[name]) item.url_video = videoByName[name];
      }

      // Audio del item
      const audioKey = `item_${item.id}`;
      if (audios[audioKey]?.url) item.url_audio = audios[audioKey].url;

      // Sub-items
      (item.sub_items || []).forEach((sub, si) => {
        if (sub.url_imagen) {
          const name = sub.url_imagen.split('/').pop();
          if (imageByName[name]) sub.url_imagen = imageByName[name];
        }
        const subKey = `item_${item.id}_sub_${si + 1}`;
        if (audios[subKey]?.url) sub.url_audio = audios[subKey].url;
      });
    });

    // --- Procesar CSS ---
    const processedCss = t.styleCss
      .replace(/\r\n/g, '\n')
      .replace(HARDCODED_RULES, dynamicStyles || '/* Sin reglas interactivas */')
      .replace(/url\(\s*['"]?\.\.\/([^'")]+)['"]?\s*\)/g, "url('$1')");

    // --- Procesar Presentacion.js (quitar export) ---
    const presentacionCode = t.presentacionJs.replace(
      /export\s+default\s+Presentacion\s*;?\s*$/m, ''
    );

    // --- Procesar main.js (quitar import ESM) ---
    const mainCode = t.mainJs
      .replace(/^import\s+Presentacion\s+from\s+['"][^'"]+['"];\s*/m, '');

    // --- Ensamblar HTML ---
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="${TEMPLATE_BASE}/">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet"
  integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css">
<style>
${processedCss}
${t.animationCss}
</style>
</head>
<body>
${TEMPLATE_BODY}
<script>
function toggleFlip(targetId) {
  var flipContainer = document.getElementById(targetId);
  if (!flipContainer) return;
  flipContainer.classList.toggle('flip');
  var icon = flipContainer.closest('.modal_personalizado').querySelector('.btn_flipper i');
  if (flipContainer.classList.contains('flip')) {
    icon.className = 'bi bi-image';
  } else {
    icon.className = 'bi bi-file-text';
  }
}
<\/script>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"
  integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"><\/script>
<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js"
  integrity="sha384-IQsoLXl5PILFhosVNubq5LC7Qb9DXgDA9i+tQ8Zj3iwWAwPtgFTxbJ8NT4GN1R8p"
  crossorigin="anonymous"><\/script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.min.js"
  integrity="sha384-cVKIPhGWiC2Al4u+LWgxfKTRIcfu0JTxR+EQDz/bgldoEyl4H0zUF0QKbrJ0EcQF"
  crossorigin="anonymous"><\/script>
<script>
var __SVG_MAP__ = ${safeJsonEmbed(svgContentMap)};
var __GUION__ = ${safeJsonEmbed(guionJSON)};
var _origFetch = window.fetch.bind(window);
window.fetch = function(url, opts) {
  if (url === 'guion.json') {
    return Promise.resolve(new Response(JSON.stringify(__GUION__), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    }));
  }
  if (__SVG_MAP__[url]) {
    return Promise.resolve(new Response(__SVG_MAP__[url], {
      status: 200, headers: { 'Content-Type': 'image/svg+xml' }
    }));
  }
  return _origFetch(url, opts);
};
<\/script>
<script>
${presentacionCode}
<\/script>
<script>
${mainCode}
<\/script>
</body>
</html>`;
  }, []);

  const loadPreview = useCallback(() => {
    const html = buildPreview();
    if (!html) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [buildPreview]);

  // Cargar preview cuando la plantilla esté lista o al recargar
  useEffect(() => {
    if (templateLoaded) loadPreview();
  }, [templateLoaded, previewKey, loadPreview]);

  const handleRefresh = useCallback(() => setPreviewKey((k) => k + 1), []);

  const hasSvg = !!svgContent || resources.svg.some((r) => r.id === metadata.url_svg);

  if (!hasSvg && !metadata.nombre) {
    return (
      <div className="card p-5">
        <div className="text-center py-8">
          <Monitor size={28} strokeWidth={1.2} className="mx-auto mb-2" style={{ color: 'var(--c-text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
            Configura el guion para ver la vista previa
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--c-border)' }}
      >
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
          <Monitor size={15} />
          Vista previa interactiva
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            title="Recargar vista previa"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            title={expanded ? 'Minimizar' : 'Expandir'}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      <div
        className="relative w-full bg-black"
        style={{ aspectRatio: expanded ? '16/8' : '16/9' }}
      >
        <iframe
          key={previewKey}
          ref={iframeRef}
          title="Preview"
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <div
        className="flex items-center gap-3 px-4 py-2 text-[10px]"
        style={{ borderTop: '1px solid var(--c-border)', color: 'var(--c-text-muted)' }}
      >
        <span>16:9</span>
        <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
        <span className="ml-auto">Clic en ↻ para recargar</span>
      </div>
    </div>
  );
}
