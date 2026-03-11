import { useState } from 'react';
import {
  ChevronUp, ChevronDown, Trash2, Plus,
  Image as ImageIcon, Music, Grid2x2, Type, Film, Minus
} from 'lucide-react';
import useGuionStore from '../../stores/guionStore.js';
import useResourcesStore from '../../stores/resourcesStore.js';
import { ResourcePicker } from './ResourcePicker.jsx';

const TIPO_ICON = { imagen: ImageIcon, svgAudio: Music, galeria2D: Grid2x2, galeriaTexto: Type, video: Film };
const TIPO_LABELS = {
  imagen: 'Imagen', svgAudio: 'SVG + Audio', galeria2D: 'Galería 2D',
  galeriaTexto: 'Galería Texto', video: 'Video',
};

function SubItemEditor({ itemIndex, item }) {
  const updateSubItem = useGuionStore((state) => state.updateSubItem);
  const removeSubItem = useGuionStore((state) => state.removeSubItem);
  const addSubItem = useGuionStore((state) => state.addSubItem);
  const subItems = item.sub_items || [];

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--c-text-secondary)' }}>
          Sub-items ({subItems.length})
        </span>
        <button
          onClick={() => addSubItem(itemIndex)}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors"
          style={{ background: 'var(--c-accent-soft)', color: 'var(--c-text-secondary)' }}
        >
          <Plus size={11} /> Agregar
        </button>
      </div>

      <div className="space-y-2">
        {subItems.map((sub, si) => (
          <div
            key={si}
            className="border rounded-lg p-3 animate-fade-in-up"
            style={{ borderColor: 'var(--c-border)', background: 'var(--c-accent-soft)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium" style={{ color: 'var(--c-text-muted)' }}>
                #{si + 1}
              </span>
              <button
                onClick={() => removeSubItem(itemIndex, si)}
                className="p-0.5 rounded transition-colors hover:opacity-70"
              >
                <Minus size={12} style={{ color: 'var(--c-danger)' }} />
              </button>
            </div>

            <div className="space-y-2">
              {item.tipo === 'galeriaTexto' && (
                <input
                  type="text"
                  value={sub.label || ''}
                  onChange={(e) => updateSubItem(itemIndex, si, 'label', e.target.value)}
                  placeholder="Label"
                  className="input-field"
                />
              )}

              {(item.tipo === 'galeria2D' || item.tipo === 'galeriaTexto') && (
                <textarea
                  value={sub.narracion || ''}
                  onChange={(e) => updateSubItem(itemIndex, si, 'narracion', e.target.value)}
                  placeholder="Narración"
                  rows={2}
                  className="input-field resize-y"
                />
              )}

              <textarea
                value={sub.audio || ''}
                onChange={(e) => updateSubItem(itemIndex, si, 'audio', e.target.value)}
                placeholder="Texto audio IA"
                rows={2}
                className="input-field resize-y"
              />

              {(item.tipo === 'galeria2D' || item.tipo === 'galeriaTexto') && (
                <ResourcePicker
                  type="image"
                  value={sub.url_imagen || ''}
                  onChange={(val) => updateSubItem(itemIndex, si, 'url_imagen', val)}
                  label="Imagen"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ItemEditor({ item, index }) {
  const updateItem = useGuionStore((state) => state.updateItem);
  const removeItem = useGuionStore((state) => state.removeItem);
  const reorderItems = useGuionStore((state) => state.reorderItems);
  const totalItems = useGuionStore((state) => state.items.length);

  const [collapsed, setCollapsed] = useState(false);

  const hasSubItems = ['svgAudio', 'galeria2D', 'galeriaTexto'].includes(item.tipo);
  const Icon = TIPO_ICON[item.tipo] || ImageIcon;

  return (
    <div className="card overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer select-none"
        style={{ borderBottom: collapsed ? 'none' : '1px solid var(--c-border)' }}
        onClick={() => setCollapsed(!collapsed)}
      >
        {/* Reorder */}
        <div className="flex flex-col gap-px" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => reorderItems(index, index - 1)}
            disabled={index === 0}
            className="p-0.5 rounded disabled:opacity-20 transition-opacity hover:opacity-60"
            style={{ color: 'var(--c-text-muted)' }}
          >
            <ChevronUp size={12} />
          </button>
          <button
            onClick={() => reorderItems(index, index + 1)}
            disabled={index === totalItems - 1}
            className="p-0.5 rounded disabled:opacity-20 transition-opacity hover:opacity-60"
            style={{ color: 'var(--c-text-muted)' }}
          >
            <ChevronDown size={12} />
          </button>
        </div>

        <span className="text-xs font-bold" style={{ color: 'var(--c-text-muted)' }}>
          #{item.id}
        </span>

        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
          style={{ background: 'var(--c-accent-soft)', color: 'var(--c-text-secondary)' }}
        >
          <Icon size={11} /> {TIPO_LABELS[item.tipo]}
        </span>

        <span className="text-sm truncate flex-1" style={{ color: 'var(--c-text-secondary)' }}>
          {item.sub_titulo || '—'}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); removeItem(index); }}
          className="p-1 rounded-md transition-colors hover:opacity-70"
          title="Eliminar"
        >
          <Trash2 size={13} style={{ color: 'var(--c-danger)' }} />
        </button>

        <ChevronDown
          size={14}
          style={{
            color: 'var(--c-text-muted)',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)',
            transition: 'transform var(--transition)',
          }}
        />
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-4 space-y-3 animate-fade-in">
          {/* Subtítulo */}
          <div>
            <label className="input-label">Subtítulo</label>
            <input
              type="text"
              value={item.sub_titulo || ''}
              onChange={(e) => updateItem(index, 'sub_titulo', e.target.value)}
              placeholder="Título del modal"
              className="input-field"
            />
          </div>

          {/* Narración */}
          {item.tipo !== 'video' && (
            <div>
              <label className="input-label">Narración</label>
              <textarea
                value={item.narracion || ''}
                onChange={(e) => updateItem(index, 'narracion', e.target.value)}
                placeholder="Texto descriptivo"
                rows={2}
                className="input-field resize-y"
              />
            </div>
          )}

          {/* Audio */}
          {item.tipo !== 'video' && (
            <div>
              <label className="input-label">Texto audio IA</label>
              <textarea
                value={item.audio || ''}
                onChange={(e) => updateItem(index, 'audio', e.target.value)}
                placeholder="Lo que dirá la IA"
                rows={2}
                className="input-field resize-y"
              />
            </div>
          )}

          {/* Resource picker según tipo */}
          {item.tipo === 'imagen' && (
            <ResourcePicker type="image" value={item.url_imagen || ''} onChange={(val) => updateItem(index, 'url_imagen', val)} label="Imagen" />
          )}

          {item.tipo === 'svgAudio' && (
            <ResourcePicker
              type="svg"
              value={item.url_imagen || ''}
              onChange={(val) => {
                updateItem(index, 'url_imagen', val);
                updateItem(index, '_svgContent', '');
                updateItem(index, '_svgSelections', []);
              }}
              label="SVG del item"
            />
          )}

          {(item.tipo === 'galeria2D' || item.tipo === 'galeriaTexto') && (
            <ResourcePicker type="image" value={item.url_imagen || ''} onChange={(val) => updateItem(index, 'url_imagen', val)} label="Imagen principal" />
          )}

          {item.tipo === 'video' && (
            <ResourcePicker type="video" value={item.url_video || ''} onChange={(val) => updateItem(index, 'url_video', val)} label="Video" />
          )}

          {/* Sub-items */}
          {hasSubItems && <SubItemEditor itemIndex={index} item={item} />}
        </div>
      )}


    </div>
  );
}
