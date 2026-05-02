export class AdminView {
  /**
   * @param {import('../services/AuthService.js').AuthService} authService
   * @param {import('../services/AchievementService.js').AchievementService} achievementService
   */
  constructor(authService, achievementService) {
    this.auth = authService;
    this.achievements = achievementService;
  }

  async mount() {
    const root = document.getElementById("admin-users");
    if (!root) return;

    const users = await this.auth.listAllUsers();
    const parts = [];
    for (const u of users) {
      const list = await this.achievements.listByUserId(u.id);
      const sum = list.reduce((s, a) => s + (Number(a.points) || 0), 0);
      parts.push(`
        <article class="card admin-user-card">
          <div class="admin-user-card__main">
            <h3>${escapeHtml(u.fullName)}</h3>
            <p class="muted">${escapeHtml(u.email)} · студ. ${escapeHtml(u.studentId)} · ${u.role === "admin" ? "Админ" : "Студент"}</p>
            ${u.group ? `<p class="muted">Группа: ${escapeHtml(u.group)}</p>` : ""}
          </div>
          <div class="admin-user-card__stats">
            <span>Достижений: <strong>${list.length}</strong></span>
            <span>Сумма баллов: <strong>${sum}</strong></span>
          </div>
          <ul class="admin-ach-list">
            ${list
              .slice(0, 5)
              .map(
                (a) =>
                  `<li>${escapeHtml(a.title)} — ${escapeHtml(a.kind)} — ${Number(a.points) || 0} б.</li>`
              )
              .join("")}
            ${list.length > 5 ? `<li class="muted">… и ещё ${list.length - 5}</li>` : ""}
          </ul>
        </article>`);
    }
    root.innerHTML = parts.join("") || '<p class="muted">Нет пользователей</p>';
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
