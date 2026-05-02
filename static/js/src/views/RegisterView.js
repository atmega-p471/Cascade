import * as v from "../utils/validators.js";

export class RegisterView {
  /**
   * @param {import('../services/AuthService.js').AuthService} authService
   */
  constructor(authService) {
    this.auth = authService;
  }

  mount() {
    const form = document.getElementById("register-form");
    const err = document.getElementById("form-error");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (err) err.textContent = "";
      const fd = new FormData(form);
      const data = {
        email: String(fd.get("email") || ""),
        password: String(fd.get("password") || ""),
        password2: String(fd.get("password2") || ""),
        studentId: String(fd.get("studentId") || ""),
        fullName: String(fd.get("fullName") || ""),
        group: String(fd.get("group") || ""),
        phone: String(fd.get("phone") || ""),
      };

      const checks = [
        v.email(data.email),
        v.password(data.password),
        v.matchPasswords(data.password, data.password2),
        v.studentId(data.studentId),
        v.required(data.fullName, "Введите ФИО"),
      ];
      const first = checks.find(Boolean);
      if (first) {
        if (err) err.textContent = first;
        return;
      }

      try {
        await this.auth.register(data);
        window.location.href = "/dashboard/";
      } catch (ex) {
        if (err) err.textContent = ex instanceof Error ? ex.message : "Ошибка регистрации";
      }
    });
  }
}
