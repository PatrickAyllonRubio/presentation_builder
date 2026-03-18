import { useCallback } from 'react';
import { useFileUpload } from '../hooks/useFileUpload.js';
import { DropZone } from './DropZone.jsx';
import { ResourceViewer } from './ResourceViewer.jsx';
import { toast } from '../stores/toastStore.js';

// backendContext = { moduleId, presentationId } — si se pasa, sube archivos al servidor
export function ResourceLoader({ backendContext = null }) {
  const { uploadFiles, isLoading, uploadProgress } = useFileUpload(backendContext);

  const handleUpload = useCallback(
    async (files) => {
      const result = await uploadFiles(files);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.successCount} archivo(s) cargado(s)`);
      }
    },
    [uploadFiles]
  );

  return (
    <>
      {/* Upload area */}
      <section className="mb-8 animate-fade-in-up">
        <DropZone onFiles={handleUpload} isLoading={isLoading} />

        {/* Progress */}
        {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--c-text-secondary)' }}>
              <span>Procesando...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--c-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%`, background: 'var(--c-accent)' }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Resources */}
      <ResourceViewer />
    </>
  );
}