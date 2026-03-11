import { useState, useCallback } from 'react';
import { Volume2, Loader2, Trash2, ChevronDown } from 'lucide-react';
import useAudioStore from '../../stores/audioStore.js';
import { synthesize } from '../../services/tts/googleTts.js';
import { AudioPreview } from './AudioPreview.jsx';

export function AudioItemRow({ audioKey, label, text, outputPath }) {
  const apiKey = useAudioStore((s) => s.apiKey);
  const voiceGender = useAudioStore((s) => s.voiceGender);
  const getOverrides = useAudioStore((s) => s.getOverrides);
  const audio = useAudioStore((s) => s.audios[audioKey]);
  const setAudio = useAudioStore((s) => s.setAudio);
  const removeAudio = useAudioStore((s) => s.removeAudio);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const hasText = !!text?.trim();
  const hasAudio = !!audio?.url;

  const handleGenerate = useCallback(async () => {
    if (!hasText) return;
    setLoading(true);
    setError(null);
    try {
      const result = await synthesize(text, voiceGender, apiKey, getOverrides());
      setAudio(audioKey, result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [text, voiceGender, apiKey, audioKey, hasText, getOverrides, setAudio]);

  return (
    <div
      className="border rounded-lg overflow-hidden transition-colors"
      style={{ borderColor: hasAudio ? 'var(--c-accent)' : 'var(--c-border)', background: 'var(--c-surface)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronDown
          size={13}
          style={{
            color: 'var(--c-text-muted)',
            transform: expanded ? 'rotate(0)' : 'rotate(-90deg)',
            transition: 'transform 200ms ease',
          }}
        />

        {/* Status dot */}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: hasAudio ? '#22c55e' : hasText ? 'var(--c-border-hover)' : 'var(--c-danger)' }}
        />

        <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--c-text)' }}>
          {label}
        </span>

        {outputPath && (
          <span className="text-[10px] font-mono hidden sm:block" style={{ color: 'var(--c-text-muted)' }}>
            {outputPath}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {hasAudio && (
            <button
              onClick={() => removeAudio(audioKey)}
              className="p-1 rounded transition-opacity hover:opacity-70"
              title="Eliminar audio"
            >
              <Trash2 size={12} style={{ color: 'var(--c-danger)' }} />
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading || !hasText || !apiKey}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all disabled:opacity-40"
            style={{
              background: hasAudio ? 'var(--c-accent-soft)' : 'var(--c-accent)',
              color: hasAudio ? 'var(--c-text-secondary)' : '#fff',
            }}
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Volume2 size={11} />}
            {hasAudio ? 'Re-generar' : 'Generar'}
          </button>
        </div>
      </div>

      {/* Expanded: text preview + audio player */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 animate-fade-in" style={{ borderTop: '1px solid var(--c-border)' }}>
          {/* Narration text */}
          {hasText ? (
            <p className="text-xs leading-relaxed pt-2" style={{ color: 'var(--c-text-secondary)' }}>
              {text.length > 300 ? text.slice(0, 300) + '...' : text}
            </p>
          ) : (
            <p className="text-xs pt-2 italic" style={{ color: 'var(--c-text-muted)' }}>
              Sin texto de narración
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs px-2 py-1 rounded" style={{ background: 'var(--c-danger-soft)', color: 'var(--c-danger)' }}>
              {error}
            </p>
          )}

          {/* Audio player */}
          {hasAudio && <AudioPreview url={audio.url} />}
        </div>
      )}
    </div>
  );
}
