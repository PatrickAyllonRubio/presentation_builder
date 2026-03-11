/**
 * Procesa un archivo SVG
 * @param {File} file
 * @returns {Promise<object>} { content, metadata }
 */
export async function processSVG(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;

        // Validar XML bien formado
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');

        if (doc.getElementsByTagName('parsererror').length > 0) {
          throw new Error('SVG malformado - XML no válido');
        }

        // Contar elementos
        const elementCount = doc.querySelectorAll('*').length;

        // Buscar elementos clickeables
        const hasClickableElements =
          text.includes('id="p-') ||
          text.includes('class="items"') ||
          text.includes('id="');

        resolve({
          content: text, // SVG raw
          metadata: {
            isValid: true,
            elementCount,
            hasClickableElements,
            preview: 'SVG',
          },
        });
      } catch (err) {
        reject(new Error(`Error al procesar SVG: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer archivo SVG'));
    };

    reader.readAsText(file);
  });
}