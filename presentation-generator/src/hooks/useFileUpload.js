import { useState } from 'react';
import { validateMultipleFiles } from '../utils/fileValidators.js';
import { processSVG } from '../utils/fileProcessors/svgProcessor.js';
import { processImage } from '../utils/fileProcessors/imageProcessor.js';
import { processVideo } from '../utils/fileProcessors/videoProcessor.js';
import useResourcesStore from '../stores/resourcesStore.js';

export function useFileUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addResource = useResourcesStore((state) => state.addResource);
  const setStoreError = useResourcesStore((state) => state.setError);

  const uploadFiles = async (files) => {
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 1. Validar todos los archivos
      const validations = validateMultipleFiles(files);

      // Agrupar por resultado
      const validFiles = validations.filter((v) => v.validation.isValid);
      const invalidFiles = validations.filter((v) => !v.validation.isValid);

      // Si hay archivos inválidos, mostrar error del primero
      if (invalidFiles.length > 0) {
        const firstError = invalidFiles[0];
        const errorMsg = `${firstError.file.name}: ${firstError.validation.errors[0]}`;
        setError(errorMsg);
        setStoreError(errorMsg);
        return;
      }

      // 2. Procesar cada archivo válido
      for (let i = 0; i < validFiles.length; i++) {
        const { file, type } = validFiles[i];

        try {
          let processed;

          if (type === 'svg') {
            processed = await processSVG(file);
          } else if (type === 'image') {
            processed = await processImage(file);
          } else if (type === 'video') {
            processed = await processVideo(file);
          }

          // 3. Agregar al store
          addResource(type, file, processed.content, processed.metadata);

          // Actualizar progreso
          setUploadProgress(((i + 1) / validFiles.length) * 100);
        } catch (fileError) {
          const errorMsg = `${file.name}: ${fileError.message}`;
          setError(errorMsg);
          setStoreError(errorMsg);
          throw fileError; // Detener en el primer error
        }
      }

      // Éxito
      setUploadProgress(100);
    } catch (err) {
      const errorMsg = err.message || 'Error desconocido al cargar archivos';
      setError(errorMsg);
      setStoreError(errorMsg);
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