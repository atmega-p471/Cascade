import { Achievement } from "../models/Achievement.js";
import * as v from "../utils/validators.js";
import { readFileAsDataURL, isImageDataUrl } from "../utils/fileUpload.js";

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
        const manual = document.getElementById("gramota-manual");
        const scan = document.getElementById("gramota-scan");
        if (manual) manual.hidden = gramotaSub !== "manual";
        if (scan) scan.hidden = gramotaSub !== "scan";
      });
    });

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
            ocrStatus.textContent = "Распознавание…";
            const data = await this.svc.recognizeCertificate(f);
            ocrStatus.textContent = "Готово (тестовые данные)";
            const title = form.querySelector('[name="scan_title"]');
            const issue = form.querySelector('[name="scan_issueDate"]');
            const level = form.querySelector('[name="scan_level"]');
            const desc = form.querySelector('[name="scan_description"]');
            if (title) title.value = data.title;
            if (issue) issue.value = data.issueDate;
            if (level) level.value = data.level;
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
            const t1 = v.required(title);
            if (t1) {
              if (err) err.textContent = t1;
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
              fileName,
              fileDataUrl,
              points: 30,
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
            const description = String(fd.get("scan_description") || "");
            const t1 = v.required(title);
            if (t1) {
              if (err) err.textContent = t1;
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
              fileName: lastFile.name,
              fileDataUrl,
              points: 35,
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
