import { STORAGE_KEYS } from "../config.js";
import { Achievement } from "../models/Achievement.js";
import { IAchievementRepository } from "./IAchievementRepository.js";

function uid() {
  return `ach-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** @returns {Achievement[]} */
function readList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return arr.map((o) => new Achievement(o));
  } catch {
    return [];
  }
}

function writeList(list) {
  localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(list.map((a) => ({ ...a }))));
}

const MOCK_LEVELS = ["ВАК", "Scopus / WoS", "РИНЦ", "Региональный", "Внутривузовский"];

/**
 * Начальные достижения для сид-студентов (после первого запуска).
 */
export class MockAchievementRepository extends IAchievementRepository {
  constructor() {
    super();
    this._ensureSeedAchievements();
  }

  _ensureSeedAchievements() {
    const existing = readList();
    if (existing.length > 0) return;

    let seed;
    try {
      seed = JSON.parse(localStorage.getItem("scholarship_seed_users") || "{}");
    } catch {
      seed = {};
    }

    const s1 = seed.s1;
    const s2 = seed.s2;
    if (!s1 || !s2) return;

    const initial = [
      new Achievement({
        id: uid(),
        userId: s1,
        kind: "certificate",
        title: "Диплом победителя олимпиады «Я — профессионал»",
        description: "Направление: информатика",
        level: "Федеральный",
        issueDate: "2024-05-10",
        points: 35,
      }),
      new Achievement({
        id: uid(),
        userId: s1,
        kind: "article",
        title: "Методы оптимизации в задачах машинного обучения",
        articleUrl: "https://example.org/journal/article-1",
        level: "ВАК",
        issueDate: "2024-09-01",
        points: 40,
      }),
      new Achievement({
        id: uid(),
        userId: s2,
        kind: "competition",
        title: "Хакатон «Цифровой прорыв», призёр",
        level: "Региональный",
        issueDate: "2024-11-20",
        points: 25,
      }),
    ];
    writeList(initial);
  }

  /** @param {string} userId */
  async listByUserId(userId) {
    return readList().filter((a) => a.userId === userId);
  }

  /** @param {Achievement} a */
  async create(a) {
    const list = readList();
    const next = new Achievement({ ...a, id: a.id || uid() });
    list.push(next);
    writeList(list);
    return next;
  }

  /** @param {Achievement} a */
  async update(a) {
    const list = readList();
    const i = list.findIndex((x) => x.id === a.id);
    if (i === -1) throw new Error("Достижение не найдено");
    list[i] = new Achievement({ ...a });
    writeList(list);
    return list[i];
  }

  /** @param {string} id @param {string} userId */
  async delete(id, userId) {
    const list = readList();
    const next = list.filter((x) => !(x.id === id && x.userId === userId));
    writeList(next);
  }

  /**
   * Имитация OCR: задержка и случайный набор тестовых полей.
   * @param {File} file
   */
  async recognizeCertificateFromFile(file) {
    const name = file?.name || "document.pdf";
    return new Promise((resolve) => {
      setTimeout(() => {
        const idx = Math.floor(Math.random() * MOCK_LEVELS.length);
        resolve({
          title: `Грамота «${name.replace(/\.[^.]+$/, "")}» (мок)`,
          issueDate: new Date().toISOString().slice(0, 10),
          level: MOCK_LEVELS[idx],
          description: "Автозаполнение тестовыми данными (распознавание имитируется).",
        });
      }, 600 + Math.random() * 400);
    });
  }

  /**
   * По URL выбираем уровень из предопределённого списка (детерминированный хеш URL).
   * @param {string} url
   */
  async resolveArticleLevel(url) {
    const u = (url || "").trim();
    if (!u) return "";
    let h = 0;
    for (let i = 0; i < u.length; i += 1) h = (h * 31 + u.charCodeAt(i)) >>> 0;
    const pick = MOCK_LEVELS[h % MOCK_LEVELS.length];
    return new Promise((resolve) => {
      setTimeout(() => resolve(pick), 250);
    });
  }
}
