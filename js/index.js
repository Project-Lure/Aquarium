// js/index.js

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("card-list");
  if (!container) return;

  let chars = [];
  let arcList = {};
  let seriesMap = {};
  let originalOrder = [];
  let currentList = [];

  // ソート状態
  // "code" = 元の並び（characters.json の順）
  // "title" = タイトル読み（titleYomi）順
  let sortMode = "code";

  // ========================
  // 色系統定義（9グループ）
  // ========================
  const COLOR_GROUPS = [
    { key: "pink",   label: "桃"   },
    { key: "red",    label: "赤"   },
    { key: "orange", label: "橙"   },
    { key: "purple", label: "紫"   },
    { key: "mono",   label: "白黒" }, // 無彩色
    { key: "yellow", label: "黄"   },
    { key: "blue",   label: "青"   },
    { key: "cyan",   label: "水"   },
    { key: "green",  label: "緑"   }
  ];

  // ========================
  // 一覧描画
  // ========================
  function renderList(list) {
    container.innerHTML = "";

    list.forEach(c => {
      const card = document.createElement("a");
      card.className = "card";
      card.href = `character.html?code=${c.code}`;

      // 画像
      const imgWrap = document.createElement("div");
      imgWrap.className = "card-image";

      const img = document.createElement("img");
      img.alt = c.title;

      img.addEventListener("error", () => {
        img.src = "images/ui/card-placeholder.png";
        card.removeAttribute("href");
        card.classList.add("is-placeholder");

        const cs = document.createElement("div");
        cs.className = "coming-soon";
        cs.textContent = "Coming Soon";
        card.appendChild(cs);
      });

      img.src = `images/characters/${c.code}.png`;

      imgWrap.appendChild(img);
      card.appendChild(imgWrap);

      // メタ
      const meta = document.createElement("div");
      meta.className = "card-meta";

      const codeDiv = document.createElement("div");
      codeDiv.className = "card-code";
      codeDiv.textContent = c.code;

      const titleDiv = document.createElement("div");
      titleDiv.className = "card-title";
      titleDiv.textContent = c.title;

      meta.appendChild(codeDiv);
      meta.appendChild(titleDiv);

      card.appendChild(meta);
      container.appendChild(card);
    });
  }

  // ========================
  // 元順に戻すための indexMap
  // ========================
  function buildIndexMap() {
    const indexMap = new Map();
    originalOrder.forEach((c, i) => indexMap.set(c.code, i));
    return indexMap;
  }

  // ========================
  // ソート適用（currentList に対して）
  // ========================
  function applySortInPlace() {
    if (sortMode === "title") {
      currentList = [...currentList].sort((a, b) => {
        const ay = (a.titleYomi || a.title || "").toString();
        const by = (b.titleYomi || b.title || "").toString();
        return ay.localeCompare(by, "ja");
      });
      return;
    }

    // "code" = 元順（characters.json の順）へ
    const indexMap = buildIndexMap();
    currentList = [...currentList].sort(
      (a, b) => (indexMap.get(a.code) ?? 0) - (indexMap.get(b.code) ?? 0)
    );
  }

  // ========================
  // ソートUI（sort-overlay：開閉＋選択）
  // ========================
  function setupSortOverlay() {
    const sortOpenBtn = document.getElementById("sort-open");
    const overlay = document.getElementById("sort-overlay");
    const closeBtn = document.getElementById("sort-close");

    // UI が無いページでは何もしない
    if (!sortOpenBtn || !overlay) return;

    // オプション（ラジオ or ボタン）を想定
    // どちらでも拾えるように data-sort を優先
    const optionEls = overlay.querySelectorAll("[data-sort]");
    const applyBtn = overlay.querySelector("#sort-apply");
    const resetBtn = overlay.querySelector("#sort-reset");

    const open = () => overlay.classList.add("is-open");
    const close = () => overlay.classList.remove("is-open");

    // 開く
    sortOpenBtn.addEventListener("click", (e) => {
      e.preventDefault();
      open();
      syncSortUiState(); // 現在の sortMode をUIに反映
    });

    // 閉じる（×）
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        close();
      });
    }

    // 背景クリックで閉じる
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    // Esc で閉じる（search と競合してもOK：sortが開いてたら閉じる）
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (overlay.classList.contains("is-open")) close();
    });

    // UI同期（ラジオ or active クラス）
    function syncSortUiState() {
      if (!optionEls || optionEls.length === 0) return;

      optionEls.forEach(el => {
        const key = el.dataset.sort;
        const isActive = key === sortMode;

        // ボタン形式
        if (el.classList.contains("sort-option")) {
          el.classList.toggle("active", isActive);
        }

        // input ラジオ形式
        if (el.tagName === "INPUT" && el.type === "radio") {
          el.checked = isActive;
        }
      });
    }

    // 選択を読む
    function readSelectedMode() {
      // 1) radio があれば優先
      const checkedRadio = overlay.querySelector('input[type="radio"][name="sort-mode"]:checked');
      if (checkedRadio && checkedRadio.value) return checkedRadio.value;

      // 2) active の sort-option
      const activeBtn = overlay.querySelector(".sort-option.active[data-sort]");
      if (activeBtn) return activeBtn.dataset.sort;

      // 3) とりあえず sortMode を返す
      return sortMode;
    }

    // option をクリックで切り替え（ボタン形式対応）
    if (optionEls && optionEls.length) {
      optionEls.forEach(el => {
        el.addEventListener("click", () => {
          const key = el.dataset.sort;
          if (!key) return;

          // ボタン形式：active を切り替え
          if (el.classList.contains("sort-option")) {
            optionEls.forEach(x => x.classList.remove("active"));
            el.classList.add("active");
          }

          // radio 形式：value をセット（input なら勝手に checked になる）
        });
      });
    }

    // 適用
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        const next = readSelectedMode();
        if (next === "code" || next === "title") {
          sortMode = next;
        }
        applySortInPlace();
        renderList(currentList);
        close();
      });
    } else {
      // apply ボタンが無い設計の場合：選択した瞬間に即適用したいならここを有効化
      // （今は安全側で何もしない）
    }

    // リセット（= code）
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        sortMode = "code";
        applySortInPlace();
        renderList(currentList);
        close();
      });
    }
  }

  // ========================
  // 色系統をキャラから取得（colors だけを見る）
  // ========================
  function getColorGroupsForChar(c) {
    const groups = new Set();

    if (Array.isArray(c.colors) && c.colors.length > 0) {
      let hasValidHex = false;

      c.colors.forEach(hex => {
        if (typeof hex !== "string") return;
        const trimmed = hex.trim();
        if (!trimmed) return;

        const g = detectColorGroupFromHex(trimmed);
        if (g) {
          groups.add(g);
          hasValidHex = true;
        }
      });

      if (!hasValidHex) groups.add("mono");
    } else {
      groups.add("mono");
    }

    return Array.from(groups);
  }

  function detectColorGroupFromHex(hex) {
    let c = hex.trim().replace("#", "");
    if (c.length === 3) {
      c = c.split("").map(ch => ch + ch).join("");
    }
    if (c.length !== 6) return null;

    const r = parseInt(c.slice(0, 2), 16) / 255;
    const g = parseInt(c.slice(2, 4), 16) / 255;
    const b = parseInt(c.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h, s, l;
    l = (max + min) / 2;

    if (d === 0) {
      s = 0;
      h = 0;
    } else {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r:
          h = ((g - b) / d) % 6;
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }

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
  // 検索 UI ＋ 絞り込み（search-overlay）
  // ========================
  function setupSearch() {
    const overlay = document.getElementById("search-overlay");
    const openBtn = document.getElementById("search-open");
    const closeBtn = document.getElementById("search-close");
    const input = document.getElementById("search-input");
    const decideBtn = document.getElementById("search-decide");
    const resetBtn = document.getElementById("search-reset");
    const seriesOptions = document.getElementById("filter-series-options");
    const arcOptions = document.getElementById("filter-arc-options");
    const colorOptionsWrap = document.getElementById("filter-color-options");

    if (!overlay || !openBtn || !closeBtn || !input ||
        !decideBtn || !resetBtn ||
        !seriesOptions || !arcOptions) return;

    // 初回のみ生成したいので、二重生成防止
    // すでに何か入ってたら生成しない（labelが残ってると増殖するため）
    if (seriesOptions.childElementCount === 0) {
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
        label.append(data.nameJa);
        seriesOptions.appendChild(label);
      });
    }

    if (arcOptions.childElementCount === 0) {
      const usedArcsSet = new Set();
      chars.forEach(c => {
        if (c.arc?.ex) usedArcsSet.add(c.arc.ex);
        if (c.arc?.core) usedArcsSet.add(c.arc.core);
      });

      Array.from(usedArcsSet).sort().forEach(code => {
        const data = arcList[code];
        if (!data) return;
        const label = document.createElement("label");
        label.className = "filter-chip";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = code;
        cb.checked = false;
        label.appendChild(cb);
        label.append(`${data.icon} ${data.name}`);
        arcOptions.appendChild(label);
      });
    }

    if (colorOptionsWrap && colorOptionsWrap.childElementCount === 0) {
      COLOR_GROUPS.forEach(cg => {
        const div = document.createElement("div");
        div.className = `color-option color-${cg.key}`;
        div.dataset.color = cg.key;

        div.innerHTML = `
          <span class="color-badge"></span>
          <span class="color-label">${cg.label}</span>
        `;

        div.addEventListener("click", () => {
          div.classList.toggle("active");
        });

        colorOptionsWrap.appendChild(div);
      });
    }

    function applyFilterAndRender() {
      const text = input.value.trim().toLowerCase();

      const activeSeries = Array.from(
        seriesOptions.querySelectorAll('input[type="checkbox"]:checked')
      ).map(el => el.value);

      const activeArcs = Array.from(
        arcOptions.querySelectorAll('input[type="checkbox"]:checked')
      ).map(el => el.value);

      const activeColors = colorOptionsWrap
        ? Array.from(colorOptionsWrap.querySelectorAll(".color-option.active"))
            .map(el => el.dataset.color)
        : [];

      const filtered = originalOrder.filter(c => {
        // テキスト
        if (text) {
          const base = (
            (c.code || "") + " " +
            (c.title || "") + " " +
            (c.titleYomi || "") + " " +
            (c.mainColorLabel || "")
          ).toString().toLowerCase();
          if (!base.includes(text)) return false;
        }

        // シリーズ
        if (activeSeries.length > 0 && !activeSeries.includes(c.series)) {
          return false;
        }

        // アーク
        if (activeArcs.length > 0) {
          const arcCodes = [];
          if (c.arc?.ex) arcCodes.push(c.arc.ex);
          if (c.arc?.core) arcCodes.push(c.arc.core);
          if (!arcCodes.some(code => activeArcs.includes(code))) {
            return false;
          }
        }

        // 色
        if (activeColors.length > 0) {
          const groups = getColorGroupsForChar(c);
          if (!groups || !groups.some(g => activeColors.includes(g))) {
            return false;
          }
        }

        return true;
      });

      currentList = filtered;

      // フィルタ後にも現在の sortMode を適用して整合性を保つ
      applySortInPlace();
      renderList(currentList);
    }

    // open/close
    openBtn.addEventListener("click", () => {
      overlay.classList.add("is-open");
      input.focus();
    });

    closeBtn.addEventListener("click", () => {
      overlay.classList.remove("is-open");
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("is-open");
    });

    // 絞り込み
    decideBtn.addEventListener("click", () => {
      applyFilterAndRender();
      overlay.classList.remove("is-open");
    });

    // リセット
    resetBtn.addEventListener("click", () => {
      input.value = "";
      seriesOptions.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      arcOptions.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      if (colorOptionsWrap) {
        colorOptionsWrap.querySelectorAll(".color-option")
          .forEach(el => el.classList.remove("active"));
      }

      currentList = [...originalOrder];
      // リセットは「コード順（元順）」に戻す方が自然
      sortMode = "code";
      applySortInPlace();
      renderList(currentList);
    });
  }

  // ========================
  // データ読み込み
  // ========================
  Promise.all([
    fetch("data/characters.json").then(r => r.json()),
    fetch("data/arcList.json").then(r => r.json()),
    fetch("data/series.json").then(r => r.json())
  ])
    .then(([charsData, arcListData, seriesMapData]) => {
      chars = charsData;
      arcList = arcListData;
      seriesMap = seriesMapData;

      originalOrder = [...chars];
      currentList = [...originalOrder];

      // 初期表示：元順（code）
      sortMode = "code";
      applySortInPlace();
      renderList(currentList);

      // search / sort
      setupSearch();
      setupSortOverlay();
    })
    .catch(e => {
      console.error("読み込みエラー:", e);
    });
});
