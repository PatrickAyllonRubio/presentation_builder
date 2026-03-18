import { create } from 'zustand';
import useGuionStore from './guionStore.js';
import { resourceService } from '../services/api.js';

const useResourcesStore = create((set, get) => ({
  // Estado
  resources: {
    svg: [],
    image: [],
    video: [],
  },
  uploads: {
    inProgress: 0,
    lastError: null,
    successCount: 0,
  },

  // Actions
  addResource: (type, file, content, metadata) => {
    const newResource = {
      id: crypto.randomUUID(),
      backendId: null,      // ID en la BD (se llena tras upload al backend)
      moduleId: null,       // contexto para poder borrar en backend
      presentationId: null,
      name: file.name,
      type: file.type,
      content, // base64 string o Blob URL
      metadata: {
        size: file.size,
        mimeType: file.type,
        ...metadata,
      },
      dateAdded: new Date(),
    };

    set((state) => ({
      resources: {
        ...state.resources,
        [type]: [...state.resources[type], newResource],
      },
      uploads: {
        ...state.uploads,
        successCount: state.uploads.successCount + 1,
      },
    }));

    return newResource.id;
  },

  // Asociar el ID del backend a un recurso local ya agregado
  setBackendId: (type, localId, backendId, moduleId, presentationId) => {
    set((state) => ({
      resources: {
        ...state.resources,
        [type]: state.resources[type].map((r) =>
          r.id === localId ? { ...r, backendId, moduleId, presentationId } : r
        ),
      },
    }));
  },

  // Cargar un recurso ya persistido en el backend (al abrir el editor)
  loadResourceFromBackend: (type, backendResource, content) => {
    const exists = get().resources[type].find((r) => r.backendId === backendResource.id);
    if (exists) return exists.id; // ya cargado

    const localId = crypto.randomUUID();
    const newResource = {
      id: localId,
      backendId: backendResource.id,
      moduleId: backendResource.moduleId,
      presentationId: backendResource.presentationId,
      name: backendResource.original_name,
      type: backendResource.mime_type,
      content,
      metadata: {
        size: backendResource.size_bytes,
        mimeType: backendResource.mime_type,
      },
      dateAdded: new Date(backendResource.created_at),
    };
    set((state) => ({
      resources: {
        ...state.resources,
        [type]: [...state.resources[type], newResource],
      },
    }));
    return localId;
  },

  removeResource: (type, id) => {
    // Limpiar referencias en el guion antes de eliminar el recurso
    try {
      useGuionStore.getState().cleanupResourceReferences(type, id);
    } catch { /* guionStore no disponible aún */ }

    const resource = get().resources[type].find((r) => r.id === id);

    // Si tiene backendId, eliminarlo del servidor también
    if (resource?.backendId && resource?.moduleId && resource?.presentationId) {
      resourceService
        .delete(resource.moduleId, resource.presentationId, resource.backendId)
        .catch((e) => console.warn('Error eliminando recurso del backend:', e));
    }

    set((state) => {
      const res = state.resources[type].find((r) => r.id === id);

      // Limpiar Object URLs si existen
      if (res && (res.metadata?.requiresObjectURL || type === 'video' || type === 'audio')) {
        try { URL.revokeObjectURL(res.content); } catch { /* ignore */ }
      }

      return {
        resources: {
          ...state.resources,
          [type]: state.resources[type].filter((r) => r.id !== id),
        },
      };
    });
  },

  syncConvertedImageNames: (convertedNames) => {
    if (!Array.isArray(convertedNames) || convertedNames.length === 0) return;

    // convertedSizes: [{ name, size }] (opcional)
    const sizeMap = Array.isArray(convertedSizes)
      ? Object.fromEntries(convertedSizes.map(({ name, size }) => [String(name).toLowerCase(), size]))
      : {};

    set((state) => {
      const convertedSet = new Set(convertedNames.map((name) => String(name).toLowerCase()));
      const updatedImages = state.resources.image.map((resource) => {
        const currentName = String(resource.name || '');
        const lowerCurrent = currentName.toLowerCase();

        let newSize = resource.metadata.size;
        // Buscar tamaño actualizado por nombre convertido
        if (sizeMap[lowerCurrent]) {
          newSize = sizeMap[lowerCurrent];
        } else {
          // Buscar por base (png -> jpg)
          const base = lowerCurrent.replace(/\.(png|jpe?g)$/i, '');
          const candidate = `${base}.jpg`;
          if (sizeMap[candidate]) {
            newSize = sizeMap[candidate];
          }
        }

        // Si ya coincide con un nombre convertido, solo asegura metadatos JPG y actualiza size.
        if (convertedSet.has(lowerCurrent)) {
          return {
            ...resource,
            name: currentName.replace(/\.(png|jpe?g)$/i, '.jpg'),
            type: 'image/jpeg',
            metadata: {
              ...resource.metadata,
              mimeType: 'image/jpeg',
              size: newSize,
            },
          };
        }

        // Mapear png original -> jpg convertido por nombre base.
        const base = lowerCurrent.replace(/\.(png|jpe?g)$/i, '');
        const candidate = `${base}.jpg`;
        if (convertedSet.has(candidate)) {
          return {
            ...resource,
            name: currentName.replace(/\.(png|jpe?g)$/i, '.jpg'),
            type: 'image/jpeg',
            metadata: {
              ...resource.metadata,
              mimeType: 'image/jpeg',
              size: newSize,
            },
          };
        }

        return resource;
      });

      return {
        resources: {
          ...state.resources,
          image: updatedImages,
        },
      };
    });
  },

  clearAllResources: () => {
    // Limpiar todos los Object URLs
    const state = get();
    Object.entries(state.resources).forEach(([type, items]) => {
      items.forEach((item) => {
        if (item.metadata.requiresObjectURL || type === 'video' || type === 'audio') {
          try {
            URL.revokeObjectURL(item.content);
          } catch (e) {
            console.warn('Error revoking URL:', e);
          }
        }
      });
    });

    set({
      resources: {
        svg: [],
        image: [],
        video: [],
      },
    });
  },

  setError: (error) => {
    set((state) => ({
      uploads: {
        ...state.uploads,
        lastError: error,
      },
    }));
  },

  // Getters
  getTotalResources: () => {
    const state = get();
    return Object.values(state.resources).reduce((sum, arr) => sum + arr.length, 0);
  },

  getResourceCounts: () => {
    const state = get();
    return {
      svg: state.resources.svg.length,
      image: state.resources.image.length,
      video: state.resources.video.length,
      total: Object.values(state.resources).reduce((sum, arr) => sum + arr.length, 0),
    };
  },

  getResourcesByType: (type) => {
    const state = get();
    return state.resources[type] || [];
  },
}));

export default useResourcesStore;