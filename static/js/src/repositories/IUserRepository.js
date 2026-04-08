/**
 * Контракт доступа к пользователям (для смены Mock → API).
 * @typedef {import('../models/User.js').User} User
 */

/**
 * @interface IUserRepository
 */
export class IUserRepository {
  /** @returns {Promise<User|null>} */
  async getById() {
    throw new Error("IUserRepository.getById not implemented");
  }

  /** @returns {Promise<User|null>} */
  async getByEmail() {
    throw new Error("IUserRepository.getByEmail not implemented");
  }

  /** @returns {Promise<User[]>} */
  async listAll() {
    throw new Error("IUserRepository.listAll not implemented");
  }

  /** @param {Omit<User, 'id'> & { password: string }} _user */
  async create() {
    throw new Error("IUserRepository.create not implemented");
  }

  /** @param {User} _user */
  async update() {
    throw new Error("IUserRepository.update not implemented");
  }

  /** @param {string} _email @param {string} _password */
  async verifyCredentials() {
    throw new Error("IUserRepository.verifyCredentials not implemented");
  }
}
