document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("card-list");

  let chars = [];
  let arcList = {};
  let seriesMap = {};
  let originalOrder = [];
  let currentList = [];
  let sortMode = "code"; // "code" or "title"

  // ========================
  // 色系統定義（9グループ）
  // ========================
  const COLOR_GROUPS = [
    { key: "red",    label: "赤"   },
    { key: "orange", label: "橙"   },
    { key: "yellow", label: "黄"   },
    { key: "green",  label: "緑"   },
    { key: "mono",   label: "白黒" }, // 真ん中に置きたい無彩色
    { key: "cyan",   label: "水"   },
    { key: "blue",   label: "青"   },
    { key: "purple", label: "紫"   },
    { key: "pink",   label: "桃"   }
  ];

  // ========================
  // 一覧描画
  // ========================

  function renderList(list) {
    container.innerHTML = ""; // 一旦クリア

    list.forEach(c => {
      const card = document.createElement("a");
      card.className = "card";
      card.href = `character.html?code=${c.code}`;

      // ---- 画像部分 ----
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

      // ---- メタ情報 ----
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
  // ソートボタン
  // ========================
  function setupSort() {
    const sortToggleBtn = document.getElementById("sort-open");
    if (!sortToggleBtn) return;

    sortToggleBtn.textContent = "タイトル順";

    sortToggleBtn.addEventListener("click", () => {
      if (sortMode === "code") {
        // タイトル読みでソート
        currentList = [...currentList].sort((a, b) => {
          const ay = (a.titleYomi || a.title || "").toString();
          const by = (b.titleYomi || b.title || "").toString();
          return ay.localeCompare(by, "ja");
        });
        sortMode = "title";
        sortToggleBtn.textContent = "コード順";
      } else {
        // 元の順番に戻す
        const indexMap = new Map();
        originalOrder.forEach((c, i) => indexMap.set(c.code, i));
        currentList = [...currentList].sort(
          (a, b) => (indexMap.get(a.code) ?? 0) - (indexMap.get(b.code) ?? 0)
        );
        sortMode = "code";
        sortToggleBtn.textContent = "タイトル順";
      }
      renderList(currentList);
    });
  }

  // ========================
  // 色系統をキャラから取得
  // ========================
  function getColorGroupForChar(c) {
    // 1. JSON に colorGroup があるならそれをそのまま使う
    if (c.colorGroup) return String(c.colorGroup);

    // 2. mainColor があれば hex から自動判定（#rrggbb 想定）
    if (c.mainColor && typeof c.mainColor === "string") {
      return detectColorGroupFromHex(c.mainColor);
    }

    return null;
  }

  // 16進カラー → 9グループ（かなりラフな判定）
  function detectColorGroupFromHex(hex) {
    let h, s, l;

    // #fff / #ffffff 両対応
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

    // 無彩色判定：彩度が低い or 明度がかなり極端
    if (s < 0.12 || l < 0.08 || l > 0.92) {
      return "mono";
    }

    // hue でざっくり割り振り（赤は両端をまたぐので2分割）
    if (h >= 345 || h < 10) return "red";
    if (h >= 10 && h < 35) return "orange";      // 赤〜橙
    if (h >= 35 && h < 65) return "yellow";
    if (h >= 65 && h < 150) return "green";
    if (h >= 150 && h < 195) return "cyan";      // 水色
    if (h >= 195 && h < 240) return "blue";
    if (h >= 240 && h < 285) return "purple";    // 青紫寄り
    if (h >= 285 && h < 345) return "pink";      // ピンク〜マゼンタ

    return null;
  }

  // ========================
  // 検索 UI ＋ 絞り込み
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

    // シリーズのチェックボックス生成
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

    // アークのチェックボックス生成
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

    // 色フィルタ（3×3）の生成：◾️に色を塗る形式
    if (colorOptionsWrap) {
      colorOptionsWrap.innerHTML = "";
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

    // 実際の絞り込み処理
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
        // テキスト検索
        if (text) {
          const base = (
            (c.code || "") + " " +
            (c.title || "") + " " +
            (c.titleYomi || "") + " " +
            (c.mainColorLabel || "")
          ).toString().toLowerCase();
          if (!base.includes(text)) return false;
        }

        // シリーズフィルタ
        if (activeSeries.length > 0 && !activeSeries.includes(c.series)) {
          return false;
        }

        // アークフィルタ
        if (activeArcs.length > 0) {
          const arcCodes = [];
          if (c.arc?.ex) arcCodes.push(c.arc.ex);
          if (c.arc?.core) arcCodes.push(c.arc.core);
          if (!arcCodes.some(code => activeArcs.includes(code))) {
            return false;
          }
        }

        // 色フィルタ
        if (activeColors.length > 0) {
          const group = getColorGroupForChar(c);
          if (!group || !activeColors.includes(group)) {
            return false;
          }
        }

        return true;
      });

      currentList = filtered;
      renderList(currentList);
    }

    // モーダルの開閉
    openBtn.addEventListener("click", () => {
      overlay.classList.add("is-open");
      input.focus();
    });

    closeBtn.addEventListener("click", () => {
      overlay.classList.remove("is-open");
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("is-open");
      }
    });

    // 絞り込む
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
      sortMode = "code";
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
      renderList(currentList);

      setupSort();
      setupSearch();
    })
    .catch(e => {
      console.error("読み込みエラー:", e);
    });
});