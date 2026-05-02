/**
 * Заготовка репозитория для реального API.
 * Реализуйте методы через fetch(`${API_BASE_URL}/users/...`) и приведите ответы к модели User.
 */
import { API_BASE_URL } from "../config.js";
import { IUserRepository } from "./IUserRepository.js";

export class ApiUserRepository extends IUserRepository {
  constructor() {
    super();
    this._base = API_BASE_URL;
  }

  async getById() {
    void this._base;
    throw new Error("ApiUserRepository.getById: подключите бэкенд");
  }

  async getByEmail() {
    throw new Error("ApiUserRepository.getByEmail: подключите бэкенд");
  }

  async listAll() {
    throw new Error("ApiUserRepository.listAll: подключите бэкенд");
  }

  async create() {
    throw new Error("ApiUserRepository.create: подключите бэкенд");
  }

  async update() {
    throw new Error("ApiUserRepository.update: подключите бэкенд");
  }

  async verifyCredentials() {
    throw new Error("ApiUserRepository.verifyCredentials: подключите бэкенд");
  }
}
