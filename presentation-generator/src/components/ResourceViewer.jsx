import { useState, useMemo, useEffect } from 'react';
import { Layers, Code2, FileImage, Film, Trash2, FolderOpen, Wrench, Loader2, Play, Bot, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import useResourcesStore from '../stores/resourcesStore.js';
import { ResourceCard } from './ResourceCard.jsx';
import { toast, confirm } from '../stores/toastStore.js';
// ...existing code...

const TAB_ICONS = { all: Layers, svg: Code2, image: FileImage, video: Film };

export function ResourceViewer() {
  const [activeTab, setActiveTab] = useState('all');
  // Eliminadas variables relacionadas con optimizationHelper

  const resources = useResourcesStore((state) => state.resources);
  const clearAllResources = useResourcesStore((state) => state.clearAllResources);
  const syncConvertedImageNames = useResourcesStore((state) => state.syncConvertedImageNames);

  // ...existing code...

  // ...existing code...

  const counts = useMemo(() => ({
    svg: resources.svg.length,
    image: resources.image.length,
    video: resources.video.length,
    total: resources.svg.length + resources.image.length + resources.video.length,
  }), [resources]);

  const tabs = useMemo(() => [
    { id: 'all', label: 'Todos', count: counts.total },
    { id: 'svg', label: 'SVG', count: counts.svg },
    { id: 'image', label: 'Imágenes', count: counts.image },
    { id: 'video', label: 'Videos', count: counts.video },
  ], [counts]);

  const resourcesToShow = useMemo(() => {
    if (activeTab === 'all') {
      return Object.entries(resources)
        .flatMap(([type, items]) => items.map((item) => ({ ...item, type })))
        .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    }
    return (resources[activeTab] || [])
      .map((item) => ({ ...item, type: activeTab }))
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  }, [activeTab, resources]);

  const handleClearAll = async () => {
    if (await confirm(`¿Eliminar ${counts.total} recurso(s)? No se puede deshacer.`)) {
      clearAllResources();
    }
  };

  // ...existing code...

  // ...existing code...

  const renderResourcesGrid = () => {
    if (resourcesToShow.length === 0) {
      return (
        <div className="text-center py-16 animate-fade-in">
          <FolderOpen size={32} strokeWidth={1.2} className="mx-auto mb-3" style={{ color: 'var(--c-text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--c-text-secondary)' }}>
            {activeTab === 'all' ? 'Arrastra archivos arriba para empezar' : 'Sin recursos en esta categoría'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4 stagger-children">
        {resourcesToShow.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} type={resource.type} />
        ))}
      </div>
    );
  };

  const renderOptimizationAside = () => (
    <aside className="card p-4 h-fit space-y-3 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--c-text)' }}>
          <Wrench size={15} />
          Optimización
        </h3>
        <span
          className="text-[11px] px-2 py-0.5 rounded-full"
          style={{
            background: helperStatus === 'online' ? 'var(--c-accent-soft)' : 'var(--c-danger-soft)',
            color: helperStatus === 'online' ? 'var(--c-text-secondary)' : 'var(--c-danger)',
          }}
        >
          {helperStatus === 'checking' ? 'verificando...' : helperStatus}
        </span>
      </div>

      {helperStatus !== 'online' && (
        <div className="text-[11px] rounded-lg p-2" style={{ background: 'var(--c-accent-soft)', color: 'var(--c-text-secondary)' }}>
          Inicia el helper local con: npm run optimization:helper
        </div>
      )}

      <label className="block">
        <span className="input-label">Ruta imágenes (root)</span>
        <input
          value={imageRootPath}
          onChange={(e) => setImageRootPath(e.target.value)}
          className="input-field"
          placeholder="public/templates/plantilla_presentacion"
        />
      </label>

      <label className="block">
        <span className="input-label">Ruta curso videos</span>
        <input
          value={coursePath}
          onChange={(e) => setCoursePath(e.target.value)}
          className="input-field"
          placeholder="C:/ruta/a/Videos"
        />
      </label>

      <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-text-secondary)' }}>
        <input
          type="checkbox"
          checked={dryRun}
          onChange={(e) => setDryRun(e.target.checked)}
        />
        Ejecutar en modo dry-run
      </label>

      {dryRun && (
        <div className="text-[11px] rounded-lg p-2" style={{ background: 'var(--c-danger-soft)', color: 'var(--c-danger)' }}>
          Modo simulacion activo: no se modifican archivos en disco.
        </div>
      )}

      <button
        onClick={handleRunImageOptimizer}
        disabled={helperStatus !== 'online' || runningImages || runningVideos || counts.image === 0}
        className="btn-secondary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {runningImages ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
        Optimizar imágenes
      </button>

      <button
        onClick={handleRunVideoOptimizer}
        disabled={helperStatus !== 'online' || runningImages || runningVideos}
        className="btn-secondary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {runningVideos ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
        Optimizar videos
      </button>

      {imageSummary ? (
        <div className="card p-3 space-y-2" style={{ background: 'var(--c-accent-soft)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: imageSummary.status === 'ok' ? 'var(--c-success, #16a34a)' : imageSummary.status === 'warning' ? '#b45309' : imageSummary.status === 'error' ? 'var(--c-danger)' : 'var(--c-text-secondary)' }}>
            {imageSummary.status === 'ok' && <CheckCircle2 size={14} />}
            {imageSummary.status === 'warning' && <AlertTriangle size={14} />}
            {imageSummary.status === 'error' && <XCircle size={14} />}
            {imageSummary.status === 'info' && <Info size={14} />}
            <span>{imageSummary.title}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]" style={{ color: 'var(--c-text-secondary)' }}>
            <span>Detectadas: {imageSummary.candidateCount}</span>
            <span>Optimizadas: {imageSummary.optimizedCount}</span>
            <span>Convertidas a JPG: {imageSummary.convertedCount}</span>
            <span>Protegidas: {imageSummary.protectedCount}</span>
          </div>

          {!imageSummary.dryRunMode && imageSummary.reachedGoal && (
            <p className="text-[11px]" style={{ color: 'var(--c-success, #16a34a)' }}>
              Meta de peso alcanzada.
            </p>
          )}

          {!imageSummary.dryRunMode && imageSummary.notReachedGoal && (
            <p className="text-[11px]" style={{ color: '#b45309' }}>
              Meta de peso no alcanzada.
            </p>
          )}

          {imageSummary.errorMessage && (
            <p className="text-[11px]" style={{ color: 'var(--c-danger)' }}>
              {imageSummary.errorMessage}
            </p>
          )}

          <details className="text-[11px]" style={{ color: 'var(--c-text-secondary)' }}>
            <summary className="cursor-pointer">Ver detalle técnico</summary>
            <pre className="mt-2 whitespace-pre-wrap" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
              {optimizerLog || 'Sin detalle disponible.'}
            </pre>
          </details>
        </div>
      ) : (
        <div className="rounded-lg p-2 text-[11px]" style={{ background: 'var(--c-accent-soft)', color: 'var(--c-text-secondary)' }}>
          Aun no se ha ejecutado ninguna optimizacion.
        </div>
      )}
    </aside>
  );

  return (
    <section className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--c-text)' }}>Recursos</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-muted)' }}>
            {counts.total === 0 ? 'Sin recursos' : `${counts.total} disponible${counts.total !== 1 ? 's' : ''}`}
          </p>
        </div>
        {counts.total > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ color: 'var(--c-danger)', background: 'var(--c-danger-soft)' }}
          >
            <Trash2 size={13} />
            Limpiar
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: isActive ? 'var(--c-accent)' : 'transparent',
                color: isActive ? 'var(--c-bg)' : 'var(--c-text-secondary)',
              }}
            >
              <Icon size={13} />
              {tab.label}
              <span
                className="ml-0.5 px-1.5 py-0 rounded-full text-[10px] font-semibold"
                style={{
                  background: isActive ? 'rgba(255,255,255,.2)' : 'var(--c-accent-soft)',
                  color: isActive ? 'var(--c-bg)' : 'var(--c-text-muted)',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid and optimization tools */}
      {activeTab === 'image' ? (
        <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
          {renderResourcesGrid()}
          {renderOptimizationAside()}
        </div>
      ) : (
        renderResourcesGrid()
      )}
    </section>
  );
}