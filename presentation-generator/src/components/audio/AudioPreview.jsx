import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, Gauge } from 'lucide-react';

export function AudioPreview({ url, label }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
  }, [url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.playbackRate = playbackRate;
  }, [volume, playbackRate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current?.currentTime || 0);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current?.duration || 0);
  };

  const handleEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = (e.target.value / 100) * duration;
  };

  const formatTime = (t) => {
    if (!t || !isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!url) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="rounded-lg border p-3 space-y-2"
      style={{ borderColor: 'var(--c-border)', background: 'var(--c-accent-soft)' }}
    >
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {label && (
        <p className="text-[11px] font-medium truncate" style={{ color: 'var(--c-text-muted)' }}>
          {label}
        </p>
      )}

      {/* Play + progress */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'var(--c-accent)', color: 'var(--c-bg)' }}
        >
          {playing ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
        </button>

        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={handleSeek}
          className="flex-1 h-1 appearance-none rounded-full cursor-pointer"
          style={{ accentColor: 'var(--c-accent)' }}
        />

        <span className="text-[10px] font-mono w-16 text-right" style={{ color: 'var(--c-text-muted)' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Volume + Speed */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Volume2 size={11} style={{ color: 'var(--c-text-muted)' }} />
          <input
            type="range"
            min={0}
            max={100}
            value={volume * 100}
            onChange={(e) => setVolume(e.target.value / 100)}
            className="w-16 h-1 appearance-none rounded-full cursor-pointer"
            style={{ accentColor: 'var(--c-accent)' }}
          />
          <span className="text-[10px] font-mono w-8" style={{ color: 'var(--c-text-muted)' }}>
            {Math.round(volume * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Gauge size={11} style={{ color: 'var(--c-text-muted)' }} />
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
            className="text-[10px] px-1.5 py-0.5 rounded border appearance-none cursor-pointer"
            style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-text-secondary)' }}
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
              <option key={r} value={r}>{r}x</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
