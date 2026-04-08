/**
 * Клиентская валидация форм (без сервера).
 */

export function required(value, message = "Обязательное поле") {
  const s = String(value ?? "").trim();
  if (!s) return message;
  return null;
}

export function email(value) {
  const s = String(value ?? "").trim();
  if (!s) return "Введите email";
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  return ok ? null : "Некорректный email";
}

/** Минимум 8 символов (для демо допускается пароль вида 12345678). */
export function password(value) {
  const s = String(value ?? "");
  if (s.length < 8) return "Пароль не короче 8 символов";
  return null;
}

export function studentId(value) {
  const s = String(value ?? "").trim();
  if (!/^\d{6}$/.test(s)) return "Студенческий билет: 6 цифр";
  return null;
}

export function matchPasswords(a, b) {
  if (a !== b) return "Пароли не совпадают";
  return null;
}

export function optionalUrl(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  try {
    new URL(s);
    return null;
  } catch {
    return "Введите корректную ссылку";
  }
}
