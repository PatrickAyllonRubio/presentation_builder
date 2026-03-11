import { Settings, FileText, Mic, MicOff, Bug } from 'lucide-react';
import useGuionStore from '../../stores/guionStore.js';
import { ResourcePicker } from './ResourcePicker.jsx';

export function MetadataEditor() {
  const metadata = useGuionStore((state) => state.metadata);
  const updateMetadata = useGuionStore((state) => state.updateMetadata);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Settings size={15} style={{ color: 'var(--c-text-muted)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
          Datos Generales
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label className="input-label">
            <FileText size={12} /> Nombre
          </label>
          <input
            type="text"
            value={metadata.nombre}
            onChange={(e) => updateMetadata('nombre', e.target.value)}
            placeholder="Ej: Seguridad Industrial"
            className="input-field"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="input-label">
            <FileText size={12} /> Descripción
          </label>
          <input
            type="text"
            value={metadata.descripcion}
            onChange={(e) => updateMetadata('descripcion', e.target.value)}
            placeholder="Breve descripción del contenido"
            className="input-field"
          />
        </div>
      </div>

      {/* SVG principal */}
      <ResourcePicker
        type="svg"
        value={metadata.url_svg}
        onChange={(val) => updateMetadata('url_svg', val)}
        label="SVG Principal"
        icon="svg"
      />

      {/* Narración de presentación */}
      <div>
        <label className="input-label"><Mic size={12} /> Narración de presentación</label>
        <textarea
          value={metadata.audio_presentacion_narracion}
          onChange={(e) => updateMetadata('audio_presentacion_narracion', e.target.value)}
          placeholder="Texto que narrará la IA al iniciar..."
          rows={2}
          className="input-field resize-y"
        />
      </div>

      {/* Narración de despedida */}
      <div>
        <label className="input-label"><MicOff size={12} /> Narración de despedida</label>
        <textarea
          value={metadata.audio_despedida_narracion}
          onChange={(e) => updateMetadata('audio_despedida_narracion', e.target.value)}
          placeholder="Texto de cierre al completar..."
          rows={2}
          className="input-field resize-y"
        />
      </div>

      {/* Debug */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={metadata.debug}
          onChange={(e) => updateMetadata('debug', e.target.checked)}
          className="w-3.5 h-3.5 rounded accent-neutral-800"
        />
        <Bug size={13} style={{ color: 'var(--c-text-muted)' }} />
        <span className="text-xs" style={{ color: 'var(--c-text-secondary)' }}>Modo debug</span>
      </label>


    </div>
  );
}
