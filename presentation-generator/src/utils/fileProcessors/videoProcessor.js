/**
 * Procesa un archivo de video
 * @param {File} file
 * @returns {Promise<object>} { content, metadata }
 */
export async function processVideo(file) {
  return new Promise((resolve, reject) => {
    const videoURL = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      try {
        // Crear thumbnail del primer frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

        resolve({
          content: videoURL, // Object URL (no base64 para no consumir mucha memoria)
          metadata: {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            requiresObjectURL: true, // flag para cleanup
            preview: thumbnail, // miniatura para mostrar
          },
        });
      } catch (err) {
        resolve({
          content: videoURL,
          metadata: {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            requiresObjectURL: true,
            preview: 'VIDEO', // texto si no se puede generar thumbnail
          },
        });
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoURL);
      reject(new Error('No se puede procesar el video'));
    };

    video.onabort = () => {
      URL.revokeObjectURL(videoURL);
      reject(new Error('Carga de video cancelada'));
    };

    video.src = videoURL;

    // Timeout por si el video tarda mucho
    setTimeout(() => {
      if (video.readyState < 1) {
        URL.revokeObjectURL(videoURL);
        reject(new Error('Timeout al procesar el video'));
      }
    }, 10000);
  });
}