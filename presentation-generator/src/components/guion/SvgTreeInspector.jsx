import { useState, useMemo, useCallback } from 'react';
import { ChevronRight, ChevronDown, Crosshair } from 'lucide-react';

const IGNORED_TAGS = new Set([
  'defs', 'style', 'metadata', 'title', 'desc', 'clippath', 'mask',
  'lineargradient', 'radialgradient', 'pattern', 'filter', 'symbol',
]);

const EXTRA_ATTRS = {
  svg: ['viewBox'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  rect: ['x', 'y', 'width', 'height'],
  line: ['x1', 'y1', 'x2', 'y2'],
  path: ['d'],
  polygon: ['points'],
  polyline: ['points'],
  image: ['href', 'xlink:href'],
  use: ['href', 'xlink:href'],
  g: ['transform'],
};

const TAG_COLOR = '#881280';
const ATTR_NAME_COLOR = '#994500';
const ATTR_VALUE_COLOR = '#1a1aa6';
const TARGET_COLOR = '#e65100';

function truncate(str, max = 30) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function getDisplayAttrs(tag, element) {
  const attrs = [];
  const id = element.getAttribute('id');
  const cls = element.getAttribute('class');
  if (id) attrs.push(['id', id]);
  if (cls) attrs.push(['class', cls]);

  const extras = EXTRA_ATTRS[tag] || [];
  for (const name of extras) {
    if (attrs.length >= 4) break;
    const val = element.getAttribute(name);
    if (val && name !== 'id' && name !== 'class') {
      attrs.push([name, truncate(val)]);
    }
  }
  return attrs;
}

function buildTree(element) {
  if (element.nodeType !== 1) return null;

  const tag = element.tagName.toLowerCase();
  const editorId = element.getAttribute('data-editor-id');
  const displayAttrs = getDisplayAttrs(tag, element);

  const children = [];
  for (let i = 0; i < element.children.length; i++) {
    const node = buildTree(element.children[i]);
    if (node) {
      node.nthChild = i + 1; // posición 1-indexed entre TODOS los hijos elemento
      children.push(node);
    }
  }

  return { tag, displayAttrs, editorId, isIgnored: IGNORED_TAGS.has(tag), children, nthChild: null };
}

function pathToCss(path) {
  if (!path || path.length === 0) return null;
  return path.map(({ tag, nth }) => `> ${tag}:nth-child(${nth})`).join(' ');
}

function TreeNode({
  node,
  depth,
  parentCandidateId,
  pathFromCandidate,
  selections,
  styleTargets,
  hoveredId,
  onHover,
  onHoverEnd,
  onClickCandidate,
  onSetStyleTarget,
}) {
  const [expanded, setExpanded] = useState(!node.isIgnored && depth < 3);
  const hasChildren = node.children.length > 0;
  const isCandidate = node.editorId != null;
  const effectiveId = node.editorId ?? parentCandidateId;
  const isSelected = isCandidate && selections.includes(node.editorId);
  const selIdx = isSelected ? selections.indexOf(node.editorId) : -1;
  const isHighlighted = effectiveId != null && effectiveId === hoveredId;
  const interactive = effectiveId != null;

  // Calcular si este nodo es el style target actual
  const cssPath = pathFromCandidate?.length ? pathToCss(pathFromCandidate) : null;
  const currentTarget = effectiveId != null ? styleTargets?.[effectiveId] : null;
  const isStyleTarget = cssPath != null && currentTarget === cssPath;

  const handleMouseEnter = useCallback(() => {
    if (effectiveId != null) onHover(effectiveId);
  }, [effectiveId, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHoverEnd();
  }, [onHoverEnd]);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (isCandidate) {
        // Click en un candidato → toggle selección
        onClickCandidate(node.editorId);
      } else if (effectiveId != null && pathFromCandidate?.length > 0) {
        // Click en un hijo de un candidato → establecer style target
        if (!selections.includes(effectiveId)) {
          onClickCandidate(effectiveId);
        }
        const newCss = pathToCss(pathFromCandidate);
        // Toggle: si ya es el target, limpiar
        onSetStyleTarget(effectiveId, currentTarget === newCss ? null : newCss);
      }
    },
    [isCandidate, node.editorId, effectiveId, pathFromCandidate, selections, currentTarget, onClickCandidate, onSetStyleTarget],
  );

  const toggleExpand = useCallback((e) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

  const bgColor = isStyleTarget
    ? 'rgba(230, 81, 0, 0.12)'
    : isHighlighted
      ? 'rgba(255, 225, 0, 0.18)'
      : isSelected
        ? 'rgba(255, 225, 0, 0.07)'
        : undefined;

  // Los hijos de candidatos no-seleccionados no deben tener style target visual,
  // pero sí deben poder ser clickeados
  const isChildOfSelected = !isCandidate && effectiveId != null && selections.includes(effectiveId);

  return (
    <div style={{ opacity: node.isIgnored ? 0.4 : 1 }}>
      <div
        className={`flex items-center gap-0.5 py-[1px] rounded-sm ${interactive ? 'hover:bg-black/[0.04] cursor-pointer' : ''}`}
        style={{
          paddingLeft: depth * 14 + 2,
          background: bgColor,
          borderLeft: isStyleTarget ? `2px solid ${TARGET_COLOR}` : undefined,
        }}
        onMouseEnter={interactive ? handleMouseEnter : undefined}
        onMouseLeave={interactive ? handleMouseLeave : undefined}
        onClick={interactive ? handleClick : undefined}
      >
        {hasChildren ? (
          <button
            onClick={toggleExpand}
            className="shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-black/10"
            style={{ color: 'var(--c-text-muted)' }}
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span className="truncate">
          <span style={{ color: TAG_COLOR }}>&lt;{node.tag}</span>
          {node.displayAttrs.map(([name, value]) => (
            <span key={name}>
              {' '}
              <span style={{ color: ATTR_NAME_COLOR }}>{name}</span>=
              <span style={{ color: ATTR_VALUE_COLOR }}>"{value}"</span>
            </span>
          ))}
          <span style={{ color: TAG_COLOR }}>{hasChildren ? '>' : ' />'}</span>
        </span>

        {isStyleTarget && (
          <Crosshair size={11} className="shrink-0 ml-1" style={{ color: TARGET_COLOR }} />
        )}

        {isSelected && (
          <span
            className="shrink-0 ml-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: '#ffe100', color: '#333' }}
          >
            {selIdx + 1}
          </span>
        )}

        {isChildOfSelected && !isCandidate && cssPath && !isStyleTarget && (
          <span
            className="shrink-0 ml-auto text-[9px] opacity-0 group-hover:opacity-60 transition-opacity"
            style={{ color: 'var(--c-text-muted)' }}
            title="Click para establecer como objetivo del estilo"
          >
            ⊕
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <>
          {node.children.map((child, i) => {
            // Construir el path desde el candidato
            let childPath;
            if (child.editorId != null) {
              // Este hijo ES un candidato → su propio path empieza vacío
              childPath = [];
            } else if (isCandidate || pathFromCandidate != null) {
              // Estamos dentro de un candidato
              const basePath = isCandidate ? [] : pathFromCandidate;
              childPath = [...basePath, { tag: child.tag, nth: child.nthChild }];
            } else {
              childPath = null;
            }

            return (
              <TreeNode
                key={i}
                node={child}
                depth={depth + 1}
                parentCandidateId={child.editorId ?? effectiveId}
                pathFromCandidate={childPath}
                selections={selections}
                styleTargets={styleTargets}
                hoveredId={hoveredId}
                onHover={onHover}
                onHoverEnd={onHoverEnd}
                onClickCandidate={onClickCandidate}
                onSetStyleTarget={onSetStyleTarget}
              />
            );
          })}
          <div className="py-[1px]" style={{ paddingLeft: depth * 14 + 2 + 16 }}>
            <span style={{ color: TAG_COLOR }}>&lt;/{node.tag}&gt;</span>
          </div>
        </>
      )}
    </div>
  );
}

export function SvgTreeInspector({
  svgString,
  selections,
  styleTargets,
  hoveredId,
  onHover,
  onHoverEnd,
  onClickCandidate,
  onSetStyleTarget,
}) {
  const tree = useMemo(() => {
    if (!svgString) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgRoot = doc.querySelector('svg');
    if (!svgRoot) return null;
    return buildTree(svgRoot);
  }, [svgString]);

  if (!tree) return null;

  return (
    <div
      className="font-mono text-[11px] leading-[1.6] select-none p-2"
      style={{ color: 'var(--c-text)' }}
    >
      <TreeNode
        node={tree}
        depth={0}
        parentCandidateId={null}
        pathFromCandidate={null}
        selections={selections}
        styleTargets={styleTargets}
        hoveredId={hoveredId}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
        onClickCandidate={onClickCandidate}
        onSetStyleTarget={onSetStyleTarget}
      />
    </div>
  );
}
