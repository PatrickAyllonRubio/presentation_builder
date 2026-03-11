import { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { ACCEPTED_FILES_STRING } from '../types/mimetypes.js';

export function DropZone({ onFiles, isLoading }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isLoading) onFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    onFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !isLoading && fileInputRef.current?.click()}
      className="relative cursor-pointer flex flex-col items-center justify-center rounded-xl p-10 transition-all"
      style={{
        borderStyle: 'dashed',
        borderWidth: '1.5px',
        borderColor: isDragging ? 'var(--c-accent)' : 'var(--c-border)',
        background: isDragging ? 'var(--c-accent-soft)' : 'var(--c-surface)',
        transform: isDragging ? 'scale(1.005)' : 'scale(1)',
        opacity: isLoading ? 0.5 : 1,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        disabled={isLoading}
        className="hidden"
        accept=".svg,.png,.jpg,.jpeg,.webp,.mp4,.webm"
      />

      <div
        className="mb-4 w-12 h-12 rounded-full flex items-center justify-center transition-all"
        style={{
          background: isDragging ? 'var(--c-accent)' : 'var(--c-accent-soft)',
          color: isDragging ? '#fff' : 'var(--c-text-secondary)',
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
      </div>

      <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
        {isDragging ? 'Suelta aquí' : 'Arrastra archivos o haz clic'}
      </p>
      <p className="text-xs mt-1.5 font-mono tracking-wide" style={{ color: 'var(--c-text-muted)' }}>
        {ACCEPTED_FILES_STRING}
      </p>
    </div>
  );
}