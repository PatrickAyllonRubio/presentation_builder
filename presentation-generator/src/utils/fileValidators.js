import { VALID_MIME_TYPES, MAX_FILE_SIZES } from '../types/mimetypes.js';

/**
 * Detecta el tipo de archivo basado en MIME type
 * @param {File} file
 * @returns {string | null} tipo: 'svg', 'image', 'video' o null
 */
export function detectFileType(file) {
  for (const [type, mimes] of Object.entries(VALID_MIME_TYPES)) {
    if (mimes.includes(file.type)) {
      return type;
    }
  }
  return null;
}

/**
 * Valida un archivo contra su tipo
 * @param {File} file
 * @param {string} type - 'svg', 'image', 'video'
 * @returns {object} { isValid, errors }
 */
export function validateFile(file, type) {
  const errors = [];

  // Validar MIME type
  if (!VALID_MIME_TYPES[type]?.includes(file.type)) {
    errors.push(`Tipo MIME inválido: ${file.type || 'desconocido'}`);
  }

  // Validar tamaño
  const maxSize = MAX_FILE_SIZES[type];
  if (file.size > maxSize) {
    const maxMB = (maxSize / 1024 / 1024).toFixed(0);
    errors.push(`Archivo muy grande (máx: ${maxMB}MB, actual: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
  }

  // Validar que no esté vacío
  if (file.size === 0) {
    errors.push('El archivo está vacío');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida múltiples archivos
 * @param {FileList} files
 * @returns {array} array de { file, type, validation }
 */
export function validateMultipleFiles(files) {
  const results = [];

  for (const file of files) {
    const type = detectFileType(file);

    if (!type) {
      results.push({
        file,
        type: null,
        validation: {
          isValid: false,
          errors: ['Tipo de archivo no soportado'],
        },
      });
      continue;
    }

    const validation = validateFile(file, type);

    results.push({
      file,
      type,
      validation,
    });
  }

  return results;
}