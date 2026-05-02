import { Achievement } from "../models/Achievement.js";
import * as v from "../utils/validators.js";
import { readFileAsDataURL, isImageDataUrl } from "../utils/fileUpload.js";
<<<<<<< HEAD
import {
  CERTIFICATE_LEVEL_VALUES,
  CERTIFICATE_PLACE_VALUES,
  calculateCertificatePoints,
} from "../utils/achievementRules.js";
=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d

export class AddAchievementView {
  /**
   * @param {import('../services/AchievementService.js').AchievementService} achievementService
   */
  constructor(achievementService) {
    this.svc = achievementService;
  }

  mount() {
    const form = document.getElementById("achievement-form");
    const err = document.getElementById("form-error");
    const preview = document.getElementById("file-preview");
    const fileInput = document.getElementById("achievement-file");
    const ocrStatus = document.getElementById("ocr-status");
    const articleUrl = document.getElementById("article-url");
    const articleLevel = document.getElementById("article-level");
    const tabButtons = document.querySelectorAll("[data-tab]");
    const panels = document.querySelectorAll("[data-tab-panel]");
    const gramotaMode = document.querySelectorAll("[name='gramota_mode']");
    const tabButtonsArr = Array.from(tabButtons);

    if (!form) return;

    let currentKind = "certificate";
    let gramotaSub = "manual";
<<<<<<< HEAD
    const setSectionEnabled = (container, enabled) => {
      if (!container) return;
      container.querySelectorAll("input, select, textarea").forEach((el) => {
        el.disabled = !enabled;
      });
    };

    const syncGramotaModeState = () => {
      const manual = document.getElementById("gramota-manual");
      const scan = document.getElementById("gramota-scan");
      if (manual) manual.hidden = gramotaSub !== "manual";
      if (scan) scan.hidden = gramotaSub !== "scan";
      setSectionEnabled(manual, gramotaSub === "manual");
      setSectionEnabled(scan, gramotaSub === "scan");
    };

=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
    let lastFile = /** @type {File | null} */ (null);
    let lastDataUrl = "";

    const activateTab = (name) => {
      currentKind = name;
      tabButtonsArr.forEach((b) => b.classList.toggle("tab--active", b.getAttribute("data-tab") === name));
      panels.forEach((p) => {
        p.hidden = p.getAttribute("data-tab-panel") !== name;
      });
    };

    tabButtonsArr.forEach((b) => {
      b.addEventListener("click", () => activateTab(b.getAttribute("data-tab") || "certificate"));
    });

    gramotaMode.forEach((r) => {
      r.addEventListener("change", () => {
        gramotaSub = r.value;
<<<<<<< HEAD
        syncGramotaModeState();
      });
    });
    syncGramotaModeState();
=======
        const manual = document.getElementById("gramota-manual");
        const scan = document.getElementById("gramota-scan");
        if (manual) manual.hidden = gramotaSub !== "manual";
        if (scan) scan.hidden = gramotaSub !== "scan";
      });
    });
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d

    let urlTimer = 0;
    if (articleUrl && articleLevel) {
      articleUrl.addEventListener("input", () => {
        window.clearTimeout(urlTimer);
        articleLevel.value = "";
        let url = articleUrl.value.trim();
        if (!url) return;
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        urlTimer = window.setTimeout(async () => {
          const ve = v.optionalUrl(url);
          if (ve) return;
          articleLevel.placeholder = "Определение…";
          try {
            const level = await this.svc.resolveArticleLevel(url);
            articleLevel.value = level;
          } catch {
            articleLevel.value = "";
          } finally {
            articleLevel.placeholder = "";
          }
        }, 400);
      });
    }

    if (fileInput && preview) {
      fileInput.addEventListener("change", async () => {
        const f = fileInput.files?.[0];
        lastFile = f || null;
        lastDataUrl = "";
        preview.innerHTML = "";
        if (err) err.textContent = "";
        if (!f) return;
        try {
          lastDataUrl = await readFileAsDataURL(f);
          if (isImageDataUrl(lastDataUrl)) {
            preview.innerHTML = `<img src="${lastDataUrl}" alt="Предпросмотр" class="preview-img" />`;
          } else {
            preview.innerHTML = `<p class="muted">Файл загружен: <strong>${escapeHtml(f.name)}</strong> (предпросмотр изображения недоступен)</p>`;
          }
          if (gramotaSub === "scan" && ocrStatus) {
<<<<<<< HEAD
            ocrStatus.textContent = "Распознавание текста на фото…";
            const data = await this.svc.recognizeCertificate(f);
            ocrStatus.textContent = "Распознавание завершено";
            const title = form.querySelector('[name="scan_title"]');
            const issue = form.querySelector('[name="scan_issueDate"]');
            const level = form.querySelector('[name="scan_level"]');
            const place = form.querySelector('[name="scan_place"]');
=======
            ocrStatus.textContent = "Распознавание…";
            const data = await this.svc.recognizeCertificate(f);
            ocrStatus.textContent = "Готово (тестовые данные)";
            const title = form.querySelector('[name="scan_title"]');
            const issue = form.querySelector('[name="scan_issueDate"]');
            const level = form.querySelector('[name="scan_level"]');
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
            const desc = form.querySelector('[name="scan_description"]');
            if (title) title.value = data.title;
            if (issue) issue.value = data.issueDate;
            if (level) level.value = data.level;
<<<<<<< HEAD
            if (place) place.value = data.place;
=======
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
            if (desc) desc.value = data.description || "";
          }
        } catch (e) {
          if (err) err.textContent = "Не удалось прочитать файл";
        }
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (err) err.textContent = "";

      try {
        if (currentKind === "certificate") {
          if (gramotaSub === "manual") {
            const fd = new FormData(form);
            const title = String(fd.get("cert_title") || "");
            const issueDate = String(fd.get("cert_issueDate") || "");
            const level = String(fd.get("cert_level") || "");
<<<<<<< HEAD
            const place = String(fd.get("cert_place") || "");
            const t1 = v.required(title);
            const t2 = v.oneOf(level, CERTIFICATE_LEVEL_VALUES, "Выберите корректный уровень");
            const t3 = v.oneOf(place, CERTIFICATE_PLACE_VALUES, "Выберите корректное место");
            if (t1 || t2 || t3) {
              if (err) err.textContent = t1 || t2 || t3 || "";
=======
            const t1 = v.required(title);
            if (t1) {
              if (err) err.textContent = t1;
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
              return;
            }
            const file = fileInput?.files?.[0];
            let fileName = "";
            let fileDataUrl = "";
            if (file) {
              fileName = file.name;
              fileDataUrl = lastDataUrl || (await readFileAsDataURL(file));
            }
            const ach = new Achievement({
              id: "",
              userId: "",
              kind: "certificate",
              title,
              issueDate,
              level,
<<<<<<< HEAD
              place,
              fileName,
              fileDataUrl,
              points: calculateCertificatePoints(level, place),
=======
              fileName,
              fileDataUrl,
              points: 30,
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
            });
            await this.svc.add(ach);
          } else {
            if (!lastFile) {
              if (err) err.textContent = "Выберите файл для сканирования";
              return;
            }
            const fd = new FormData(form);
            const title = String(fd.get("scan_title") || "");
            const issueDate = String(fd.get("scan_issueDate") || "");
            const level = String(fd.get("scan_level") || "");
<<<<<<< HEAD
            const place = String(fd.get("scan_place") || "");
            const description = String(fd.get("scan_description") || "");
            const t1 = v.required(title);
            const t2 = v.oneOf(level, CERTIFICATE_LEVEL_VALUES, "Выберите корректный уровень");
            const t3 = v.oneOf(place, CERTIFICATE_PLACE_VALUES, "Выберите корректное место");
            if (t1 || t2 || t3) {
              if (err) err.textContent = t1 || t2 || t3 || "";
=======
            const description = String(fd.get("scan_description") || "");
            const t1 = v.required(title);
            if (t1) {
              if (err) err.textContent = t1;
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
              return;
            }
            const fileDataUrl = lastDataUrl || (await readFileAsDataURL(lastFile));
            const ach = new Achievement({
              id: "",
              userId: "",
              kind: "certificate",
              title,
              description,
              issueDate,
              level,
<<<<<<< HEAD
              place,
              fileName: lastFile.name,
              fileDataUrl,
              points: calculateCertificatePoints(level, place),
=======
              fileName: lastFile.name,
              fileDataUrl,
              points: 35,
>>>>>>> ec604b87af9df9c22584a12845c11e3ac2e03b5d
            });
            await this.svc.add(ach);
          }
        } else if (currentKind === "article") {
          const fd = new FormData(form);
          const title = String(fd.get("art_title") || "");
          let url = String(fd.get("art_url") || "").trim();
          if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
          const issueDate = String(fd.get("art_issueDate") || "");
          const level = String(fd.get("art_level") || "");
          const t1 = v.required(title);
          const t2 = v.required(url, "Введите ссылку на публикацию");
          const t3 = v.optionalUrl(url);
          if (t1 || t2 || t3) {
            if (err) err.textContent = t1 || t2 || t3 || "";
            return;
          }
          const pts = level.includes("Scopus") || level.includes("WoS") ? 50 : level.includes("ВАК") ? 40 : 25;
          const ach = new Achievement({
            id: "",
            userId: "",
            kind: "article",
            title,
            articleUrl: url,
            issueDate,
            level,
            points: pts,
          });
          await this.svc.add(ach);
        } else if (currentKind === "competition") {
          const fd = new FormData(form);
          const title = String(fd.get("comp_title") || "");
          const issueDate = String(fd.get("comp_issueDate") || "");
          const level = String(fd.get("comp_level") || "");
          const t1 = v.required(title);
          if (t1) {
            if (err) err.textContent = t1;
            return;
          }
          const ach = new Achievement({
            id: "",
            userId: "",
            kind: "competition",
            title,
            issueDate,
            level,
            points: 25,
          });
          await this.svc.add(ach);
        }

        window.location.href = "/dashboard/";
      } catch (ex) {
        if (err) err.textContent = ex instanceof Error ? ex.message : "Ошибка сохранения";
      }
    });
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
