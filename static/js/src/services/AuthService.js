/**
 * Авторизация и регистрация через IUserRepository; синхронизация с AppStore.
 * @typedef {import('../repositories/IUserRepository.js').IUserRepository} IUserRepository
 * @typedef {import('../store/AppStore.js').AppStore} AppStore
 */

export class AuthService {
  /**
   * @param {IUserRepository} userRepository
   * @param {AppStore} store
   */
  constructor(userRepository, store) {
    this._users = userRepository;
    this._store = store;
  }

  /** Восстановление сессии после перезагрузки страницы. */
  async restoreSession() {
    const id = this._store.getSessionUserId();
    if (!id) {
      this._store.setState({ currentUser: null, achievements: [] });
      return null;
    }
    const user = await this._users.getById(id);
    if (!user) {
      this._store.setSessionUserId(null);
      this._store.setState({ currentUser: null, achievements: [] });
      return null;
    }
    this._store.setState({ currentUser: user });
    return user;
  }

  /** @param {string} email @param {string} password */
  async login(email, password) {
    const user = await this._users.verifyCredentials(email, password);
    if (!user) throw new Error("Неверный email или пароль");
    this._store.setSessionUserId(user.id);
    this._store.setState({ currentUser: user });
    return user;
  }

  logout() {
    this._store.setSessionUserId(null);
    this._store.setState({ currentUser: null, achievements: [] });
  }

  /**
   * @param {object} data
   * @param {string} data.email
   * @param {string} data.password
   * @param {string} data.studentId
   * @param {string} data.fullName
   * @param {string} [data.group]
   * @param {string} [data.phone]
   */
  async register(data) {
    const existing = await this._users.getByEmail(data.email);
    if (existing) throw new Error("Пользователь с таким email уже существует");
    const user = await this._users.create({
      email: data.email,
      password: data.password,
      studentId: data.studentId,
      fullName: data.fullName,
      group: data.group,
      phone: data.phone,
    });
    this._store.setSessionUserId(user.id);
    this._store.setState({ currentUser: user });
    return user;
  }

  /** @param {import('../models/User.js').User} user */
  async updateProfile(user) {
    const updated = await this._users.update(user);
    this._store.setState({ currentUser: updated });
    return updated;
  }

  /** Список пользователей для админ-панели (мок / будущий API). */
  async listAllUsers() {
    return this._users.listAll();
  }
}
