import { useState, useMemo } from 'react';
import {
  Download, Package, FileText, Music, Image, Film,
  PenTool, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import useGuionStore from '../stores/guionStore.js';
import useResourcesStore from '../stores/resourcesStore.js';
import useAudioStore from '../stores/audioStore.js';
import { collectAudioEntries } from '../services/tts/audioEntries.js';
import { exportPresentation } from '../services/exportZip.js';
import { PresentationPreview } from './PresentationPreview.jsx';

function StatusDot({ ok }) {
  return (
    <span
      className="w-2 h-2 rounded-full inline-block shrink-0"
      style={{ background: ok ? 'var(--c-success, #22c55e)' : 'var(--c-text-muted)' }}
    />
  );
}

export function ExportPanel() {
  const metadata = useGuionStore((s) => s.metadata);
  const items = useGuionStore((s) => s.items);
  const svgContent = useGuionStore((s) => s.svgContent);
  const resources = useResourcesStore((s) => s.resources);
  const audios = useAudioStore((s) => s.audios);

  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ step: 0, total: 0, label: '' });

  // --- Checklist ---
  const hasName = !!metadata.nombre?.trim();
  const hasSvg = !!metadata.url_svg;
  const hasSvgEdited = !!svgContent;
  const hasItems = items.length > 0;

  const audioEntries = useMemo(
    () => collectAudioEntries(metadata, items),
    [metadata, items]
  );
  const totalAudios = audioEntries.length;
  const generatedAudios = audioEntries.filter((e) => audios[e.key]?.blob).length;

  const svgCount = resources.svg.length;
  const imageCount = resources.image.length;
  const videoCount = resources.video.length;

  const warnings = [];
  if (!hasName) warnings.push('No se ha definido un nombre para la presentación');
  if (!hasSvg) warnings.push('No se ha asignado un SVG principal');
  if (hasSvg && !hasSvgEdited) warnings.push('El SVG principal no ha sido editado');
  if (!hasItems) warnings.push('No hay items en el guion');
  if (totalAudios > 0 && generatedAudios < totalAudios) {
    warnings.push(`Faltan ${totalAudios - generatedAudios} audios por generar`);
  }

  const canExport = hasName && hasSvg && hasItems;

  const handleExport = async () => {
    setExporting(true);
    setProgress({ step: 0, total: 0, label: 'Preparando...' });
    try {
      await exportPresentation((step, total, label) => {
        setProgress({ step, total, label });
      });
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Resumen */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
          <Package size={15} />
          Resumen de la presentación
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-text-secondary)' }}>
            <StatusDot ok={hasName} />
            <FileText size={13} />
            <span>Nombre: {hasName ? metadata.nombre : <em style={{ color: 'var(--c-text-muted)' }}>sin definir</em>}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-text-secondary)' }}>
            <StatusDot ok={hasSvg && hasSvgEdited} />
            <PenTool size={13} />
            <span>SVG principal: {hasSvg ? (hasSvgEdited ? 'editado' : 'asignado') : 'ninguno'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-text-secondary)' }}>
            <StatusDot ok={hasItems} />
            <FileText size={13} />
            <span>{items.length} item{items.length !== 1 ? 's' : ''} en el guion</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-text-secondary)' }}>
            <StatusDot ok={totalAudios === 0 || generatedAudios === totalAudios} />
            <Music size={13} />
            <span>Audios: {generatedAudios}/{totalAudios}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-text-secondary)' }}>
            <Image size={13} />
            <span>{svgCount} SVG{svgCount !== 1 ? 's' : ''}, {imageCount} imagen{imageCount !== 1 ? 'es' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-text-secondary)' }}>
            <Film size={13} />
            <span>{videoCount} video{videoCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Advertencias */}
      {warnings.length > 0 && (
        <div
          className="card p-4 space-y-2"
          style={{ borderColor: 'var(--c-warning, #f59e0b)', borderWidth: '1px' }}
        >
          <h4 className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--c-warning, #f59e0b)' }}>
            <AlertCircle size={13} />
            Advertencias
          </h4>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs pl-5" style={{ color: 'var(--c-text-secondary)' }}>
              • {w}
            </p>
          ))}
        </div>
      )}

      {/* Vista previa */}
      <PresentationPreview />

      {/* Progreso */}
      {exporting && (
        <div className="card p-4 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-text-secondary)' }}>
            <Loader2 size={13} className="animate-spin" />
            <span>Empaquetando: {progress.label}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: progress.total > 0 ? `${(progress.step / progress.total) * 100}%` : '0%',
                background: 'var(--c-accent)',
              }}
            />
          </div>
          <p className="text-[11px] text-right" style={{ color: 'var(--c-text-muted)' }}>
            {progress.step}/{progress.total}
          </p>
        </div>
      )}

      {/* Botón de descarga */}
      <button
        onClick={handleExport}
        disabled={!canExport || exporting}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {exporting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generando ZIP...
          </>
        ) : (
          <>
            <Download size={16} />
            Descargar presentación
          </>
        )}
      </button>

      {/* Éxito */}
      {!exporting && canExport && generatedAudios === totalAudios && warnings.length === 0 && (
        <div className="flex items-center justify-center gap-2 text-xs animate-fade-in" style={{ color: 'var(--c-success, #22c55e)' }}>
          <CheckCircle2 size={14} />
          <span>Todo listo para exportar</span>
        </div>
      )}
    </div>
  );
}
