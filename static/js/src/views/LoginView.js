import * as v from "../utils/validators.js";

export class LoginView {
  /**
   * @param {import('../services/AuthService.js').AuthService} authService
   */
  constructor(authService) {
    this.auth = authService;
  }

  mount() {
    const form = document.getElementById("login-form");
    const err = document.getElementById("form-error");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (err) err.textContent = "";
      const fd = new FormData(form);
      const email = String(fd.get("email") || "");
      const password = String(fd.get("password") || "");

      const e1 = v.email(email);
      const e2 = v.required(password, "Введите пароль");
      if (e1 || e2) {
        if (err) err.textContent = e1 || e2 || "";
        return;
      }

      try {
        const user = await this.auth.login(email, password);
        if (user.isAdmin()) window.location.href = "/admin/";
        else window.location.href = "/dashboard/";
      } catch (ex) {
        if (err) err.textContent = ex instanceof Error ? ex.message : "Ошибка входа";
      }
    });
  }
}
