import { useCallback, useMemo } from 'react';
import { PenTool, MousePointer, Music } from 'lucide-react';
import useGuionStore from '../../stores/guionStore.js';
import useResourcesStore from '../../stores/resourcesStore.js';
import { SvgCanvas } from './SvgCanvas.jsx';

const ID_PATTERN = /^p-\d+$/;

function SecondaryEditor({ item, index }) {
  const svgResources = useResourcesStore((s) => s.resources.svg);
  const toggleItemSvgSelection = useGuionStore((s) => s.toggleItemSvgSelection);
  const removeItemSvgSelection = useGuionStore((s) => s.removeItemSvgSelection);
  const reorderItemSvgSelection = useGuionStore((s) => s.reorderItemSvgSelection);
  const setItemStyleTarget = useGuionStore((s) => s.setItemStyleTarget);
  const updateItem = useGuionStore((s) => s.updateItem);

  const svgResource = svgResources.find((r) => r.id === item.url_imagen);

  const idPattern = useMemo(
    () => new RegExp(`^${item.id}-\\d+$`),
    [item.id]
  );

  const getElementId = useCallback(
    (idx) => `${item.id}-${idx + 1}`,
    [item.id]
  );

  const handleToggle = useCallback(
    (editorId) => toggleItemSvgSelection(index, editorId),
    [index, toggleItemSvgSelection]
  );

  const handleRemove = useCallback(
    (editorId) => removeItemSvgSelection(index, editorId),
    [index, removeItemSvgSelection]
  );

  const handleReorder = useCallback(
    (from, to) => reorderItemSvgSelection(index, from, to),
    [index, reorderItemSvgSelection]
  );

  const handleSvgContentChange = useCallback(
    (content) => updateItem(index, '_svgContent', content),
    [index, updateItem]
  );

  const handleSetStyleTarget = useCallback(
    (editorId, cssPath) => setItemStyleTarget(index, editorId, cssPath),
    [index, setItemStyleTarget]
  );

  if (!svgResource) {
    return (
      <div
        className="card p-4 text-center"
        style={{ borderStyle: 'dashed' }}
      >
        <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>
          Selecciona un SVG en el item #{item.id} para editar su interactividad
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--c-border)' }}
      >
        <Music size={13} style={{ color: 'var(--c-text-muted)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--c-text)' }}>
          Item #{item.id}
        </span>
        <span className="text-xs truncate" style={{ color: 'var(--c-text-muted)' }}>
          {item.sub_titulo || 'Sin título'}
        </span>
        {(item._svgSelections?.length || 0) > 0 && (
          <span
            className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{ background: 'var(--c-accent)', color: '#fff' }}
          >
            {item._svgSelections.length} sel.
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs mb-3" style={{ color: 'var(--c-text-muted)' }}>
          IDs: <strong>{item.id}-1</strong>, <strong>{item.id}-2</strong>, ... &middot; class: <strong>sub_items items</strong>
        </p>
        <SvgCanvas
          svgRaw={svgResource.content}
          editedSvg={item._svgContent || ''}
          onEditedSvgChange={handleSvgContentChange}
          selections={item._svgSelections || []}
          onToggle={handleToggle}
          onRemove={handleRemove}
          onReorder={handleReorder}
          getElementId={getElementId}
          elementClass="sub_items items"
          idPattern={idPattern}
          styleTargets={item._svgStyleTargets || {}}
          onSetStyleTarget={handleSetStyleTarget}
        />
      </div>
    </div>
  );
}

export function SvgEditor() {
  const svgResourceId = useGuionStore((s) => s.metadata.url_svg);
  const svgContent = useGuionStore((s) => s.svgContent);
  const svgSelections = useGuionStore((s) => s.svgSelections);
  const svgStyleTargets = useGuionStore((s) => s.svgStyleTargets);
  const setSvgContent = useGuionStore((s) => s.setSvgContent);
  const toggleSvgSelection = useGuionStore((s) => s.toggleSvgSelection);
  const removeSvgSelection = useGuionStore((s) => s.removeSvgSelection);
  const reorderSvgSelection = useGuionStore((s) => s.reorderSvgSelection);
  const setStyleTarget = useGuionStore((s) => s.setStyleTarget);
  const items = useGuionStore((s) => s.items);

  const svgResources = useResourcesStore((s) => s.resources.svg);
  const svgResource = svgResources.find((r) => r.id === svgResourceId);

  const getElementId = useCallback((idx) => `p-${idx + 1}`, []);

  const svgAudioItems = useMemo(
    () => items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.tipo === 'svgAudio'),
    [items]
  );

  if (!svgResourceId && svgAudioItems.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <PenTool size={32} strokeWidth={1.2} className="mx-auto mb-3" style={{ color: 'var(--c-text-muted)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--c-text-secondary)' }}>
          No hay SVGs para editar
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--c-text-muted)' }}>
          Selecciona un SVG principal o agrega items de tipo SVG + Audio en el Editor de Guion
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Principal SVG */}
      {svgResourceId && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--c-text)' }}>
            <PenTool size={15} />
            SVG Principal
          </h3>

          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg border text-xs mb-4"
            style={{ borderColor: 'var(--c-border)', background: 'var(--c-accent-soft)', color: 'var(--c-text-secondary)' }}
          >
            <MousePointer size={14} />
            <span>
              <strong>Hover</strong> para resaltar &middot; <strong>Clic</strong> para marcar &middot; Orden: p-1, p-2, ...
            </span>
          </div>

          <SvgCanvas
            svgRaw={svgResource?.content}
            editedSvg={svgContent}
            onEditedSvgChange={setSvgContent}
            selections={svgSelections}
            onToggle={toggleSvgSelection}
            onRemove={removeSvgSelection}
            onReorder={reorderSvgSelection}
            getElementId={getElementId}
            elementClass="items"
            idPattern={ID_PATTERN}
            styleTargets={svgStyleTargets}
            onSetStyleTarget={setStyleTarget}
          />
        </section>
      )}

      {/* Secondary SVGs */}
      {svgAudioItems.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: 'var(--c-text)' }}>
            <Music size={15} />
            SVGs Secundarios
            <span className="text-xs font-normal" style={{ color: 'var(--c-text-muted)' }}>
              ({svgAudioItems.length})
            </span>
          </h3>

          <div className="space-y-4">
            {svgAudioItems.map(({ item, index }) => (
              <SecondaryEditor key={item.id} item={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
