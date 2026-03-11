/**
 * Procesa un archivo de imagen
 * @param {File} file
 * @returns {Promise<object>} { content, metadata }
 */
export async function processImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          content: e.target.result, // base64
          metadata: {
            width: img.width,
            height: img.height,
            aspectRatio: (img.width / img.height).toFixed(2),
            preview: e.target.result, // base64 para mostrar miniatura
          },
        });
      };

      img.onerror = () => {
        reject(new Error('No se puede procesar la imagen - formato inválido'));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Error al leer archivo de imagen'));
    };

    reader.readAsDataURL(file);
  });
}