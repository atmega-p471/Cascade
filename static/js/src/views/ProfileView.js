import * as v from "../utils/validators.js";
import { User } from "../models/User.js";

export class ProfileView {
  /**
   * @param {import('../services/AuthService.js').AuthService} authService
   * @param {import('../store/AppStore.js').AppStore} store
   */
  constructor(authService, store) {
    this.auth = authService;
    this.store = store;
  }

  mount() {
    const form = document.getElementById("profile-form");
    const err = document.getElementById("form-error");
    const ok = document.getElementById("form-success");
    if (!form) return;

    const apply = () => {
      const u = this.store.currentUser;
      if (!u) return;
      /** @type {HTMLInputElement|null} */
      const fullName = form.querySelector('[name="fullName"]');
      /** @type {HTMLInputElement|null} */
      const group = form.querySelector('[name="group"]');
      /** @type {HTMLInputElement|null} */
      const phone = form.querySelector('[name="phone"]');
      if (fullName) fullName.value = u.fullName;
      if (group) group.value = u.group || "";
      if (phone) phone.value = u.phone || "";
    };
    apply();
    this.store.subscribe(apply);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (err) err.textContent = "";
      if (ok) ok.textContent = "";
      const u = this.store.currentUser;
      if (!u) return;

      const fd = new FormData(form);
      const fullName = String(fd.get("fullName") || "");
      const ve = v.required(fullName, "Введите ФИО");
      if (ve) {
        if (err) err.textContent = ve;
        return;
      }

      const next = new User({
        ...u,
        fullName,
        group: String(fd.get("group") || ""),
        phone: String(fd.get("phone") || ""),
      });

      try {
        await this.auth.updateProfile(next);
        if (ok) ok.textContent = "Профиль сохранён";
      } catch (ex) {
        if (err) err.textContent = ex instanceof Error ? ex.message : "Ошибка сохранения";
      }
    });
  }
}
