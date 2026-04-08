/**
 * @typedef {import('../models/Achievement.js').Achievement} Achievement
 */

/**
 * Результат мок-распознавания грамоты (OCR).
 * @typedef {object} CertificateRecognitionResult
 * @property {string} title
 * @property {string} issueDate
 * @property {string} level
 * @property {string} [description]
 */

/**
 * @interface IAchievementRepository
 */
export class IAchievementRepository {
  /** @param {string} _userId @returns {Promise<Achievement[]>} */
  async listByUserId() {
    throw new Error("IAchievementRepository.listByUserId not implemented");
  }

  /** @param {Achievement} _a */
  async create() {
    throw new Error("IAchievementRepository.create not implemented");
  }

  /** @param {Achievement} _a */
  async update() {
    throw new Error("IAchievementRepository.update not implemented");
  }

  /** @param {string} _id @param {string} _userId */
  async delete() {
    throw new Error("IAchievementRepository.delete not implemented");
  }

  /**
   * Имитация OCR: задержка и случайные тестовые поля.
   * @param {File} _file
   * @returns {Promise<CertificateRecognitionResult>}
   */
  async recognizeCertificateFromFile() {
    throw new Error("IAchievementRepository.recognizeCertificateFromFile not implemented");
  }

  /**
   * Имитация определения уровня публикации по URL.
   * @param {string} _url
   * @returns {Promise<string>}
   */
  async resolveArticleLevel() {
    throw new Error("IAchievementRepository.resolveArticleLevel not implemented");
  }
}
