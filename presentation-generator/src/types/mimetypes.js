export const VALID_MIME_TYPES = {
  svg: ['image/svg+xml'],
  image: ['image/png', 'image/jpeg', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
};

export const FILE_EXTENSIONS = {
  svg: ['.svg'],
  image: ['.png', '.jpg', '.jpeg', '.webp'],
  video: ['.mp4', '.webm'],
};

export const MAX_FILE_SIZES = {
  svg: 5 * 1024 * 1024, // 5MB
  image: 20 * 1024 * 1024, // 20MB
  video: 500 * 1024 * 1024, // 500MB
};

export const FILE_CATEGORIES = {
  svg: 'SVG',
  image: 'Imagen',
  video: 'Video',
};

export const ACCEPTED_FILES_STRING = 'SVG, PNG, JPG, JPEG, WebP, MP4, WebM';