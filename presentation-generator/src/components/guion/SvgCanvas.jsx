import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { SvgTreeInspector } from './SvgTreeInspector.jsx';

const IGNORED_TAGS = new Set([
  'defs', 'style', 'metadata', 'title', 'desc', 'clippath', 'mask',
  'lineargradient', 'radialgradient', 'pattern', 'filter', 'symbol', 'use',
]);

function getCandidates(svgRoot) {
  const filter = (els) =>
    Array.from(els).filter(
      (el) => el.nodeType === 1 && !IGNORED_TAGS.has(el.tagName.toLowerCase())
    );

  let candidates = filter(svgRoot.children);
  if (candidates.length === 1 && candidates[0].tagName.toLowerCase() === 'g') {
    candidates = filter(candidates[0].children);
  }
  return candidates;
}

function findCandidate(target, candidates) {
  for (const c of candidates) {
    if (c === target || c.contains(target)) return c;
  }
  return null;
}

export function SvgCanvas({
  svgRaw,
  editedSvg,
  onEditedSvgChange,
  selections,
  onToggle,
  onRemove,
  onReorder,
  getElementId,
  elementClass,
  idPattern,
  styleTargets,
  onSetStyleTarget,
  compact = false,
}) {
  const containerRef = useRef(null);
  const candidatesRef = useRef([]);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    if (svgRaw && !editedSvg) {
      onEditedSvgChange(svgRaw);
    }
  }, [svgRaw, editedSvg, onEditedSvgChange]);

  // Referencia para evitar loops de serialización
  const lastCommittedRef = useRef('');

  // Aplica atributos persistentes (id, class) y serializa el SVG de vuelta al store
  const commitAttributes = useCallback((candidates, sels) => {
    const classes = elementClass.split(' ').filter(Boolean);

    candidates.forEach((el) => {
      const eid = el.getAttribute('data-editor-id');
      const selIdx = sels.indexOf(eid);

      if (selIdx !== -1) {
        classes.forEach((c) => el.classList.add(c));
        el.setAttribute('id', getElementId(selIdx));
      } else {
        classes.forEach((c) => el.classList.remove(c));
        const currentId = el.getAttribute('id');
        if (currentId && idPattern.test(currentId)) {
          el.removeAttribute('id');
        }
      }
    });

    // Serializar SVG con atributos persistentes actualizados
    const container = containerRef.current;
    const svgRoot = container?.querySelector('svg');
    if (svgRoot) {
      const serialized = svgRoot.outerHTML;
      if (serialized !== lastCommittedRef.current) {
        lastCommittedRef.current = serialized;
        onEditedSvgChange(serialized);
      }
    }
  }, [elementClass, getElementId, idPattern, onEditedSvgChange]);

  // Aplica estilos visuales del editor (glow, cursor) — solo DOM, no se serializa
  const applyVisualStyles = useCallback((candidates, sels) => {
    candidates.forEach((el) => {
      const eid = el.getAttribute('data-editor-id');
      const selIdx = sels.indexOf(eid);

      if (selIdx !== -1) {
        el.style.filter = 'drop-shadow(0 0 6px rgba(255, 225, 0, 0.9))';
        el.style.cursor = 'pointer';
      } else {
        el.style.filter = '';
        el.style.cursor = '';
      }
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !editedSvg) return;

    container.innerHTML = editedSvg;
    const svgRoot = container.querySelector('svg');
    if (!svgRoot) return;

    svgRoot.setAttribute('width', '100%');
    svgRoot.setAttribute('height', '100%');
    svgRoot.style.maxHeight = '100%';

    const candidates = getCandidates(svgRoot);
    candidates.forEach((el, idx) => {
      if (!el.hasAttribute('data-editor-id')) {
        el.setAttribute('data-editor-id', String(idx));
      }
    });
    candidatesRef.current = candidates;

    // Aplicar atributos y estilos visuales
    commitAttributes(candidates, selections);
    applyVisualStyles(candidates, selections);
  }, [editedSvg]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const candidates = candidatesRef.current;
    if (candidates.length === 0) return;
    commitAttributes(candidates, selections);
    applyVisualStyles(candidates, selections);
  }, [selections]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseOver = useCallback((e) => {
    const candidate = findCandidate(e.target, candidatesRef.current);
    if (!candidate) return;
    const eid = candidate.getAttribute('data-editor-id');
    if (eid === hoveredId) return;
    setHoveredId(eid);
    if (!selections.includes(eid)) {
      candidate.style.filter = 'drop-shadow(0 0 10px rgb(255, 123, 0))';
      candidate.style.cursor = 'pointer';
    }
  }, [hoveredId, selections]);

  const handleMouseOut = useCallback((e) => {
    const candidate = findCandidate(e.target, candidatesRef.current);
    if (!candidate) return;
    const eid = candidate.getAttribute('data-editor-id');
    setHoveredId(null);
    if (!selections.includes(eid)) {
      candidate.style.filter = '';
      candidate.style.cursor = '';
    }
  }, [selections]);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    const candidate = findCandidate(e.target, candidatesRef.current);
    if (!candidate) return;
    onToggle(candidate.getAttribute('data-editor-id'));
  }, [onToggle]);

  // Tree inspector hover handlers
  const handleTreeHover = useCallback((editorId) => {
    if (editorId === hoveredId) return;
    // Clear previous hover
    if (hoveredId) {
      const prev = candidatesRef.current.find(
        (el) => el.getAttribute('data-editor-id') === hoveredId,
      );
      if (prev && !selections.includes(hoveredId)) {
        prev.style.filter = '';
        prev.style.cursor = '';
      }
    }
    setHoveredId(editorId);
    if (editorId) {
      const candidate = candidatesRef.current.find(
        (el) => el.getAttribute('data-editor-id') === editorId,
      );
      if (candidate && !selections.includes(editorId)) {
        candidate.style.filter = 'drop-shadow(0 0 4px rgba(120, 120, 120, 0.5))';
        candidate.style.cursor = 'pointer';
      }
    }
  }, [hoveredId, selections]);

  const handleTreeHoverEnd = useCallback(() => {
    if (hoveredId) {
      const prev = candidatesRef.current.find(
        (el) => el.getAttribute('data-editor-id') === hoveredId,
      );
      if (prev && !selections.includes(hoveredId)) {
        prev.style.filter = '';
        prev.style.cursor = '';
      }
    }
    setHoveredId(null);
  }, [hoveredId, selections]);

  if (!editedSvg) {
    return <p className="text-xs py-4 text-center animate-pulse-soft" style={{ color: 'var(--c-text-muted)' }}>Cargando SVG...</p>;
  }

  const minH = compact ? '280px' : '460px';
  const maxH = compact ? 'max-h-[40vh]' : 'max-h-[70vh]';

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className={compact ? 'flex gap-3' : 'flex gap-4'} style={{ minHeight: minH }}>
        {/* SVG Canvas */}
        <div
          className="flex-1 rounded-lg overflow-hidden border"
          style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}
        >
          <div
            ref={containerRef}
            className={`w-full h-full p-3 [&>svg]:w-full [&>svg]:h-auto [&>svg]:${maxH}`}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onClick={handleClick}
          />
        </div>

        {/* Right panel: Tree inspector + Selections */}
        <div className={`${compact ? 'w-60' : 'w-72'} shrink-0 flex flex-col gap-2`}>
          {/* Tree inspector */}
          <div
            className="min-h-0 overflow-auto rounded-lg border"
            style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)', maxHeight: compact ? '240px' : '360px' }}
          >
            <div
              className="sticky top-0 z-10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                borderBottom: '1px solid var(--c-border)',
                color: 'var(--c-text-muted)',
                background: 'var(--c-surface)',
              }}
            >
              Estructura
            </div>
            <SvgTreeInspector
              svgString={editedSvg}
              selections={selections}
              styleTargets={styleTargets}
              hoveredId={hoveredId}
              onHover={handleTreeHover}
              onHoverEnd={handleTreeHoverEnd}
              onClickCandidate={onToggle}
              onSetStyleTarget={onSetStyleTarget}
            />
          </div>

          {/* Selections panel */}
          <div className="shrink-0">
            <h4 className="text-xs font-semibold mb-1.5" style={{ color: 'var(--c-text-secondary)' }}>
              Puntos ({selections.length})
            </h4>

            {selections.length === 0 ? (
              <p className="text-[11px]" style={{ color: 'var(--c-text-muted)' }}>
                Clic en elementos del SVG
              </p>
            ) : (
              <div className="space-y-1.5">
                {selections.map((editorId, idx) => (
                  <div
                    key={editorId}
                    className="flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 animate-fade-in-up"
                    style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}
                  >
                    <div className="flex flex-col gap-px">
                      <button
                        onClick={() => onReorder(idx, idx - 1)}
                        disabled={idx === 0}
                        className="disabled:opacity-20 transition-opacity hover:opacity-60"
                        style={{ color: 'var(--c-text-muted)' }}
                      >
                        <ChevronUp size={10} />
                      </button>
                      <button
                        onClick={() => onReorder(idx, idx + 1)}
                        disabled={idx === selections.length - 1}
                        className="disabled:opacity-20 transition-opacity hover:opacity-60"
                        style={{ color: 'var(--c-text-muted)' }}
                      >
                        <ChevronDown size={10} />
                      </button>
                    </div>

                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ background: '#ffe100', color: '#333' }}
                    >
                      {idx + 1}
                    </span>

                    <span className="text-[11px] truncate flex-1" style={{ color: 'var(--c-text-secondary)' }}>
                      {getElementId(idx)}
                    </span>

                    <button
                      onClick={() => onRemove(editorId)}
                      className="shrink-0 hover:opacity-60 transition-opacity"
                    >
                      <X size={11} style={{ color: 'var(--c-danger)' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
