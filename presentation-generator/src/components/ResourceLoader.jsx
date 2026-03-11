import { useState, useCallback } from 'react';
import { useFileUpload } from '../hooks/useFileUpload.js';
import { DropZone } from './DropZone.jsx';
import { ResourceViewer } from './ResourceViewer.jsx';
import { Toast } from './Toast.jsx';

export function ResourceLoader() {
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const { uploadFiles, isLoading, error, uploadProgress } = useFileUpload();

  const handleUpload = useCallback(
    async (files) => {
      setToastMessage(null);
      await uploadFiles(files);
      if (!error) {
        setToastType('success');
        setToastMessage(`${files.length} archivo(s) cargado(s)`);
      } else {
        setToastType('error');
        setToastMessage(error);
      }
    },
    [uploadFiles, error]
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

      {/* Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          duration={4000}
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
}