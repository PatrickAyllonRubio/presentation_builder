import { create } from 'zustand';
import useResourcesStore from './resourcesStore.js';

// Mapa tipo de recurso → carpeta de la plantilla
const RESOURCE_FOLDERS = {
  svg: 'Svgs',
  image: 'Imagenes',
  video: 'Videos',
};

function resolveResourcePath(resourceId, resourceType) {
  if (!resourceId) return '';
  const resources = useResourcesStore.getState().resources;
  const list = resources[resourceType] || [];
  const found = list.find((r) => r.id === resourceId);
  if (!found) return resourceId; // devuelve tal cual si no encuentra
  const folder = RESOURCE_FOLDERS[resourceType] || '';
  return folder ? `${folder}/${found.name}` : found.name;
}
const ITEM_DEFAULTS = {
  imagen: {
    sub_titulo: '',
    tipo: 'imagen',
    narracion: '',
    audio: '',
    url_imagen: '',
    url_audio: '',
    estado: false,
  },
  svgAudio: {
    sub_titulo: '',
    tipo: 'svgAudio',
    narracion: '',
    audio: '',
    url_imagen: '',
    url_audio: '',
    estado: false,
    sub_items: [],
  },
  galeria2D: {
    sub_titulo: '',
    tipo: 'galeria2D',
    narracion: '',
    audio: '',
    url_imagen: '',
    url_audio: '',
    estado: false,
    sub_items: [],
  },
  galeriaTexto: {
    sub_titulo: '',
    tipo: 'galeriaTexto',
    narracion: '',
    audio: '',
    url_imagen: '',
    url_audio: '',
    estado: false,
    sub_items: [],
  },
  video: {
    sub_titulo: '',
    tipo: 'video',
    url_audio: '',
    url_video: '',
    estado: false,
  },
};

const SUB_ITEM_DEFAULTS = {
  svgAudio: {
    audio: '',
    url_audio: '',
    estado: false,
  },
  galeria2D: {
    narracion: '',
    audio: '',
    url_imagen: '',
    url_audio: '',
    estado: false,
  },
  galeriaTexto: {
    label: '',
    narracion: '',
    audio: '',
    url_imagen: '',
    url_audio: '',
    estado: false,
  },
};

