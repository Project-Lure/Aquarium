document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("card-list");

  let chars = [];
  let arcList = {};
  let seriesMap = {};
  let originalOrder = [];
  let currentList = [];
  let sortMode = "code"; // "code" or "title"

  // ----- 一覧描画 -----
  // ===== 一覧描画用の関数（画像 404 → 未定カードに差し替え） =====
function renderList(list) {
  container.innerHTML = ""; // 一旦クリア

  list.forEach(c => {
    // カード本体は「a」で作る（画像があればリンク、なければ後で無効化）
    const card = document.createElement("a");
    card.className = "card";
    card.href = `character.html?code=${c.code}`;

    // ---- 画像部分 ----
    const imgWrap = document.createElement("div");
    imgWrap.className = "card-image";

    const img = document.createElement("img");
    img.alt = c.title;

    // ★ここがポイント：画像が読み込めなかった場合の処理
    img.addEventListener("error", () => {
      // 未定カード画像に差し替え
      img.src = "images/ui/card-placeholder.png";

      // クリック無効化
      card.removeAttribute("href");
      card.classList.add("is-placeholder");
    });

    // src を最後にセットして読み込み開始
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

  // ----- ソートボタン -----
  function setupSort() {
    const sortToggleBtn = document.getElementById("sort-open");
    if (!sortToggleBtn) return;

    sortToggleBtn.textContent = "タイトル順";

    sortToggleBtn.addEventListener("click", () => {
      if (sortMode === "code") {
        // タイトル読みでソート（今表示中のリストに対して）
        currentList = [...currentList].sort((a, b) => {
          const ay = (a.titleYomi || a.title || "").toString();
          const by = (b.titleYomi || b.title || "").toString();
          return ay.localeCompare(by, "ja");
        });
        sortMode = "title";
        sortToggleBtn.textContent = "コード順";
      } else {
        // 元の順番に戻す（フィルタ後も元配列の順を基準に並べ直す）
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

  // ----- 検索 UI ＋ 絞り込み -----
  function setupSearch() {
    const overlay = document.getElementById("search-overlay");
    const openBtn = document.getElementById("search-open");
    const closeBtn = document.getElementById("search-close");
    const input = document.getElementById("search-input");
    const decideBtn = document.getElementById("search-decide");
    const resetBtn = document.getElementById("search-reset");
    const seriesOptions = document.getElementById("filter-series-options");
    const arcOptions = document.getElementById("filter-arc-options");

    if (!overlay || !openBtn || !input ||
        !seriesOptions || !arcOptions) return;

    // シリーズのチェックボックス生成（chars に存在するものだけ）
    const usedSeries = Array.from(
      new Set(chars.map(c => c.series))
    ).sort();

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
      label.append(data.nameJa);   // 和名だけでOK
      seriesOptions.appendChild(label);
    });

    // アークのチェックボックス生成（ex/core から集合を作る）
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
      // icon + name（和名）
      label.append(`${data.icon} ${data.name}`);
      arcOptions.appendChild(label);
    });

    // 実際の絞り込み処理
    function applyFilterAndRender() {
      const text = input.value.trim().toLowerCase();

      const activeSeries = Array.from(
        seriesOptions.querySelectorAll('input[type="checkbox"]:checked')
      ).map(el => el.value);

      const activeArcs = Array.from(
        arcOptions.querySelectorAll('input[type="checkbox"]:checked')
      ).map(el => el.value);

      const filtered = originalOrder.filter(c => {
        // テキスト検索：コード / タイトル / 読み / 色名（和名）
        if (text) {
          const base = (
            (c.code || "") + " " +
            (c.title || "") + " " +
            (c.titleYomi || "") + " " +
            (c.mainColorLabel || "")
          ).toString().toLowerCase();
          if (!base.includes(text)) return false;
        }

        // シリーズフィルタ（何もチェックされていない場合は0件）
        if (activeSeries.length > 0 && !activeSeries.includes(c.series)) {
          return false;
        }

        // アークフィルタ（ex/core のどちらか1つでも含まれていればOK）
        if (activeArcs.length > 0) {
          const arcCodes = [];
          if (c.arc?.ex) arcCodes.push(c.arc.ex);
          if (c.arc?.core) arcCodes.push(c.arc.core);
          if (!arcCodes.some(code => activeArcs.includes(code))) {
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

    // 絞り込む：カード一覧に反映して閉じる
    decideBtn.addEventListener("click", () => {
      applyFilterAndRender();
      overlay.classList.remove("is-open");
    });

    // リセット：検索条件クリア＆一覧を元に戻す
    resetBtn.addEventListener("click", () => {
      input.value = "";
      seriesOptions.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      arcOptions.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      currentList = [...originalOrder];
      sortMode = "code";
      renderList(currentList);
    });
  }

  // ----- データ読み込み -----
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
