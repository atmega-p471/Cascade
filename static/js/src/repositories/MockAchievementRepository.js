import { STORAGE_KEYS } from "../config.js";
import { Achievement } from "../models/Achievement.js";
<<<<<<< HEAD
import {
  CERTIFICATE_LEVEL_VALUES,
  CERTIFICATE_PLACE_VALUES,
  calculateCertificatePoints,
} from "../utils/achievementRules.js";
=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
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
<<<<<<< HEAD
        level: "Всеросийский",
        place: "Победитель",
        issueDate: "2024-05-10",
        points: calculateCertificatePoints("Всеросийский", "Победитель"),
=======
        level: "Федеральный",
        issueDate: "2024-05-10",
        points: 35,
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
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
<<<<<<< HEAD
    const payload = this._normalizeCertificate({ ...a });
    const next = new Achievement({ ...payload, id: payload.id || uid() });
=======
    const next = new Achievement({ ...a, id: a.id || uid() });
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
    list.push(next);
    writeList(list);
    return next;
  }

  /** @param {Achievement} a */
  async update(a) {
    const list = readList();
    const i = list.findIndex((x) => x.id === a.id);
    if (i === -1) throw new Error("Достижение не найдено");
<<<<<<< HEAD
    list[i] = new Achievement(this._normalizeCertificate({ ...a }));
=======
    list[i] = new Achievement({ ...a });
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
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
<<<<<<< HEAD
   * OCR на клиенте: распознавание текста из изображения/скана грамоты.
   * @param {File} file
   */
  async recognizeCertificateFromFile(file) {
    const name = file?.name || "document";
    const recognizedText = await runOcr(file);
    const title = detectTitle(recognizedText, name);
    const issueDate = detectDate(recognizedText);
    const level = detectLevel(recognizedText);
    const place = detectPlace(recognizedText);
    return {
      title,
      issueDate,
      level,
      place,
      description: "",
    };
=======
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
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
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
<<<<<<< HEAD

  _normalizeCertificate(a) {
    if (a.kind !== "certificate") return a;
    if (CERTIFICATE_LEVEL_VALUES.includes(a.level) && CERTIFICATE_PLACE_VALUES.includes(a.place)) {
      return { ...a, points: calculateCertificatePoints(a.level, a.place) };
    }
    return a;
  }
}

async function runOcr(file) {
  if (!file) return "";
  try {
    const mod = await import("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js");
    const Tesseract = mod.default || mod;
    const result = await Tesseract.recognize(file, "rus+eng");
    return String(result?.data?.text || "")
      .replace(/\r/g, "")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return "";
  }
}

function detectTitle(text, fileName) {
  if (!text) return `Грамота «${String(fileName).replace(/\.[^.]+$/, "")}»`;
  const lines = text
    .split(/\r?\n/)
    .map((p) => cleanupTitle(p))
    .filter(Boolean);
  const explicitTitle = extractLabeledValue(text, ["название"]);
  if (explicitTitle && explicitTitle.length > 3) return limitTitle(cleanupTitle(explicitTitle));
  const awardLine = lines.find((line) => /(почетн.{0,3}\s+грамот|грамот|диплом|сертификат)/i.test(line));
  if (awardLine) return limitTitle(cleanupTitle(awardLine));
  const parts = text
    .split(/[.!?\n]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const firstMeaningful = parts.find((p) => p.length > 12 && !/(уровень|место|дата|награждается)/i.test(p));
  return limitTitle(cleanupTitle(firstMeaningful || `Грамота «${String(fileName).replace(/\.[^.]+$/, "")}»`));
}

function detectDate(text) {
  const s = String(text || "");
  const labeled = extractLabeledValue(s, ["дата", "выдан"]);
  if (labeled) {
    const parsed = parseDate(labeled);
    if (parsed) return parsed;
  }
  return parseDate(s) || new Date().toISOString().slice(0, 10);
}

function detectLevel(text) {
  const labeled = extractLabeledValue(text, ["уровень"]);
  if (!labeled) return "Региональный";
  const mapped = mapLevelByValue(labeled);
  return mapped;
}

function mapLevelByValue(value) {
  const s = normalizeLetters(value);
  if (/(международ)/i.test(s)) return "Международный";
  if (/(всерос|всеросс|федерал)/i.test(s)) return "Всеросийский";
  if (/(ведомств)/i.test(s)) return "Ведомственный";
  if (/(регион)/i.test(s)) return "Региональный";
  if (!String(value || "").trim()) return "Региональный";
  return "";
}

function detectPlace(text) {
  const labeled = extractLabeledValue(text, ["место", "результат", "статус"]);
  if (!labeled) {
    const byWholeText = mapPlaceByValue(text);
    return byWholeText || "Участник";
  }
  return mapPlaceByValue(labeled);
}

function mapPlaceByValue(value) {
  const s = normalizePlace(value);
  if (/(победител|(^|[^0-9])1\s*место|(^|[^0-9])i\s*место|первое место)/i.test(s)) return "Победитель";
  if (/(призер|призёр|(^|[^0-9])[23]\s*место|(^|[^0-9])(ii|iii)\s*место|второе место|третье место)/i.test(s))
    return "Призёр";
  if (/(участник|сертификат участника)/i.test(s)) return "Участник";
  return "Участник";
}

function extractLabeledValue(text, labels) {
  const lines = String(text || "")
    .split(/\r?\n|[.;]/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines) {
    const normalized = normalizeLetters(line);
    for (const label of labels) {
      const ln = normalizeLetters(label);
      if (!normalized.includes(ln)) continue;
      const idx = normalized.indexOf(ln);
      const rawTail = line.slice(idx + label.length);
      const candidate = rawTail.replace(/^(\s*[:\-]\s*|\s+)/, "").trim();
      if (candidate) return candidate;
    }
  }
  return "";
}

function parseDate(value) {
  const s = String(value || "");
  const m = s.match(/\b(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})\b/);
  if (!m) return "";
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  const year = m[3];
  return `${year}-${month}-${day}`;
}

function cleanupTitle(value) {
  return String(value || "")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[^\p{L}\p{N}«"]+/u, "")
    .trim();
}

function limitTitle(value) {
  const t = String(value || "").trim();
  if (t.length <= 90) return t;
  return `${t.slice(0, 87).trimEnd()}...`;
}

function normalizeLetters(value) {
  return String(value || "")
    .replace(/[eE]/g, "е")
    .replace(/3/g, "з")
    .replace(/0/g, "о")
    .toLowerCase();
}

function normalizePlace(value) {
  return normalizeLetters(value)
    .replace(/[|]/g, "i")
    .replace(/\bl\b/g, "i")
    .replace(/i{2,}/g, "ii");
=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
}
