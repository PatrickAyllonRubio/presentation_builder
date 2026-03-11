import { Code2, FileImage, Film, ChevronDown } from 'lucide-react';
import useResourcesStore from '../../stores/resourcesStore.js';

const TYPE_ICONS = { svg: Code2, image: FileImage, video: Film };

export function ResourcePicker({ type, value, onChange, label }) {
  const resources = useResourcesStore((state) => state.resources[type] || []);
  const Icon = TYPE_ICONS[type] || FileImage;

  return (
    <div>
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-medium mb-1" style={{ color: 'var(--c-text-secondary)' }}>
          <Icon size={12} /> {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 pr-8 border rounded-lg text-sm appearance-none cursor-pointer"
          style={{
            borderColor: 'var(--c-border)',
            background: 'var(--c-surface)',
            color: value ? 'var(--c-text)' : 'var(--c-text-muted)',
          }}
        >
          <option value="">— Seleccionar —</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--c-text-muted)' }}
        />
      </div>

      {/* Preview */}
      {value && (() => {
        const selected = resources.find((r) => r.id === value);
        if (!selected) return null;

        if (type === 'svg') {
          return (
            <div
              className="mt-2 border rounded-lg p-2 h-24 overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
              style={{ borderColor: 'var(--c-border)', background: 'var(--c-accent-soft)' }}
              dangerouslySetInnerHTML={{ __html: selected.content }}
            />
          );
        }
        if (type === 'image') {
          return (
            <img
              src={selected.content}
              alt={selected.name}
              className="mt-2 h-24 rounded-lg border object-contain"
              style={{ borderColor: 'var(--c-border)' }}
            />
          );
        }
        if (type === 'video') {
          return (
            <video
              src={selected.content}
              className="mt-2 h-24 rounded-lg border"
              style={{ borderColor: 'var(--c-border)' }}
              controls
              muted
            />
          );
        }
        return null;
      })()}
    </div>
  );
}
