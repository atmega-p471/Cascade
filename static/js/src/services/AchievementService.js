/**
 * @typedef {import('../repositories/IAchievementRepository.js').IAchievementRepository} IAchievementRepository
 * @typedef {import('../store/AppStore.js').AppStore} AppStore
 */

export class AchievementService {
  /**
   * @param {IAchievementRepository} achievementRepository
   * @param {AppStore} store
   */
  constructor(achievementRepository, store) {
    this._repo = achievementRepository;
    this._store = store;
  }

  /** Для админ-панели: достижения любого пользователя (без смены store). */
  async listByUserId(userId) {
    return this._repo.listByUserId(userId);
  }

  /** Загрузка достижений текущего пользователя в store. */
  async refreshForCurrentUser() {
    const u = this._store.currentUser;
    if (!u) {
      this._store.setState({ achievements: [] });
      return [];
    }
    const list = await this._repo.listByUserId(u.id);
    this._store.setState({ achievements: list });
    return list;
  }

  /** @param {import('../models/Achievement.js').Achievement} achievement */
  async add(achievement) {
    const u = this._store.currentUser;
    if (!u) throw new Error("Необходима авторизация");
    const created = await this._repo.create({ ...achievement, userId: u.id });
    await this.refreshForCurrentUser();
    return created;
  }

  /** @param {import('../models/Achievement.js').Achievement} achievement */
  async update(achievement) {
    const u = this._store.currentUser;
    if (!u) throw new Error("Необходима авторизация");
    const updated = await this._repo.update({ ...achievement, userId: u.id });
    await this.refreshForCurrentUser();
    return updated;
  }

  /** @param {string} id */
  async remove(id) {
    const u = this._store.currentUser;
    if (!u) throw new Error("Необходима авторизация");
    await this._repo.delete(id, u.id);
    await this.refreshForCurrentUser();
  }

  /** @param {File} file */
  recognizeCertificate(file) {
    return this._repo.recognizeCertificateFromFile(file);
  }

  /** @param {string} url */
  resolveArticleLevel(url) {
    return this._repo.resolveArticleLevel(url);
  }
}