const useGuionStore = create((set, get) => ({
  // Metadatos
  metadata: {
    nombre: '',
    descripcion: '',
    url_svg: '',
    audio_presentacion: '',
    audio_presentacion_narracion: '',
    audio_despedida: '',
    audio_despedida_narracion: '',
    debug: false,
  },

  // Items
  items: [],

  // SVG editado — contenido SVG con IDs y clases aplicados
  svgContent: '',
  // Lista ordenada de data-editor-id de elementos seleccionados como interactivos
  svgSelections: [],
  // Mapa editorId → selector CSS específico para el estilo de cada candidato
  svgStyleTargets: {},

  // --- Acciones SVG ---
  setSvgContent: (content) => set({ svgContent: content }),

  setSvgSelections: (selections) => set({ svgSelections: selections }),

  toggleSvgSelection: (editorId) => {
    set((state) => {
      const idx = state.svgSelections.indexOf(editorId);
      if (idx !== -1) {
        const { [editorId]: _, ...restTargets } = state.svgStyleTargets;
        return {
          svgSelections: state.svgSelections.filter((id) => id !== editorId),
          svgStyleTargets: restTargets,
        };
      }
      return { svgSelections: [...state.svgSelections, editorId] };
    });
  },

  reorderSvgSelection: (fromIndex, toIndex) => {
    set((state) => {
      const selections = [...state.svgSelections];
      const [moved] = selections.splice(fromIndex, 1);
      selections.splice(toIndex, 0, moved);
      return { svgSelections: selections };
    });
  },

  removeSvgSelection: (editorId) => {
    set((state) => {
      const { [editorId]: _, ...restTargets } = state.svgStyleTargets;
      return {
        svgSelections: state.svgSelections.filter((id) => id !== editorId),
        svgStyleTargets: restTargets,
      };
    });
  },

  setStyleTarget: (editorId, cssPath) => {
    set((state) => {
      if (!cssPath) {
        const { [editorId]: _, ...rest } = state.svgStyleTargets;
        return { svgStyleTargets: rest };
      }
      return { svgStyleTargets: { ...state.svgStyleTargets, [editorId]: cssPath } };
    });
  },

  // --- Acciones SVG por item (svgAudio) ---
  toggleItemSvgSelection: (itemIndex, editorId) => {
    set((state) => ({
      items: state.items.map((item, i) => {
        if (i !== itemIndex) return item;
        const sels = item._svgSelections || [];
        const idx = sels.indexOf(editorId);
        if (idx !== -1) {
          const { [editorId]: _, ...restTargets } = item._svgStyleTargets || {};
          return {
            ...item,
            _svgSelections: sels.filter((id) => id !== editorId),
            _svgStyleTargets: restTargets,
          };
        }
        return { ...item, _svgSelections: [...sels, editorId] };
      }),
    }));
  },

  removeItemSvgSelection: (itemIndex, editorId) => {
    set((state) => ({
      items: state.items.map((item, i) => {
        if (i !== itemIndex) return item;
        const { [editorId]: _, ...restTargets } = item._svgStyleTargets || {};
        return {
          ...item,
          _svgSelections: (item._svgSelections || []).filter((id) => id !== editorId),
          _svgStyleTargets: restTargets,
        };
      }),
    }));
  },

  setItemStyleTarget: (itemIndex, editorId, cssPath) => {
    set((state) => ({
      items: state.items.map((item, i) => {
        if (i !== itemIndex) return item;
        const targets = { ...(item._svgStyleTargets || {}) };
        if (!cssPath) {
          delete targets[editorId];
        } else {
          targets[editorId] = cssPath;
        }
        return { ...item, _svgStyleTargets: targets };
      }),
    }));
  },

  reorderItemSvgSelection: (itemIndex, fromIdx, toIdx) => {
    set((state) => ({
      items: state.items.map((item, i) => {
        if (i !== itemIndex) return item;
        const sels = [...(item._svgSelections || [])];
        const [moved] = sels.splice(fromIdx, 1);
        sels.splice(toIdx, 0, moved);
        return { ...item, _svgSelections: sels };
      }),
    }));
  },

  // --- Limpieza en cascada al eliminar un recurso ---
  cleanupResourceReferences: (resourceType, resourceId) => {
    set((state) => {
      const changes = {};

      if (resourceType === 'svg') {
        // Si es el SVG principal, limpiar editor
        if (state.metadata.url_svg === resourceId) {
          changes.metadata = { ...state.metadata, url_svg: '' };
          changes.svgContent = '';
          changes.svgSelections = [];
          changes.svgStyleTargets = {};
        }
        // Eliminar items svgAudio que usen este SVG
        const filtered = state.items.filter(
          (item) => !(item.tipo === 'svgAudio' && item.url_imagen === resourceId)
        );
        if (filtered.length !== state.items.length) {
          changes.items = filtered.map((item, i) => ({ ...item, id: String(i + 1) }));
        }
      }

      if (resourceType === 'image') {
        // Eliminar items imagen/galeria2D/galeriaTexto que usen esta imagen como principal
        let items = changes.items || [...state.items];
        const filtered = items.filter(
          (item) => !(['imagen', 'galeria2D', 'galeriaTexto'].includes(item.tipo) && item.url_imagen === resourceId)
        );
        if (filtered.length !== items.length) {
          changes.items = filtered.map((item, i) => ({ ...item, id: String(i + 1) }));
        }
        // Limpiar sub_items que referencien esta imagen
        const finalItems = changes.items || state.items;
        changes.items = finalItems.map((item) => {
          if (!item.sub_items) return item;
          const cleanedSubs = item.sub_items.filter((sub) => sub.url_imagen !== resourceId);
          if (cleanedSubs.length === item.sub_items.length) return item;
          if (item.tipo === 'svgAudio') {
            return { ...item, sub_items: cleanedSubs.map((s, si) => ({ ...s, id: String(si + 1) })) };
          }
          return { ...item, sub_items: cleanedSubs };
        });
      }

      if (resourceType === 'video') {
        // Eliminar items video que usen este video
        const items = changes.items || [...state.items];
        const filtered = items.filter(
          (item) => !(item.tipo === 'video' && item.url_video === resourceId)
        );
        if (filtered.length !== items.length) {
          changes.items = filtered.map((item, i) => ({ ...item, id: String(i + 1) }));
        }
      }

      return Object.keys(changes).length > 0 ? changes : state;
    });
  },

  // --- Acciones de metadatos ---
  updateMetadata: (field, value) => {
    set((state) => ({
      metadata: { ...state.metadata, [field]: value },
    }));
  },

  // --- Acciones de items ---
  addItem: (tipo) => {
    const template = ITEM_DEFAULTS[tipo];
    if (!template) return;

    set((state) => {
      const newId = String(state.items.length + 1);
      return {
        items: [...state.items, { ...template, id: newId }],
      };
    });
  },

  removeItem: (index) => {
    set((state) => ({
      items: state.items
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, id: String(i + 1) })),
    }));
  },

  updateItem: (index, field, value) => {
    set((state) => ({
      items: state.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  },

  reorderItems: (fromIndex, toIndex) => {
    set((state) => {
      const items = [...state.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return {
        items: items.map((item, i) => ({ ...item, id: String(i + 1) })),
      };
    });
  },

  // --- Acciones de sub-items ---
  addSubItem: (itemIndex) => {
    set((state) => {
      const item = state.items[itemIndex];
      if (!item || !SUB_ITEM_DEFAULTS[item.tipo]) return state;

      const template = SUB_ITEM_DEFAULTS[item.tipo];
      const subItem = item.tipo === 'svgAudio'
        ? { ...template, id: String((item.sub_items?.length || 0) + 1) }
        : { ...template };

      return {
        items: state.items.map((it, i) =>
          i === itemIndex
            ? { ...it, sub_items: [...(it.sub_items || []), subItem] }
            : it
        ),
      };
    });
  },

  removeSubItem: (itemIndex, subIndex) => {
    set((state) => ({
      items: state.items.map((item, i) => {
        if (i !== itemIndex) return item;
        const sub_items = item.sub_items.filter((_, si) => si !== subIndex);
        if (item.tipo === 'svgAudio') {
          return {
            ...item,
            sub_items: sub_items.map((s, si) => ({ ...s, id: String(si + 1) })),
          };
        }
        return { ...item, sub_items };
      }),
    }));
  },

  updateSubItem: (itemIndex, subIndex, field, value) => {
    set((state) => ({
      items: state.items.map((item, i) => {
        if (i !== itemIndex) return item;
        return {
          ...item,
          sub_items: item.sub_items.map((sub, si) =>
            si === subIndex ? { ...sub, [field]: value } : sub
          ),
        };
      }),
    }));
  },

  // --- Exportar JSON ---
  toJSON: () => {
    const { metadata, items, svgContent, svgSelections } = get();

    // Resolver rutas de recursos en metadata
    const resolvedMeta = {
      nombre: metadata.nombre,
      descripcion: metadata.descripcion,
      url_svg: resolveResourcePath(metadata.url_svg, 'svg'),
      audio_presentacion: metadata.audio_presentacion,
      audio_presentacion_narracion: metadata.audio_presentacion_narracion,
      audio_despedida: metadata.audio_despedida,
      audio_despedida_narracion: metadata.audio_despedida_narracion,
      debug: metadata.debug,
    };

    // Limpiar items: resolver rutas, quitar campos internos (_*), id primero
    const cleanItems = items.map((item) => {
      const { _svgContent, _svgSelections, _svgStyleTargets, ...rest } = item;

      // Determinar tipo de recurso para url_imagen
      const imgType = item.tipo === 'svgAudio' ? 'svg'
        : item.tipo === 'video' ? 'video'
        : 'image';

      const cleanItem = {
        id: rest.id,
        sub_titulo: rest.sub_titulo,
        tipo: rest.tipo,
      };

      // Campos opcionales según tipo
      if (rest.tipo !== 'video') {
        cleanItem.narracion = rest.narracion || '';
        cleanItem.audio = rest.audio || '';
      }

      // url_imagen / url_video
      if (rest.tipo === 'video') {
        cleanItem.url_audio = rest.url_audio || '';
        cleanItem.url_video = resolveResourcePath(rest.url_video, 'video');
      } else {
        cleanItem.url_imagen = resolveResourcePath(rest.url_imagen, imgType);
        cleanItem.url_audio = rest.url_audio || '';
      }

      cleanItem.estado = rest.estado ?? false;

      // Sub-items: limpiar campos internos
      if (rest.sub_items) {
        cleanItem.sub_items = rest.sub_items.map((sub) => {
          const cleanSub = { ...sub };
          // Resolver url_imagen en sub-items
          if (cleanSub.url_imagen) {
            cleanSub.url_imagen = resolveResourcePath(cleanSub.url_imagen, 'image');
          }
          return cleanSub;
        });
      }

      return cleanItem;
    });

    return {
      ...resolvedMeta,
      items: cleanItems,
    };
  },

  // --- Importar JSON ---
  fromJSON: (json) => {
    const { items, _editor, ...rest } = json;

    // Intentar resolver rutas de archivo de vuelta a UUIDs
    const resources = useResourcesStore.getState().resources;

    function findResourceId(path, type) {
      if (!path) return '';
      const list = resources[type] || [];
      // Si es UUID que ya existe, devolver tal cual
      const byId = list.find((r) => r.id === path);
      if (byId) return byId.id;
      // Buscar por nombre de archivo (la parte después de la última /)
      const filename = path.includes('/') ? path.split('/').pop() : path;
      const byName = list.find((r) => r.name === filename);
      return byName ? byName.id : path;
    }

    set({
      metadata: {
        nombre: rest.nombre || '',
        descripcion: rest.descripcion || '',
        url_svg: findResourceId(rest.url_svg, 'svg'),
        audio_presentacion: rest.audio_presentacion || '',
        audio_presentacion_narracion: rest.audio_presentacion_narracion || '',
        audio_despedida: rest.audio_despedida || '',
        audio_despedida_narracion: rest.audio_despedida_narracion || '',
        debug: rest.debug ?? true,
      },
      items: (items || []).map((item) => {
        const imgType = item.tipo === 'svgAudio' ? 'svg'
          : item.tipo === 'video' ? 'video'
          : 'image';
        return {
          ...item,
          url_imagen: item.url_imagen ? findResourceId(item.url_imagen, imgType) : '',
          url_video: item.url_video ? findResourceId(item.url_video, 'video') : undefined,
          sub_items: item.sub_items?.map((sub) => ({
            ...sub,
            url_imagen: sub.url_imagen ? findResourceId(sub.url_imagen, 'image') : undefined,
          })),
        };
      }),
      svgContent: _editor?.svgContent || '',
      svgSelections: _editor?.svgSelections || [],
    });
  },

  // --- Backend: guardar/cargar estado interno (IDs sin resolver) ---
  // Guarda el estado actual tal cual (con UUIDs de recursos), para persistir en BD
  toBackendJSON: () => {
    const { metadata, items, svgContent, svgSelections, svgStyleTargets } = get();
    return { metadata, items, svgContent, svgSelections, svgStyleTargets };
  },

  // Carga el estado guardado desde BD (sin necesidad de resolver rutas)
  loadFromBackend: (data) => {
    if (!data) return;
    set({
      metadata: data.metadata || get().metadata,
      items: data.items || [],
      svgContent: data.svgContent || '',
      svgSelections: data.svgSelections || [],
      svgStyleTargets: data.svgStyleTargets || {},
    });
  },

  // --- Reset ---
  reset: () => {
    set({
      metadata: {
        nombre: '',
        descripcion: '',
        url_svg: '',
        audio_presentacion: '',
        audio_presentacion_narracion: '',
        audio_despedida: '',
        audio_despedida_narracion: '',
        debug: true,
      },
      items: [],
      svgContent: '',
      svgSelections: [],
    });
  },
}));

export { ITEM_DEFAULTS, SUB_ITEM_DEFAULTS };
export default useGuionStore;
