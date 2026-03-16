import { useState, useEffect, useCallback } from 'react';
import { Package, FileText, PenTool, Volume2, Download, Sun, Moon, Trash2 } from 'lucide-react';
import { ResourceLoader } from './components/ResourceLoader.jsx';
import { GuionEditor } from './components/guion/GuionEditor.jsx';
import { SvgEditor } from './components/guion/SvgEditor.jsx';
import { AudioGeneratorPanel } from './components/audio/AudioGeneratorPanel.jsx';
import { ExportPanel } from './components/ExportPanel.jsx';
import useGuionStore from './stores/guionStore.js';
import useResourcesStore from './stores/resourcesStore.js';
import useAudioStore from './stores/audioStore.js';
import { ToastContainer } from './components/Toast.jsx';
import { confirm } from './stores/toastStore.js';
import './styles/globals.css';

function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const TABS = [
  { id: 'resources', label: 'Recursos', icon: Package },
  { id: 'guion', label: 'Editor de Guion', icon: FileText },
  { id: 'svg-editor', label: 'Editor SVG', icon: PenTool },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'export', label: 'Exportar', icon: Download },
];

function App() {
  const [activeTab, setActiveTab] = useState('resources');
  const presentationName = useGuionStore((s) => s.metadata.nombre);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const [clearing, setClearing] = useState(false);

  const handleClearAll = useCallback(async () => {
    if (!await confirm('¿Limpiar toda la presentación? Se eliminarán recursos, guion y audios.')) return;
    setClearing(true);
    setTimeout(() => {
      useGuionStore.getState().reset();
      useResourcesStore.getState().clearAllResources();
      useAudioStore.getState().clearAllAudios();
      setClearing(false);
    }, 600);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-bg)' }}>
      {/* Header */}
      <header className="glass sticky top-0 z-30 border-b" style={{ borderColor: 'var(--c-border)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-base font-semibold tracking-tight flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
              Presentaciones
              {presentationName && (
                <span className="text-sm font-normal opacity-40">— {presentationName}</span>
              )}
              {presentationName && (
                <button
                  onClick={handleClearAll}
                  className="group relative p-1.5 rounded-lg transition-all hover:scale-110"
                  style={{
                    color: clearing ? 'var(--c-danger)' : 'var(--c-text-muted)',
                    background: clearing ? 'var(--c-danger-soft)' : 'transparent',
                  }}
                  title={`Limpiar "${presentationName}"`}
                  disabled={clearing}
                >
                  <Trash2
                    size={14}
                    className={clearing ? 'animate-bounce' : 'transition-transform group-hover:rotate-12'}
                  />
                </button>
              )}
            </h1>
            <nav className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-all"
                style={{
                  color: 'var(--c-text-muted)',
                  border: '1px solid var(--c-border)',
                  background: 'var(--c-surface)',
                }}
                title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
              >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              </button>
              <div style={{ width: 1, height: 20, background: 'var(--c-border)', margin: '0 4px' }} />
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      color: isActive ? 'var(--c-text)' : 'var(--c-text-muted)',
                      background: isActive ? 'var(--c-accent-soft)' : 'transparent',
                    }}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-fade-in-up">
          {activeTab === 'resources' && <ResourceLoader />}
          {activeTab === 'guion' && <GuionEditor />}
          {activeTab === 'svg-editor' && <SvgEditor />}
          {activeTab === 'audio' && <AudioGeneratorPanel />}
          {activeTab === 'export' && <ExportPanel />}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}

export default App;