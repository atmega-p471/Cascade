import { STORAGE_KEYS } from "../config.js";

/**
 * Глобальное состояние SPA-страниц: текущий пользователь, его достижения.
 * Подписчики получают уведомления при изменении (для обновления UI).
 */
export class AppStore {
  constructor() {
    /** @type {string | null} */
    this._sessionUserId = null;
    /** @type {import('../models/User.js').User | null} */
    this.currentUser = null;
    /** @type {import('../models/Achievement.js').Achievement[]} */
    this.achievements = [];
    /** @type {Set<() => void>} */
    this._listeners = new Set();
    this._hydrateSession();
  }

  _hydrateSession() {
    try {
      const id = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (id) this._sessionUserId = id;
    } catch {
      /* ignore */
    }
  }

  /** @param {string | null} userId */
  setSessionUserId(userId) {
    this._sessionUserId = userId;
    try {
      if (userId) localStorage.setItem(STORAGE_KEYS.SESSION, userId);
      else localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {
      /* ignore */
    }
  }

  /** @returns {string | null} */
  getSessionUserId() {
    return this._sessionUserId || null;
  }

  /** @param {() => void} fn */
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _notify() {
    this._listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * @param {object} patch
   * @param {import('../models/User.js').User | null} [patch.currentUser]
   * @param {import('../models/Achievement.js').Achievement[]} [patch.achievements]
   */
  setState(patch) {
    if ("currentUser" in patch) this.currentUser = patch.currentUser;
    if ("achievements" in patch) this.achievements = patch.achievements;
    this._notify();
  }
}
