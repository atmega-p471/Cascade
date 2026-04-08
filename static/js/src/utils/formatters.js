/**
 * Форматирование для отображения в UI.
 */

/** @param {string | number | Date} v */
export function formatDateRu(v) {
  if (!v) return "—";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("ru-RU");
}

/** Баллы без валюты: «42 б.» */
export function formatPoints(n) {
  const v = Math.round(Number(n) || 0);
  return `${v} б.`;
}
