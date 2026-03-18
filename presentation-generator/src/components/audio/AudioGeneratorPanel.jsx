import { useState, useCallback, useMemo } from 'react';
import {
  Volume2, Play, Loader2, Download, Settings,
  ChevronDown, CheckCircle2,
} from 'lucide-react';
import useGuionStore from '../../stores/guionStore.js';
import useAudioStore from '../../stores/audioStore.js';
import { synthesizeBatch } from '../../services/tts/googleTts.js';
import { collectAudioEntries } from '../../services/tts/audioEntries.js';
import { VoiceSelector } from './VoiceSelector.jsx';
import { AudioItemRow } from './AudioItemRow.jsx';

export function AudioGeneratorPanel() {
  const metadata = useGuionStore((s) => s.metadata);
  const items = useGuionStore((s) => s.items);
  const updateMetadata = useGuionStore((s) => s.updateMetadata);
  const updateItem = useGuionStore((s) => s.updateItem);
  const updateSubItem = useGuionStore((s) => s.updateSubItem);

  const voiceGender = useAudioStore((s) => s.voiceGender);
  const generating = useAudioStore((s) => s.generating);
  const setGenerating = useAudioStore((s) => s.setGenerating);
  const batchProgress = useAudioStore((s) => s.batchProgress);
  const setBatchProgress = useAudioStore((s) => s.setBatchProgress);
  const audios = useAudioStore((s) => s.audios);
  const setAudio = useAudioStore((s) => s.setAudio);
  const getOverrides = useAudioStore((s) => s.getOverrides);

  const [configOpen, setConfigOpen] = useState(false);

  const entries = useMemo(
    () => collectAudioEntries(metadata, items),
    [metadata, items]
  );

  const generatedCount = useMemo(
    () => entries.filter((e) => audios[e.key]?.url).length,
    [entries, audios]
  );

  // --- Write paths back to guion ---
  const writePathsToGuion = useCallback(() => {
    // Metadata paths
    if (entries.find((e) => e.key === 'meta_presentacion')) {
      updateMetadata('audio_presentacion', 'Audios/audio_presentacion.mp3');
    }
    if (entries.find((e) => e.key === 'meta_despedida')) {
      updateMetadata('audio_despedida', 'Audios/audio_despedida.mp3');
    }

    // Item paths
    items.forEach((item, i) => {
      const itemNum = item.id || String(i + 1);
      const entry = entries.find((e) => e.key === `item_${itemNum}`);
      if (entry) {
        updateItem(i, 'url_audio', entry.outputPath);
      }

      (item.sub_items || []).forEach((_, si) => {
        const subEntry = entries.find((e) => e.key === `item_${itemNum}_sub_${si + 1}`);
        if (subEntry) {
          updateSubItem(i, si, 'url_audio', subEntry.outputPath);
        }
      });
    });
  }, [entries, items, updateMetadata, updateItem, updateSubItem]);

  // --- Batch generation ---
  const handleGenerateAll = useCallback(async () => {
    if (entries.length === 0) return;
    setGenerating(true);
    setBatchProgress({ completed: 0, total: entries.length, currentKey: '' });

    try {
      const results = await synthesizeBatch(
        entries,
        voiceGender,
        null,
        getOverrides(),
        (completed, total, key) => {
          setBatchProgress({ completed, total, currentKey: key });
        }
      );

      results.forEach((data, key) => {
        if (data.url) {
          setAudio(key, data);
        }
      });

      // Asignar rutas de audio al guion automáticamente
      writePathsToGuion();
    } finally {
      setGenerating(false);
    }
  }, [entries, voiceGender, getOverrides, setGenerating, setBatchProgress, setAudio, writePathsToGuion]);

  // --- Download all audios as individual files ---
  const handleDownloadAll = useCallback(() => {
    entries.forEach((entry) => {
      const audio = audios[entry.key];
      if (!audio?.blob) return;
      const a = document.createElement('a');
      a.href = audio.url;
      const baseName = entry.outputPath.split('/').pop().replace(/\.\w+$/, '');
      a.download = `${baseName}.mp3`;
      a.click();
    });
    writePathsToGuion();
  }, [entries, audios, writePathsToGuion]);

  // No entries
  if (entries.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <Volume2 size={32} strokeWidth={1.2} className="mx-auto mb-3" style={{ color: 'var(--c-text-muted)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--c-text-secondary)' }}>
          No hay narraciones en el guion
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--c-text-muted)' }}>
          Agrega texto en los campos "audio" de los items
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Config section */}
      <div className="card">
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className="flex items-center justify-between w-full px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
            <Settings size={15} />
            Configuración de voz
          </span>
          <ChevronDown
            size={14}
            style={{
              color: 'var(--c-text-muted)',
              transform: configOpen ? 'rotate(0)' : 'rotate(-90deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </button>

        {configOpen && (
          <div className="px-4 pb-4 space-y-4 animate-fade-in" style={{ borderTop: '1px solid var(--c-border)' }}>
            {/* Voice gender */}
            <div>
              <label className="input-label mb-2">
                <Volume2 size={12} /> Voz
              </label>
              <VoiceSelector />
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs" style={{ color: 'var(--c-text-secondary)' }}>
            {generatedCount}/{entries.length} audios generados
          </span>
          {generatedCount === entries.length && entries.length > 0 && (
            <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
          )}
        </div>

        <button
          onClick={handleGenerateAll}
          disabled={generating}
          className="btn-primary disabled:opacity-40"
        >
          {generating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {batchProgress.completed}/{batchProgress.total}
            </>
          ) : (
            <>
              <Play size={14} />
              Generar todos
            </>
          )}
        </button>

        {generatedCount > 0 && (
          <button onClick={handleDownloadAll} className="btn-secondary">
            <Download size={14} />
            Descargar
          </button>
        )}
      </div>

      {/* Batch progress bar */}
      {generating && (
        <div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-border)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${batchProgress.total ? (batchProgress.completed / batchProgress.total) * 100 : 0}%`,
                background: 'var(--c-accent)',
              }}
            />
          </div>
        </div>
      )}

      {/* Audio entries list */}
      <div className="space-y-2">
        {/* Meta audios */}
        {entries.filter((e) => e.source === 'meta').length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>
              Presentación
            </h4>
            {entries.filter((e) => e.source === 'meta').map((entry) => (
              <AudioItemRow
                key={entry.key}
                audioKey={entry.key}
                label={entry.label}
                text={entry.text}
                outputPath={entry.outputPath}
              />
            ))}
          </div>
        )}

        {/* Item audios */}
        {entries.filter((e) => e.source === 'item' || e.source === 'subitem').length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-text-muted)' }}>
              Items
            </h4>
            {entries.filter((e) => e.source === 'item' || e.source === 'subitem').map((entry) => (
              <AudioItemRow
                key={entry.key}
                audioKey={entry.key}
                label={entry.label}
                text={entry.text}
                outputPath={entry.outputPath}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
