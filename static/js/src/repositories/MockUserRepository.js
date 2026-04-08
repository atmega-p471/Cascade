import { STORAGE_KEYS } from "../config.js";
import { User } from "../models/User.js";
import { IUserRepository } from "./IUserRepository.js";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** @returns {Record<string, { user: User, password: string }>} */
function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeStore(map) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(map));
}

function toUser(obj) {
  return new User(obj);
}

/** @param {User} u */
function serializeUser(u) {
  return {
    id: u.id,
    email: u.email,
    studentId: u.studentId,
    fullName: u.fullName,
    role: u.role,
    group: u.group,
    phone: u.phone,
  };
}

/**
 * Мок-хранилище пользователей в localStorage.
 * Пароль хранится только для демонстрации (не для продакшена).
 */
export class MockUserRepository extends IUserRepository {
  constructor() {
    super();
    this._ensureSeed();
  }

  _ensureSeed() {
    const store = readStore();
    if (Object.keys(store).length > 0) return;

    const admin = new User({
      id: uid(),
      email: "admin@admin.com",
      studentId: "000000",
      fullName: "Администратор Системы",
      role: "admin",
      group: "Админ",
      phone: "",
    });

    const s1 = new User({
      id: uid(),
      email: "ivan.petrov@student.ru",
      studentId: "123456",
      fullName: "Петров Иван Сергеевич",
      role: "student",
      group: "ИВТ-21",
      phone: "+7 900 111-22-33",
    });

    const s2 = new User({
      id: uid(),
      email: "maria.sidorova@student.ru",
      studentId: "654321",
      fullName: "Сидорова Мария Алексеевна",
      role: "student",
      group: "ПИ-22",
      phone: "+7 900 444-55-66",
    });

    const initial = {
      [admin.id]: { user: serializeUser(admin), password: "12345678" },
      [s1.id]: { user: serializeUser(s1), password: "12345678" },
      [s2.id]: { user: serializeUser(s2), password: "12345678" },
    };
    writeStore(initial);

    // Сохраняем достижения для студентов — инициализируются в MockAchievementRepository
    localStorage.setItem("scholarship_seed_users", JSON.stringify({ adminId: admin.id, s1: s1.id, s2: s2.id }));
  }

  /** @param {string} id */
  async getById(id) {
    const store = readStore();
    const row = store[id];
    return row ? toUser(row.user) : null;
  }

  /** @param {string} email */
  async getByEmail(email) {
    const store = readStore();
    const norm = email.trim().toLowerCase();
    for (const row of Object.values(store)) {
      if (String(row.user.email).toLowerCase() === norm) return toUser(row.user);
    }
    return null;
  }

  async listAll() {
    const store = readStore();
    return Object.values(store).map((r) => toUser(r.user));
  }

  /**
   * @param {Omit<import('../models/User.js').User, 'id'> & { password: string }} data
   */
  async create(data) {
    const store = readStore();
    const id = uid();
    const user = new User({
      id,
      email: data.email,
      studentId: data.studentId,
      fullName: data.fullName,
      role: "student",
      group: data.group || "",
      phone: data.phone || "",
    });
    store[id] = { user: serializeUser(user), password: data.password };
    writeStore(store);
    return user;
  }

  /** @param {User} user */
  async update(user) {
    const store = readStore();
    const row = store[user.id];
    if (!row) throw new Error("Пользователь не найден");
    store[user.id] = { ...row, user: serializeUser(user) };
    writeStore(store);
    return toUser(store[user.id].user);
  }

  /** @param {string} email @param {string} password */
  async verifyCredentials(email, password) {
    const store = readStore();
    const norm = email.trim().toLowerCase();
    for (const row of Object.values(store)) {
      if (String(row.user.email).toLowerCase() === norm && row.password === password) {
        return toUser(row.user);
      }
    }
    return null;
  }
}
