import { FileImage, Film, Code2, Trash2 } from 'lucide-react';
import { FILE_CATEGORIES } from '../types/mimetypes.js';
import useResourcesStore from '../stores/resourcesStore.js';

const TYPE_ICON = { svg: Code2, image: FileImage, video: Film };

export function ResourceCard({ resource, type }) {
  const removeResource = useResourcesStore((state) => state.removeResource);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const Icon = TYPE_ICON[type] || FileImage;
  const categoryLabel = FILE_CATEGORIES[type] || type.toUpperCase();

  return (
    <div className="card group flex flex-col overflow-hidden animate-fade-in-up" style={{ minHeight: 0 }}>
      {/* Preview */}
      <div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--c-accent-soft)', aspectRatio: '4/3' }}
      >
        {type === 'svg' && resource.content ? (
          <div
            className="w-full h-full p-2 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{ __html: resource.content }}
          />
        ) : type === 'image' && resource.metadata?.preview ? (
          <img
            src={resource.metadata.preview}
            alt={resource.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <Icon size={28} strokeWidth={1.5} style={{ color: 'var(--c-text-muted)' }} />
        )}

        {/* Remove overlay */}
        <button
          onClick={() => removeResource(type, resource.id)}
          className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,.05)' }}
          title="Eliminar"
        >
          <Trash2 size={14} style={{ color: 'var(--c-danger)' }} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--c-text)' }} title={resource.name}>
          {resource.name}
        </p>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-text-muted)' }}>
          <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--c-accent-soft)' }}>
            {categoryLabel}
          </span>
          <span>{formatFileSize(resource.metadata.size)}</span>
          {resource.metadata.width && resource.metadata.height && (
            <span>{resource.metadata.width}x{resource.metadata.height}</span>
          )}
          {resource.metadata.duration && (
            <span>{Math.floor(resource.metadata.duration)}s</span>
          )}
        </div>
      </div>
    </div>
  );
}