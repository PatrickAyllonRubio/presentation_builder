/**
 * Analiza los SVGs editados y genera reglas CSS dinámicas
 * para que los bordes de interactividad (.selected) apunten
 * al tag correcto de cada elemento seleccionado.
 */

// Tags SVG que pueden recibir stroke
const STROKEABLE = new Set([
  'circle', 'ellipse', 'rect', 'path', 'line', 'polygon', 'polyline',
]);

// Tags no visibles / de definición
const IGNORED = new Set([
  'defs', 'style', 'metadata', 'title', 'desc', 'clippath', 'mask',
  'lineargradient', 'radialgradient', 'pattern', 'filter', 'symbol', 'use',
]);

/**
 * Dado un elemento SVG seleccionado, genera el selector CSS
 * correcto para aplicar el borde activo.
 * @param {Element} el - Elemento SVG con class="items" o "sub_items items"
 * @returns {string|null} Selector CSS relativo al ID (ej: "> path", "> g > circle", "")
 */
function getStrokeSelector(el) {
  const tag = el.tagName.toLowerCase();

  // Si el elemento mismo es strokeable (path, circle, etc.)
  if (STROKEABLE.has(tag)) {
    return '';
  }

  // Si es un grupo, buscar el primer hijo strokeable visible
  if (tag === 'g') {
    for (const child of el.children) {
      const childTag = child.tagName.toLowerCase();
      if (IGNORED.has(childTag)) continue;

      if (STROKEABLE.has(childTag)) {
        return `> ${childTag}`;
      }

      // Si el hijo es otro grupo, buscar un nivel más
      if (childTag === 'g') {
        for (const grandchild of child.children) {
          const gcTag = grandchild.tagName.toLowerCase();
          if (STROKEABLE.has(gcTag)) {
            return `> g > ${gcTag}`;
          }
        }
        // Si no encontramos en el nieto, estilizar el grupo hijo
        return '> g:first-child';
      }
    }
  }

  return null;
}

/**
 * Analiza un SVG editado y genera reglas CSS para los elementos seleccionados.
 * @param {string} svgString - Contenido SVG con data-editor-id, id y class aplicados
 * @param {string[]} selections - Lista de data-editor-id seleccionados
 * @param {function} getElementId - Función (idx) => id del elemento (ej: "p-1", "1-1")
 * @param {object} styleTargets - Mapa editorId → selector CSS específico elegido por el usuario
 * @returns {string[]} Array de reglas CSS
 */
function generateRulesForSvg(svgString, selections, getElementId, styleTargets) {
  if (!svgString || !selections.length) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const rules = [];

  const allElements = doc.querySelectorAll('[data-editor-id]');
  allElements.forEach((el) => {
    const editorId = el.getAttribute('data-editor-id');
    const selIdx = selections.indexOf(editorId);
    if (selIdx === -1) return;

    const id = getElementId(selIdx);

    // Prioridad: selector del usuario > auto-detección
    const userSelector = styleTargets?.[editorId];
    const selector = userSelector ?? getStrokeSelector(el);
    if (selector === null) return;

    if (selector === '') {
      rules.push(`#${id}.selected {\n    stroke: var(--borderActive);\n    stroke-width: 4;\n}`);
    } else {
      rules.push(`#${id}.selected ${selector} {\n    stroke: var(--borderActive);\n    stroke-width: 4;\n}`);
    }
  });

  return rules;
}

/**
 * Genera todas las reglas CSS dinámicas para la presentación.
 * Analiza el SVG principal y los SVGs secundarios.
 * @param {object} guionState - Estado del guionStore
 * @returns {string} Bloque CSS completo
 */
export function generateInteractiveStyles(guionState) {
  const { svgContent, svgSelections, svgStyleTargets, items } = guionState;
  const allRules = [];

  // SVG principal: IDs p-1, p-2, ...
  if (svgContent && svgSelections?.length) {
    const rules = generateRulesForSvg(
      svgContent,
      svgSelections,
      (idx) => `p-${idx + 1}`,
      svgStyleTargets
    );
    if (rules.length) {
      allRules.push('/* SVG Principal */');
      allRules.push(...rules);
    }
  }

  // SVGs secundarios: IDs {itemId}-1, {itemId}-2, ...
  items.forEach((item) => {
    if (item.tipo !== 'svgAudio' || !item._svgContent || !item._svgSelections?.length) return;

    const rules = generateRulesForSvg(
      item._svgContent,
      item._svgSelections,
      (idx) => `${item.id}-${idx + 1}`,
      item._svgStyleTargets
    );
    if (rules.length) {
      allRules.push(`\n/* SVG Secundario - Item #${item.id} */`);
      allRules.push(...rules);
    }
  });

  return allRules.join('\n\n');
}
