/**
 * Точка входа: создание зависимостей (DI), восстановление сессии, монтирование страницы.
 */
import { USE_MOCK } from "./config.js";
import { AppStore } from "./store/AppStore.js";
import { MockUserRepository } from "./repositories/MockUserRepository.js";
import { MockAchievementRepository } from "./repositories/MockAchievementRepository.js";
import { AuthService } from "./services/AuthService.js";
import { AchievementService } from "./services/AchievementService.js";
import { ScholarshipService } from "./services/ScholarshipService.js";
import { LoginView } from "./views/LoginView.js";
import { RegisterView } from "./views/RegisterView.js";
import { DashboardView } from "./views/DashboardView.js";
import { AddAchievementView } from "./views/AddAchievementView.js";
import { CalculateView } from "./views/CalculateView.js";
import { AdminView } from "./views/AdminView.js";

function shortName(fullName) {
  if (!fullName) return "";
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[1].charAt(0)}.`;
  return parts[0].slice(0, 14);
}

function updateShell(store) {
  const navAuth = document.getElementById("nav-auth");
  const navGuest = document.getElementById("nav-guest");
  const navUserShort = document.getElementById("nav-user-short");
  const u = store.currentUser;
  if (navAuth && navGuest) {
    navAuth.hidden = !u;
    navGuest.hidden = !!u;
  }
  if (navUserShort) {
    navUserShort.textContent = u ? shortName(u.fullName) : "";
    navUserShort.title = u ? `${u.fullName} · ${u.role === "admin" ? "администратор" : "студент"}` : "";
  }
  const adminLink = document.getElementById("nav-admin-link");
  if (adminLink) {
    adminLink.hidden = !u || !u.isAdmin();
  }
}

function redirect(path) {
  window.location.href = path;
}

async function main() {
  if (!USE_MOCK) {
    console.warn("USE_MOCK = false: подключите ApiUserRepository / ApiAchievementRepository в main.js.");
  }

  const store = new AppStore();
  const userRepository = new MockUserRepository();
  const achievementRepository = new MockAchievementRepository();
  const authService = new AuthService(userRepository, store);
  const achievementService = new AchievementService(achievementRepository, store);
  const scholarshipService = new ScholarshipService(achievementService, store);

  await authService.restoreSession();
  if (store.currentUser) {
    await achievementService.refreshForCurrentUser();
  }
  updateShell(store);
  store.subscribe(() => updateShell(store));

  const page = document.body.dataset.page || "";

  if (page === "login" || page === "register") {
    if (store.currentUser) {
      redirect(store.currentUser.isAdmin() ? "/admin/" : "/dashboard/");
      return;
    }
  }

  const needUser = ["dashboard", "add_achievement", "calculate"].includes(page);
  if (needUser && !store.currentUser) {
    redirect("/");
    return;
  }

  if (page === "admin") {
    if (!store.currentUser) {
      redirect("/");
      return;
    }
    if (!store.currentUser.isAdmin()) {
      redirect("/dashboard/");
      return;
    }
  }

  switch (page) {
    case "login":
      new LoginView(authService).mount();
      break;
    case "register":
      new RegisterView(authService).mount();
      break;
    case "dashboard":
      await new DashboardView(achievementService, store, authService).mount();
      break;
    case "add_achievement":
      new AddAchievementView(achievementService).mount();
      break;
    case "calculate":
      new CalculateView(scholarshipService).mount();
      break;
    case "admin":
      await new AdminView(authService, achievementService).mount();
      break;
    default:
      break;
  }

  const logoutBtn = document.getElementById("nav-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      authService.logout();
      redirect("/");
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  main().catch((e) => console.error(e));
});
