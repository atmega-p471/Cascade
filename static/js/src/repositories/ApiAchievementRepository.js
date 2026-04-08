/**
 * Заготовка репозитория достижений для API (OCR и уровень статьи — эндпоинты сервера).
 */
import { API_BASE_URL } from "../config.js";
import { IAchievementRepository } from "./IAchievementRepository.js";

export class ApiAchievementRepository extends IAchievementRepository {
  constructor() {
    super();
    this._base = API_BASE_URL;
  }

  async listByUserId() {
    void this._base;
    throw new Error("ApiAchievementRepository.listByUserId: подключите бэкенд");
  }

  async create() {
    throw new Error("ApiAchievementRepository.create: подключите бэкенд");
  }

  async update() {
    throw new Error("ApiAchievementRepository.update: подключите бэкенд");
  }

  async delete() {
    throw new Error("ApiAchievementRepository.delete: подключите бэкенд");
  }

  async recognizeCertificateFromFile() {
    throw new Error("ApiAchievementRepository.recognizeCertificateFromFile: подключите бэкенд");
  }

  async resolveArticleLevel() {
    throw new Error("ApiAchievementRepository.resolveArticleLevel: подключите бэкенд");
  }
}
