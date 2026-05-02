import { Scholarship } from "../models/Scholarship.js";
<<<<<<< HEAD
import {
  CERTIFICATE_LEVEL_VALUES,
  CERTIFICATE_PLACE_VALUES,
  calculateCertificatePoints,
} from "../utils/achievementRules.js";
=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d

/**
 * Агрегация баллов по достижениям (мок на фронте).
 * При подключении API расчёт можно перенести на сервер.
 */
export class ScholarshipService {
  /**
   * @param {import('./AchievementService.js').AchievementService} achievementService
   * @param {import('../store/AppStore.js').AppStore} store
   */
  constructor(achievementService, store) {
    this._achievements = achievementService;
    this._store = store;
  }

  /**
   * Сумма баллов и разбивка по типам достижений.
   * @returns {Promise<import('../models/Scholarship.js').Scholarship>}
   */
  async calculateForCurrentUser() {
    await this._achievements.refreshForCurrentUser();
    const list = this._store.achievements;
    const byKind = { certificate: 0, article: 0, competition: 0 };
    let totalPoints = 0;
    for (const a of list) {
<<<<<<< HEAD
      const p = this._resolvePoints(a);
=======
      const p = Number(a.points) || 0;
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
      totalPoints += p;
      if (a.kind in byKind) byKind[a.kind] += p;
    }

    const periodLabel = "1 семестр 2025/2026";

    if (totalPoints === 0) {
      return new Scholarship({
        totalPoints: 0,
        breakdown: [{ label: "Нет начисленных баллов за достижения", points: 0 }],
        periodLabel,
      });
    }

    const breakdown = [
      { label: "Грамоты и дипломы", points: byKind.certificate },
      { label: "Публикации", points: byKind.article },
      { label: "Конкурсы и проекты", points: byKind.competition },
    ];

    return new Scholarship({
      totalPoints,
      breakdown,
      periodLabel,
    });
  }
<<<<<<< HEAD

  _resolvePoints(a) {
    if (
      a.kind === "certificate" &&
      CERTIFICATE_LEVEL_VALUES.includes(a.level) &&
      CERTIFICATE_PLACE_VALUES.includes(a.place)
    ) {
      return calculateCertificatePoints(a.level, a.place);
    }
    return Number(a.points) || 0;
  }
=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
}
