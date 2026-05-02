/**
 * Доменная модель пользователя (фронтенд).
 * @typedef {'admin' | 'student'} UserRole
 */
export class User {
  /**
   * @param {object} data
   * @param {string} data.id
   * @param {string} data.email
   * @param {string} data.studentId
   * @param {string} data.fullName
   * @param {UserRole} data.role
   * @param {string} [data.group]
   * @param {string} [data.phone]
   */
  constructor({ id, email, studentId, fullName, role, group = "", phone = "" }) {
    this.id = id;
    this.email = email;
    this.studentId = studentId;
    this.fullName = fullName;
    this.role = role;
    this.group = group;
    this.phone = phone;
  }

  /** @returns {boolean} */
  isAdmin() {
    return this.role === "admin";
  }
}
