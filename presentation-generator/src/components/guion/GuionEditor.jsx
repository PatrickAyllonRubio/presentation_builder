import { useState, useCallback } from 'react';
import {
  Download, Upload, Code2, RotateCcw, Plus, Image as ImageIcon,
  Music, Grid2x2, Type, Film, ChevronDown, FileJson, FileSpreadsheet
} from 'lucide-react';
import useGuionStore from '../../stores/guionStore.js';
import { toast, confirm } from '../../stores/toastStore.js';
import { MetadataEditor } from './MetadataEditor.jsx';
import { ItemEditor } from './ItemEditor.jsx';

const TIPOS_DISPONIBLES = [
  { value: 'imagen', label: 'Imagen', icon: ImageIcon },
  { value: 'svgAudio', label: 'SVG + Audio', icon: Music },
  { value: 'galeria2D', label: 'Galería 2D', icon: Grid2x2 },
  { value: 'galeriaTexto', label: 'Galería Texto', icon: Type },
  { value: 'video', label: 'Video', icon: Film },
];

export function GuionEditor() {
  const items = useGuionStore((state) => state.items);
  const addItem = useGuionStore((state) => state.addItem);
  const toJSON = useGuionStore((state) => state.toJSON);
  const fromJSON = useGuionStore((state) => state.fromJSON);
  const reset = useGuionStore((state) => state.reset);

  const [showJSON, setShowJSON] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const handleExport = useCallback(() => {
    const json = toJSON();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guion_${json.nombre || 'presentacion'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [toJSON]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target.result);
          fromJSON(json);
        } catch {
          toast.error('El archivo no es un JSON válido');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [fromJSON]);

  const handleAddItem = (tipo) => {
    addItem(tipo);
    setAddMenuOpen(false);
  };

  const handleReset = async () => {
    if (await confirm('¿Resetear todo el guion? No se puede deshacer.')) {
      reset();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={handleImport} className="btn-secondary">
          <Upload size={14} /> Importar JSON
        </button>
        <button
          disabled
          className="btn-secondary opacity-50 cursor-not-allowed"
          title="Próximamente: importar desde PowerPoint"
        >
          <FileSpreadsheet size={14} /> Importar PPTX
        </button>
        <button onClick={handleExport} className="btn-primary">
          <Download size={14} /> Exportar
        </button>
        <button onClick={() => setShowJSON(!showJSON)} className="btn-secondary">
          <FileJson size={14} /> {showJSON ? 'Ocultar' : 'Ver'} JSON
        </button>
        <div className="flex-1" />
        <button onClick={handleReset} className="btn-danger">
          <RotateCcw size={13} /> Resetear
        </button>
      </div>

      {/* JSON Preview */}
      {showJSON && (
        <pre
          className="p-4 rounded-lg text-xs overflow-auto max-h-80 animate-scale-in font-mono"
          style={{ background: '#1a1a1a', color: '#a3e635' }}
        >
          {JSON.stringify(toJSON(), null, 2)}
        </pre>
      )}

      {/* Metadata */}
      <div className="card p-5">
        <MetadataEditor />
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
            Items
            <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--c-text-muted)' }}>
              ({items.length})
            </span>
          </h3>

          {/* Add item dropdown */}
          <div className="relative">
            <button
              onClick={() => setAddMenuOpen(!addMenuOpen)}
              className="btn-primary"
            >
              <Plus size={14} /> Agregar <ChevronDown size={12} />
            </button>
            {addMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAddMenuOpen(false)} />
                <div
                  className="absolute right-0 mt-1.5 rounded-lg border shadow-lg z-20 py-1 min-w-44 animate-scale-in"
                  style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
                >
                  {TIPOS_DISPONIBLES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        onClick={() => handleAddItem(t.value)}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors"
                        style={{ color: 'var(--c-text-secondary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--c-accent-soft)';
                          e.currentTarget.style.color = 'var(--c-text)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--c-text-secondary)';
                        }}
                      >
                        <Icon size={14} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div
            className="text-center py-12 rounded-lg border border-dashed animate-fade-in"
            style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}
          >
            <Code2 size={24} className="mx-auto mb-2" style={{ color: 'var(--c-text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--c-text-secondary)' }}>
              Sin items en el guion
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
              Agrega items para definir los puntos interactivos
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {items.map((item, index) => (
              <ItemEditor key={`${item.id}-${item.tipo}`} item={item} index={index} />
            ))}
          </div>
        )}
      </div>


    </div>
  );
}
