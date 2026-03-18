import { useState } from 'react';
import { validateMultipleFiles } from '../utils/fileValidators.js';
import { processSVG } from '../utils/fileProcessors/svgProcessor.js';
import { processImage } from '../utils/fileProcessors/imageProcessor.js';
import { processVideo } from '../utils/fileProcessors/videoProcessor.js';
import useResourcesStore from '../stores/resourcesStore.js';
import { resourceService } from '../services/api.js';

// backendContext = { moduleId, presentationId } — si se pasa, sube los archivos al backend
export function useFileUpload(backendContext = null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addResource = useResourcesStore((state) => state.addResource);
  const setBackendId = useResourcesStore((state) => state.setBackendId);
  const setStoreError = useResourcesStore((state) => state.setError);

  const uploadFiles = async (files) => {
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const validations = validateMultipleFiles(files);
      const validFiles = validations.filter((v) => v.validation.isValid);
      const invalidFiles = validations.filter((v) => !v.validation.isValid);

      if (invalidFiles.length > 0) {
        const firstError = invalidFiles[0];
        const errorMsg = `${firstError.file.name}: ${firstError.validation.errors[0]}`;
        setError(errorMsg);
        setStoreError(errorMsg);
        return { successCount: 0, error: errorMsg };
      }

      for (let i = 0; i < validFiles.length; i++) {
        const { file, type } = validFiles[i];

        let processed;
        if (type === 'svg') processed = await processSVG(file);
        else if (type === 'image') processed = await processImage(file);
        else if (type === 'video') processed = await processVideo(file);

        // 1. Agregar localmente al store (para preview inmediata)
        const localId = addResource(type, file, processed.content, processed.metadata);

        // 2. Si hay contexto de backend, subir el archivo al servidor
        if (backendContext?.moduleId && backendContext?.presentationId) {
          try {
            const backendResource = await resourceService.upload(
              backendContext.moduleId,
              backendContext.presentationId,
              type,
              file
            );
            // Asociar el ID del backend al recurso local
            setBackendId(type, localId, backendResource.id, backendContext.moduleId, backendContext.presentationId);
          } catch (uploadErr) {
            console.warn(`No se pudo subir "${file.name}" al backend:`, uploadErr);
            // No falla el flujo local — el archivo queda disponible para esta sesión
          }
        }

        setUploadProgress(((i + 1) / validFiles.length) * 100);
      }

      setUploadProgress(100);
      return { successCount: validFiles.length, error: null };
    } catch (err) {
      const errorMsg = err.message || 'Error desconocido al cargar archivos';
      setError(errorMsg);
      setStoreError(errorMsg);
      return { successCount: 0, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadFiles,
    isLoading,
    error,
    uploadProgress,
  };
}