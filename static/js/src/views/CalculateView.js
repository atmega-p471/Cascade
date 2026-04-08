import { formatPoints } from "../utils/formatters.js";

export class CalculateView {
  /**
   * @param {import('../services/ScholarshipService.js').ScholarshipService} scholarshipService
   */
  constructor(scholarshipService) {
    this.scholarship = scholarshipService;
  }

  mount() {
    const out = document.getElementById("calc-result");
    if (!out) return;

    const run = async () => {
      out.innerHTML = '<p class="muted">Подсчёт баллов…</p>';
      try {
        const s = await this.scholarship.calculateForCurrentUser();
        out.innerHTML = `
          <div class="card calc-card calc-card--instant">
            <p class="calc-total">Итого баллов за <strong>${escapeHtml(s.periodLabel)}</strong></p>
            <p class="calc-points" aria-label="Всего баллов">${formatPoints(s.totalPoints)}</p>
            <ul class="calc-breakdown">
              ${s.breakdown.map((b) => `<li><span>${escapeHtml(b.label)}</span><span>${formatPoints(b.points)}</span></li>`).join("")}
            </ul>
            <p class="muted small">Разбивка по категориям. Баллы берутся из ваших достижений.</p>
          </div>`;
      } catch (e) {
        out.innerHTML = `<p class="form-error">${escapeHtml(e instanceof Error ? e.message : "Ошибка")}</p>`;
      }
    };

    run();
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
