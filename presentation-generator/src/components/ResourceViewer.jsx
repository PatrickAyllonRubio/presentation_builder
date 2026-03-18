import { useState, useMemo } from 'react';
import { Layers, Code2, FileImage, Film, Trash2, FolderOpen } from 'lucide-react';
import useResourcesStore from '../stores/resourcesStore.js';
import { ResourceCard } from './ResourceCard.jsx';
import { toast, confirm } from '../stores/toastStore.js';
// ...existing code...

const TAB_ICONS = { all: Layers, svg: Code2, image: FileImage, video: Film };

export function ResourceViewer() {
  const [activeTab, setActiveTab] = useState('all');

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

      {/* Resources Grid */}
      {renderResourcesGrid()}
    </section>
  );
}