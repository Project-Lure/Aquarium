// js/exhibition.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("card-list");
  if (!container) return;

  // ========================
  // 状態
  // ========================
  let chars = [];
  let seriesMap = {};
  let originalWorks = []; // パース済み展示作品
  let currentList = [];   // フィルタ・ソート後

  const filterState = {
    text: "",
    series: new Set(),
    colors: new Set(),
    dateFrom: null, // "YYYY-MM-DD" or null
    dateTo: null,   // "YYYY-MM-DD" or null
  };

  // sort（展示デフォルト：古い→新しい）
  // "publishedAt-asc" | "publishedAt-desc" | "title" | "code"
  let sortMode = "publishedAt-asc";

  // ========================
  // 定義
  // ========================
  const EXHIBITION_DIR = "images/exhibition";

  const COLOR_GROUPS = [
    { key: "pink",   label: "桃"   },
    { key: "red",    label: "赤"   },
    { key: "orange", label: "橙"   },
    { key: "purple", label: "紫"   },
    { key: "mono",   label: "白黒" },
    { key: "yellow", label: "黄"   },
    { key: "blue",   label: "青"   },
    { key: "cyan",   label: "水"   },
    { key: "green",  label: "緑"   }
  ];

  // ========================
  // utils
  // ========================
  function fetchJson(url) {
    return fetch(url).then(r => {
      if (!r.ok) throw new Error(`fetch failed: ${url} (${r.status})`);
      return r.json();
    });
  }

  function normalizeWorksJson(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map(x => (typeof x === "string" ? { file: x } : x))
        .filter(x => x?.file);
    }
    if (Array.isArray(raw.items)) {
      return raw.items
        .map(x => (typeof x === "string" ? { file: x } : x))
        .filter(x => x?.file);
    }
    return [];
  }

  // 命名：{code}_{YYYY-MM-DD}_{slug}.(webp|png|jpg|jpeg)
  function parseWorkFromFilename(file) {
    const name = (file || "").split("/").pop() || "";
    const m = name.match(/^(\d{3})_(\d{4}-\d{2}-\d{2})_(.+)\.(webp|png|jpg|jpeg)$/i);

    if (!m) {
      return {
        file: name,
        code: null,
        publishedAt: null,
        slug: name.replace(/\.[^.]+$/, ""),
        ext: (name.split(".").pop() || "").toLowerCase(),
        isValid: false,
      };
    }

    return {
      file: name,
      code: m[1],
      publishedAt: m[2],
      slug: m[3],
      ext: m[4].toLowerCase(),
      isValid: true,
    };
  }

  function getCharByCode(code) {
    if (!code) return null;
    return chars.find(c => c.code === code) || null;
  }

  function isValidHex(hex) {
    const t = (hex || "").trim();
    return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(t);
  }

  function normalizeHex(hex) {
    let c = (hex || "").trim();
    if (!c.startsWith("#")) c = "#" + c;
    if (c.length === 4) {
      const r = c[1], g = c[2], b = c[3];
      c = `#${r}${r}${g}${g}${b}${b}`;
    }
    return c;
  }

  function pickFrameColorFromChar(c) {
    const fallback = "#bfbfbf";
    if (!c || !Array.isArray(c.colors)) return fallback;

    for (const hex of c.colors) {
      if (typeof hex !== "string") continue;
      const t = hex.trim();
      if (!t) continue;
      if (isValidHex(t)) return normalizeHex(t);
    }
    return fallback;
  }

  // ========================
  // 色系統（キャラ → グループ）
  // ========================
  function getColorGroupsForChar(c) {
    const groups = new Set();

    if (Array.isArray(c?.colors) && c.colors.length > 0) {
      let hasValid = false;

      c.colors.forEach(hex => {
        if (typeof hex !== "string") return;
        const trimmed = hex.trim();
        if (!trimmed) return;

        const g = detectColorGroupFromHex(trimmed);
        if (g) {
          groups.add(g);
          hasValid = true;
        }
      });

      if (!hasValid) groups.add("mono");
    } else {
      groups.add("mono");
    }

    return Array.from(groups);
  }

  function detectColorGroupFromHex(hex) {
    let c = hex.trim().replace("#", "");
    if (c.length === 3) c = c.split("").map(ch => ch + ch).join("");
    if (c.length !== 6) return null;

    const r = parseInt(c.slice(0, 2), 16) / 255;
    const g = parseInt(c.slice(2, 4), 16) / 255;
    const b = parseInt(c.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }

    // 低彩度 or 極端な明度は「白黒」扱い
    if (s < 0.12 || l < 0.08 || l > 0.92) return "mono";

    if (h >= 345 || h < 10)  return "red";
    if (h >= 10  && h < 35)  return "orange";
    if (h >= 35  && h < 65)  return "yellow";
    if (h >= 65  && h < 150) return "green";
    if (h >= 150 && h < 195) return "cyan";
    if (h >= 195 && h < 240) return "blue";
    if (h >= 240 && h < 285) return "purple";
    if (h >= 285 && h < 345) return "pink";
    return null;
  }

  // ========================
  // modal（DOMを1回だけ作る）
  // ========================
  function ensureExhibitModal() {
    let overlay = document.getElementById("exhibit-overlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "exhibit-overlay";
    overlay.innerHTML = `
      <div id="exhibit-modal" role="dialog" aria-modal="true">
        <div id="exhibit-modal-header">
          <button id="exhibit-close" type="button">×</button>
        </div>

        <div id="exhibit-modal-body">
          <div class="exhibit-modal-image">
            <img id="exhibit-modal-img" alt="">
          </div>

          <div class="exhibit-modal-meta">
            <div class="exhibit-modal-row">
              <span class="exhibit-modal-code" id="exhibit-modal-code"></span>
              <span class="exhibit-modal-date" id="exhibit-modal-date"></span>
            </div>

            <div class="exhibit-modal-title" id="exhibit-modal-title"></div>

            <div class="exhibit-modal-credit">
              <a id="exhibit-modal-credit" href="#" target="_blank" rel="noopener"></a>
            </div>

            <a class="exhibit-modal-link" id="exhibit-modal-link" href="#">キャラ詳細へ</a>

            <!-- ▼ ここに注意文ブロックを追加する -->
            <div class="exhibit-notice">
              無断転載・保存禁止
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.classList.remove("is-open");

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    overlay.querySelector("#exhibit-close")?.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });

    return overlay;
  }

  function openExhibitModal(work) {
    const overlay = ensureExhibitModal();

    const img = overlay.querySelector("#exhibit-modal-img");
    const codeEl = overlay.querySelector("#exhibit-modal-code");
    const dateEl = overlay.querySelector("#exhibit-modal-date");
    const titleEl = overlay.querySelector("#exhibit-modal-title");
    const creditEl = overlay.querySelector("#exhibit-modal-credit");
    const linkEl = overlay.querySelector("#exhibit-modal-link");

    // image
    img.src = `${EXHIBITION_DIR}/${work.file}`;
    img.alt = work.displayTitle || "EXHIBITION";

    // meta
    codeEl.textContent = work.code || "---";
    dateEl.textContent = work.publishedAt || "----/--/--";
    titleEl.textContent = work.displayTitle || (work.slug || work.file);

    // credit（固定：URLがある時だけ表示）
    if (work.credit && work.creditUrl) {
      creditEl.textContent = `Credit: ${work.credit}`;
      creditEl.href = work.creditUrl;
      creditEl.style.display = "";
    } else {
      creditEl.style.display = "none";
    }

    // character link（キャラが紐づく場合のみ）
    if (work.code) {
      linkEl.href = `character.html?code=${encodeURIComponent(work.code)}`;
      linkEl.style.display = "";
    } else {
      linkEl.style.display = "none";
    }

    overlay.classList.add("is-open");
  }

  // ========================
  // render
  // ========================
  function renderList(list) {
    container.innerHTML = "";
    const frag = document.createDocumentFragment();

    list.forEach(w => {
      const c = w.char || null;
      const frameColor = pickFrameColorFromChar(c);

      const card = document.createElement("a");
      card.className = "exhibit-card";
      card.href = "#";
      card.addEventListener("click", (e) => {
        e.preventDefault();
        openExhibitModal(w);
      });

      // 枠色（CSS var）
      card.style.setProperty("--frame-color", frameColor);

      // 画像
      const imgWrap = document.createElement("div");
      imgWrap.className = "exhibit-image";

      const img = document.createElement("img");
      img.alt = w.displayTitle || "EXHIBITION";
      img.loading = "lazy";

      img.draggable = false;
      
      img.addEventListener("error", () => {
        img.src = "images/ui/card-placeholder.png";
        card.classList.add("is-placeholder");
        card.removeAttribute("href");
      });

      img.src = `${EXHIBITION_DIR}/${w.file}`;

      imgWrap.appendChild(img);
      card.appendChild(imgWrap);

      // メタ（※CSSで非表示にする想定でも、DOMは残す）
      const meta = document.createElement("div");
      meta.className = "exhibit-meta";

      const line1 = document.createElement("div");
      line1.className = "exhibit-meta-line";

      const date = document.createElement("span");
      date.className = "exhibit-date";
      date.textContent = w.publishedAt || "----/--/--";

      const code = document.createElement("span");
      code.className = "exhibit-code";
      code.textContent = w.code || "---";

      line1.appendChild(date);
      line1.appendChild(code);

      const title = document.createElement("div");
      title.className = "exhibit-title";
      title.textContent = w.displayTitle || (w.slug || w.file);

      meta.appendChild(line1);
      meta.appendChild(title);

      card.appendChild(meta);
      frag.appendChild(card);
    });

    container.appendChild(frag);
  }

  // ========================
  // sort / filter
  // ========================
  function applySort(list) {
    const arr = [...list];

    switch (sortMode) {
      case "publishedAt-desc":
        arr.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
        break;

      case "title":
        arr.sort((a, b) => {
          const at = (a.char?.titleYomi || a.char?.title || a.slug || "").toString();
          const bt = (b.char?.titleYomi || b.char?.title || b.slug || "").toString();
          return at.localeCompare(bt, "ja");
        });
        break;

      case "code":
        arr.sort((a, b) => (a.code || "").localeCompare(b.code || ""));
        break;

      case "publishedAt-asc":
      default:
        arr.sort((a, b) => (a.publishedAt || "").localeCompare(b.publishedAt || ""));
        break;
    }

    return arr;
  }

  function applyFilter() {
    const text = (filterState.text || "").trim().toLowerCase();
    const activeSeries = Array.from(filterState.series);
    const activeColors = Array.from(filterState.colors);
    const from = filterState.dateFrom;
    const to = filterState.dateTo;

    return originalWorks.filter(w => {
      // テキスト（コード/日付/slug/キャラ名/色名）
      if (text) {
        const c = w.char || null;
        const base = [
          w.code || "",
          w.publishedAt || "",
          w.slug || "",
          c?.title || "",
          c?.titleYomi || "",
          c?.mainColorLabel || "",
        ].join(" ").toLowerCase();

        if (!base.includes(text)) return false;
      }

      // シリーズ
      if (activeSeries.length > 0) {
        const s = w.char?.series || null;
        if (!s || !activeSeries.includes(s)) return false;
      }

      // 色
      if (activeColors.length > 0) {
        const groups = getColorGroupsForChar(w.char);
        if (!groups.some(g => activeColors.includes(g))) return false;
      }

      // 期間（展示だけ）
      if ((from || to) && !w.publishedAt) return false;
      if (from && w.publishedAt < from) return false;
      if (to && w.publishedAt > to) return false;

      return true;
    });
  }

  function refresh() {
    const filtered = applyFilter();
    currentList = applySort(filtered);
    renderList(currentList);
  }

  // ========================
  // search overlay
  // ========================
  function setupSearchOverlay() {
    const overlay = document.getElementById("search-overlay");
    const openBtn = document.getElementById("search-open");
    const closeBtn = document.getElementById("search-close");
    const input = document.getElementById("search-input");
    const decideBtn = document.getElementById("search-decide");
    const resetBtn = document.getElementById("search-reset");

    const seriesOptions = document.getElementById("filter-series-options");
    const colorOptionsWrap = document.getElementById("filter-color-options");
    const dateFrom = document.getElementById("filter-date-from");
    const dateTo = document.getElementById("filter-date-to");

    if (!overlay || !openBtn || !closeBtn || !input || !decideBtn || !resetBtn) return;

    // series chips（増殖防止）
    if (seriesOptions && seriesOptions.childElementCount === 0) {
      const usedSeries = Array.from(new Set(chars.map(c => c.series))).sort();
      usedSeries.forEach(key => {
        const data = seriesMap[key];
        if (!data) return;

        const label = document.createElement("label");
        label.className = "filter-chip";

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = key;
        cb.checked = false;

        label.appendChild(cb);
        label.append(data.nameJa || key);
        seriesOptions.appendChild(label);
      });
    }

    // color options（増殖防止）
    if (colorOptionsWrap && colorOptionsWrap.childElementCount === 0) {
      COLOR_GROUPS.forEach(cg => {
        const div = document.createElement("div");
        div.className = `color-option color-${cg.key}`;
        div.dataset.color = cg.key;

        div.innerHTML = `
          <span class="color-badge"></span>
          <span class="color-label">${cg.label}</span>
        `;

        div.addEventListener("click", () => div.classList.toggle("active"));
        colorOptionsWrap.appendChild(div);
      });
    }

    const open = () => {
      overlay.classList.add("is-open");
      input.focus();
    };

    const close = () => {
      overlay.classList.remove("is-open");
    };

    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });

    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      close();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (overlay.classList.contains("is-open")) close();
    });

    // decide
    decideBtn.addEventListener("click", () => {
      filterState.text = input.value || "";

      filterState.series.clear();
      if (seriesOptions) {
        seriesOptions
          .querySelectorAll('input[type="checkbox"]:checked')
          .forEach(cb => filterState.series.add(cb.value));
      }

      filterState.colors.clear();
      if (colorOptionsWrap) {
        colorOptionsWrap
          .querySelectorAll(".color-option.active")
          .forEach(el => el.dataset.color && filterState.colors.add(el.dataset.color));
      }

      filterState.dateFrom = dateFrom?.value ? dateFrom.value : null;
      filterState.dateTo = dateTo?.value ? dateTo.value : null;

      refresh();
      close();
    });

    // reset
    resetBtn.addEventListener("click", () => {
      input.value = "";
      filterState.text = "";

      filterState.series.clear();
      if (seriesOptions) {
        seriesOptions
          .querySelectorAll('input[type="checkbox"]')
          .forEach(cb => (cb.checked = false));
      }

      filterState.colors.clear();
      if (colorOptionsWrap) {
        colorOptionsWrap
          .querySelectorAll(".color-option")
          .forEach(el => el.classList.remove("active"));
      }

      if (dateFrom) dateFrom.value = "";
      if (dateTo) dateTo.value = "";
      filterState.dateFrom = null;
      filterState.dateTo = null;

      refresh();
    });
  }

  // ========================
  // sort overlay
  // ========================
  function setupSortOverlay() {
    const sortOpenBtn = document.getElementById("sort-open");
    const overlay = document.getElementById("sort-overlay");
    const closeBtn = document.getElementById("sort-close");

    if (!sortOpenBtn || !overlay) return;

    const optionEls = overlay.querySelectorAll(".sort-option[data-sort]");
    const applyBtn = overlay.querySelector("#sort-apply");
    const resetBtn = overlay.querySelector("#sort-reset");

    const open = () => {
      overlay.classList.add("is-open");
      syncSortUiState();
    };

    const close = () => {
      overlay.classList.remove("is-open");
    };

    function syncSortUiState() {
      optionEls.forEach(el => {
        const key = el.dataset.sort;
        el.classList.toggle("active", key === sortMode);
      });
    }

    function readSelectedMode() {
      const activeBtn = overlay.querySelector(".sort-option.active[data-sort]");
      return activeBtn?.dataset.sort || sortMode;
    }

    sortOpenBtn.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        close();
      });
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (overlay.classList.contains("is-open")) close();
    });

    // 選択：activeを1つだけ
    optionEls.forEach(el => {
      el.addEventListener("click", () => {
        optionEls.forEach(x => x.classList.remove("active"));
        el.classList.add("active");
      });
    });

    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        sortMode = readSelectedMode() || "publishedAt-asc";
        refresh();
        close();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        sortMode = "publishedAt-asc";
        optionEls.forEach(x => x.classList.remove("active"));
        const defBtn = overlay.querySelector('.sort-option[data-sort="publishedAt-asc"]');
        if (defBtn) defBtn.classList.add("active");
        refresh();
        close();
      });
    }
  }
  
  function setupAntiSaveHints(){
    // 右クリック（contextmenu）抑止：展示画像だけ
    document.addEventListener("contextmenu", (e) => {
      const img = e.target.closest(".exhibit-image img, #exhibit-modal-img");
      if (img) e.preventDefault();
    });

    // 画像ドラッグで保存を抑止
    document.addEventListener("dragstart", (e) => {
      const img = e.target.closest(".exhibit-image img, #exhibit-modal-img");
      if (img) e.preventDefault();
    });
  }

  setupAntiSaveHints();
  // ========================
  // load
  // ========================
  Promise.all([
    fetchJson("data/characters.json"),
    fetchJson("data/series.json"),
    fetchJson("data/exhibitions.json"),
  ])
    .then(([charsData, seriesMapData, exhibitionsData]) => {
      chars = Array.isArray(charsData) ? charsData : [];
      seriesMap = seriesMapData || {};

      const rawWorks = normalizeWorksJson(exhibitionsData);

      originalWorks = rawWorks.map(w => {
        const parsed = parseWorkFromFilename(w.file);
        const char = parsed.code ? getCharByCode(parsed.code) : null;

        const displayTitle = char?.title
          ? (parsed.slug ? `${char.title} / ${parsed.slug}` : char.title)
          : (parsed.slug || parsed.file);

        return {
          ...parsed,
          char,
          displayTitle,
          series: char?.series || null,
          credit: w.credit || "",
          creditUrl: w.creditUrl || ""
        };
      });

      sortMode = "publishedAt-asc";

      refresh();
      setupSearchOverlay();
      setupSortOverlay();
    })
    .catch(e => {
      console.error("読み込みエラー:", e);
      container.innerHTML = "<p style='padding:16px;'>展示データの読み込みに失敗しました。</p>";
    });
});
