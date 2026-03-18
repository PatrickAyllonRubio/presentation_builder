import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, FileText, PenTool, Volume2, Download, Sun, Moon, Trash2, Save, ArrowLeft } from 'lucide-react';
import { ResourceLoader } from '../components/ResourceLoader.jsx';
import { GuionEditor } from '../components/guion/GuionEditor.jsx';
import { SvgEditor } from '../components/guion/SvgEditor.jsx';
import { AudioGeneratorPanel } from '../components/audio/AudioGeneratorPanel.jsx';
import { ExportPanel } from '../components/ExportPanel.jsx';
import useGuionStore from '../stores/guionStore.js';
import useResourcesStore from '../stores/resourcesStore.js';
import useAudioStore from '../stores/audioStore.js';
import { confirm } from '../stores/toastStore.js';
import useToastStore from '../stores/toastStore.js';
import { presentationService, resourceService } from '../services/api.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Mapa mime_type → tipo interno del store
const MIME_TO_TYPE = {
  'image/svg+xml': 'svg',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
};

const TABS = [
  { id: 'resources', label: 'Recursos', icon: Package },
  { id: 'guion', label: 'Editor de Guion', icon: FileText },
  { id: 'svg-editor', label: 'Editor SVG', icon: PenTool },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'export', label: 'Exportar', icon: Download },
];

export function EditorPage({ theme, toggleTheme }) {
  const { moduleId, presentationId } = useParams();
  const [activeTab, setActiveTab] = useState('resources');
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [presentationName, setPresentationName] = useState('');
  const navigate = useNavigate();

  const guionNombre = useGuionStore((s) => s.metadata.nombre);
  const showToast = useToastStore((s) => s.addToast);

  // Cargar la presentación y sus recursos desde el backend al entrar al editor
  useEffect(() => {
    if (!moduleId || !presentationId) return;

    const loadPresentation = async () => {
      // Limpiar estado previo antes de cargar la nueva presentación
      useGuionStore.getState().reset();
      useResourcesStore.getState().clearAllResources();
      useAudioStore.getState().clearAllAudios();

      // 1. Datos de la presentación + guion
      const p = await presentationService.get(moduleId, presentationId);
      setPresentationName(p.name);
      if (p.guion) {
        useGuionStore.getState().loadFromBackend(p.guion);
      } else {
        useGuionStore.getState().updateMetadata('nombre', p.name);
      }

      // 2. Cargar recursos guardados (imágenes, SVGs, videos)
      const backendResources = await resourceService.list(moduleId, presentationId);
      const loadResourceFromBackend = useResourcesStore.getState().loadResourceFromBackend;

      for (const r of backendResources) {
        const resourceType = MIME_TO_TYPE[r.mime_type];
        if (!resourceType) continue;

        try {
          const fileUrl = `${API_BASE}/modules/${moduleId}/presentations/${presentationId}/resources/${r.id}/file`;
          const resp = await fetch(fileUrl);
          const blob = await resp.blob();

          let content;
          if (resourceType === 'svg') {
            content = await blob.text();
          } else if (resourceType === 'video') {
            content = URL.createObjectURL(blob);
          } else {
            // imagen → base64 data URL
            content = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(blob);
            });
          }

          loadResourceFromBackend(
            resourceType,
            { ...r, moduleId: Number(moduleId), presentationId: Number(presentationId) },
            content
          );
        } catch (e) {
          console.warn(`No se pudo cargar recurso ${r.original_name}:`, e);
        }
      }
    };

    loadPresentation().catch(console.error);
  }, [moduleId, presentationId]);

  // Guardar guion en el backend
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const guion = useGuionStore.getState().toBackendJSON();
      await presentationService.saveGuion(moduleId, presentationId, guion);
      showToast?.('Guion guardado correctamente', 'success');
    } catch {
      showToast?.('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }, [moduleId, presentationId, showToast]);

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
      <header className="glass sticky top-0 z-30 border-b" style={{ borderColor: 'var(--c-border)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Izquierda: volver + nombre */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--c-text)' }}
              >
                <ArrowLeft size={15} />
              </button>
              <h1 className="text-base font-semibold tracking-tight flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
                {presentationName || guionNombre || 'Presentación'}
                {(guionNombre || presentationName) && (
                  <button
                    onClick={handleClearAll}
                    className="group relative p-1.5 rounded-lg transition-all hover:scale-110"
                    style={{
                      color: clearing ? 'var(--c-danger)' : 'var(--c-text-muted)',
                      background: clearing ? 'var(--c-danger-soft)' : 'transparent',
                    }}
                    title="Limpiar presentación"
                    disabled={clearing}
                  >
                    <Trash2 size={14} className={clearing ? 'animate-bounce' : 'transition-transform group-hover:rotate-12'} />
                  </button>
                )}
              </h1>
            </div>

            {/* Derecha: tabs + guardar + tema */}
            <nav className="flex items-center gap-1">
              {/* Botón guardar */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'var(--c-accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}
              >
                <Save size={13} />
                <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar'}</span>
              </button>

              <div style={{ width: 1, height: 20, background: 'var(--c-border)', margin: '0 4px' }} />

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-all"
                style={{ color: 'var(--c-text-muted)', border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-fade-in-up">
          {activeTab === 'resources' && (
            <ResourceLoader backendContext={{ moduleId: Number(moduleId), presentationId: Number(presentationId) }} />
          )}
          {activeTab === 'guion' && <GuionEditor />}
          {activeTab === 'svg-editor' && <SvgEditor />}
          {activeTab === 'audio' && <AudioGeneratorPanel />}
          {activeTab === 'export' && <ExportPanel />}
        </div>
      </main>
    </div>
  );
}
