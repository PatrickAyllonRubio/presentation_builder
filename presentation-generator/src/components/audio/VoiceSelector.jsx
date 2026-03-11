import { User, UserRound } from 'lucide-react';
import { VOICE_CONFIGS, VOICE_GENDERS } from '../../services/tts/voiceConfigs.js';
import useAudioStore from '../../stores/audioStore.js';

const ICONS = { hombre: User, mujer: UserRound };

export function VoiceSelector() {
  const voiceGender = useAudioStore((s) => s.voiceGender);
  const setVoiceGender = useAudioStore((s) => s.setVoiceGender);

  return (
    <div className="flex gap-1">
      {VOICE_GENDERS.map((gender) => {
        const Icon = ICONS[gender];
        const config = VOICE_CONFIGS[gender];
        const isActive = voiceGender === gender;
        return (
          <button
            key={gender}
            onClick={() => setVoiceGender(gender)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: isActive ? 'var(--c-accent)' : 'transparent',
              color: isActive ? '#fff' : 'var(--c-text-secondary)',
              border: isActive ? 'none' : '1px solid var(--c-border)',
            }}
          >
            <Icon size={13} />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
