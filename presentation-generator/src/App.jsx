import { useState } from 'react';
import { Package, FileText, PenTool, Volume2, Download } from 'lucide-react';
import { ResourceLoader } from './components/ResourceLoader.jsx';
import { GuionEditor } from './components/guion/GuionEditor.jsx';
import { SvgEditor } from './components/guion/SvgEditor.jsx';
import { AudioGeneratorPanel } from './components/audio/AudioGeneratorPanel.jsx';
import { ExportPanel } from './components/ExportPanel.jsx';
import useGuionStore from './stores/guionStore.js';
import './styles/globals.css';

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
            </h1>
            <nav className="flex items-center gap-1">
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
    </div>
  );
}

export default App;