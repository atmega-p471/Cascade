/**
 * Чтение файла как Data URL для предпросмотра изображений/PDF (мок).
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * @param {string} dataUrl
 * @returns {boolean}
 */
export function isImageDataUrl(dataUrl) {
  return /^data:image\//i.test(dataUrl);
}
