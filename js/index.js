document.addEventListener("DOMContentLoaded", () => {
  // ===== データ読み込み =====
  Promise.all([
    fetch("data/characters.json").then(r => r.json()),
    fetch("data/series.json").then(r => r.json()),
    fetch("data/arcList.json").then(r => r.json())
  ])
    .then(([chars, seriesMap, arcMap]) => {
      const container = document.getElementById("card-list");

      // 元の順番を保持
      const originalOrder = [...chars];
      let currentList = [...originalOrder];
      let sortMode = "code";

      // ===== 一覧描画 =====
      function renderList(list) {
        container.innerHTML = "";
        list.forEach(c => {
          const imgPath = `images/characters/${c.code}.png`;
          const a = document.createElement("a");
          a.href = `character.html?code=${c.code}`;
          a.className = "card";
          a.innerHTML = `
            <div class="card-inner">
              <div class="card-image">
                <img src="${imgPath}" alt="${c.title}">
              </div>
              <div class="card-meta">
                <div class="card-title">${c.code}_${c.title}</div>
              </div>
            </div>
          `;
          container.appendChild(a);
        });
      }

      // 初期表示
      renderList(currentList);

      // ===== 並び替え =====
      const sortToggleBtn = document.getElementById("sort-open");

      if (sortToggleBtn) {
        sortToggleBtn.textContent = "タイトル順";

        sortToggleBtn.addEventListener("click", () => {
          if (sortMode === "code") {
            currentList = [...originalOrder].sort((a, b) => {
              const ay = (a.titleYomi || a.title || "");
              const by = (b.titleYomi || b.title || "");
              return ay.localeCompare(by, "ja");
            });
            sortMode = "title";
            sortToggleBtn.textContent = "コード順";
          } else {
            currentList = [...originalOrder];
            sortMode = "code";
            sortToggleBtn.textContent = "タイトル順";
          }
          renderList(currentList);
        });
      }

      // ===== 検索DOM取得 =====
      const overlay      = document.getElementById("search-overlay");
      const openBtn      = document.getElementById("search-open");
      const closeBtn     = document.getElementById("search-close");
      const applyBtn     = document.getElementById("search-apply");
      const resetBtn     = document.getElementById("search-reset");

      const searchInput  = document.getElementById("search-input");
      const seriesSelect = document.getElementById("filter-series"); // まだ無ければ null
      const arcSelect    = document.getElementById("filter-arc");

      // ===== 絞り込み処理 =====
      function runSearch() {
        const q = (searchInput?.value || "").trim().toLowerCase();
        const seriesFilter = seriesSelect?.value || "";
        const arcFilter    = arcSelect?.value || "";

        const filtered = originalOrder.filter(c => {
          const series = seriesMap[c.series];
          const exArc  = c.arc?.ex ? arcMap[c.arc.ex] : null;
          const coreArc= c.arc?.core ? arcMap[c.arc.core] : null;

          if (seriesFilter && c.series !== seriesFilter) return false;

          if (arcFilter) {
            if (c.arc?.ex !== arcFilter && c.arc?.core !== arcFilter) return false;
          }

          if (!q) return true;

          const haystack = [
            c.code,
            c.title,
            c.titleYomi,
            c.mainColorLabel,
            ...(c.colors || []),
            c.series,
            series?.nameJa,
            series?.key,
            c.arc?.ex,
            c.arc?.core,
            exArc?.name,
            coreArc?.name
          ].join(" ").toLowerCase();

          return haystack.includes(q);
        });

        currentList = filtered;
        renderList(currentList);

        overlay.classList.remove("is-open");
      }

      // ===== リセット処理 =====
      function resetSearch() {
        if (searchInput)  searchInput.value = "";
        if (seriesSelect) seriesSelect.value = "";
        if (arcSelect)    arcSelect.value = "";

        currentList = [...originalOrder];
        renderList(currentList);

        overlay.classList.remove("is-open");
      }

      // ===== イベント =====
      if (openBtn) {
        openBtn.addEventListener("click", () => {
          overlay.classList.add("is-open");
        });
      }

      if (applyBtn) {
        applyBtn.addEventListener("click", runSearch);
      }

      if (resetBtn) {
        resetBtn.addEventListener("click", resetSearch);
      }

      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          overlay.classList.remove("is-open");
        });
      }

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.remove("is-open");
      });
    })
    .catch(e => console.error("読み込みエラー:", e));
});
