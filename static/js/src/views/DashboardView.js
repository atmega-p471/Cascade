import { formatDateRu, formatPoints } from "../utils/formatters.js";
<<<<<<< HEAD
import {
  CERTIFICATE_LEVEL_VALUES,
  CERTIFICATE_PLACE_VALUES,
  calculateCertificatePoints,
} from "../utils/achievementRules.js";
=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
import { ProfileView } from "./ProfileView.js";

export class DashboardView {
  /**
   * @param {import('../services/AchievementService.js').AchievementService} achievementService
   * @param {import('../store/AppStore.js').AppStore} store
   * @param {import('../services/AuthService.js').AuthService} authService
   */
  constructor(achievementService, store, authService) {
    this.achievements = achievementService;
    this.store = store;
    this.auth = authService;
  }

  async mount() {
    const root = document.getElementById("dashboard-achievements");
    if (!root) return;

    new ProfileView(this.auth, this.store).mount();
    await this.achievements.refreshForCurrentUser();

    const renderUser = () => {
      const u = this.store.currentUser;
      const set = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
      };
      if (!u) return;
      set("dash-fullname", u.fullName);
      set("dash-email", u.email);
      set("dash-student-id", u.studentId);
      set("dash-role", u.role === "admin" ? "Администратор" : "Студент");
      set("dash-group", u.group || "—");
      set("dash-phone", u.phone || "—");
<<<<<<< HEAD
      const sum = this.store.achievements.reduce((s, a) => s + resolveAchievementPoints(a), 0);
=======
      const sum = this.store.achievements.reduce((s, a) => s + (Number(a.points) || 0), 0);
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
      set("dash-points-sum", formatPoints(sum));
    };

    const render = () => {
      renderUser();
      const list = this.store.achievements;
      if (!list.length) {
        root.innerHTML = '<p class="muted">Пока нет достижений. <a href="/achievements/add/">Добавить первое</a></p>';
        return;
      }
      root.innerHTML = list
        .map(
          (a) => `
        <article class="card achievement-card">
          <header class="achievement-card__head">
            <span class="badge">${this._kindLabel(a.kind)}</span>
            <span class="muted">${formatDateRu(a.issueDate)}</span>
          </header>
          <h3 class="achievement-card__title">${escapeHtml(a.title)}</h3>
          ${a.level ? `<p class="achievement-card__meta">Уровень: ${escapeHtml(a.level)}</p>` : ""}
<<<<<<< HEAD
          ${a.place ? `<p class="achievement-card__meta">Место: ${escapeHtml(a.place)}</p>` : ""}
=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
          ${a.articleUrl ? `<p class="achievement-card__meta"><a href="${escapeAttr(a.articleUrl)}" target="_blank" rel="noopener">Ссылка</a></p>` : ""}
          <p class="achievement-card__points">Баллы: <strong>${a.points}</strong></p>
          <button type="button" class="btn btn--ghost btn--small" data-del="${escapeAttr(a.id)}">Удалить</button>
        </article>`
        )
        .join("");

      root.querySelectorAll("[data-del]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-del");
          if (!id || !confirm("Удалить достижение?")) return;
          try {
            await this.achievements.remove(id);
          } catch (ex) {
            alert(ex instanceof Error ? ex.message : "Ошибка");
          }
        });
      });
    };

    render();
    this.store.subscribe(render);
  }

  /** @param {string} k */
  _kindLabel(k) {
    if (k === "certificate") return "Грамота / диплом";
    if (k === "article") return "Статья";
    if (k === "competition") return "Конкурс / проект";
    return k;
  }
}

<<<<<<< HEAD
function resolveAchievementPoints(a) {
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
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
