/**
 * Переключение между мок-репозиториями и будущими API-реализациями.
 * Для бэкенда: установить USE_MOCK = false и подключить Api*Repository в main.js.
 */
export const USE_MOCK = true;

export const STORAGE_KEYS = {
  USERS: "scholarship_mock_users",
  ACHIEVEMENTS: "scholarship_mock_achievements",
  SESSION: "scholarship_session_user_id",
};

/** Базовый URL будущего API (заглушка для репозиториев на fetch). */
export const API_BASE_URL = "/api/v1";
