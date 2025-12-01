document.addEventListener("DOMContentLoaded", () => {
  // ===== キャラクターデータ読み込み =====
  Promise.all([
    fetch("data/characters.json").then(r => r.json()),
    fetch("data/series.json").then(r => r.json()),
    fetch("data/arcList.json").then(r => r.json())
  ])
    .then(([chars, seriesMap, arcMap]) => {
      const container = document.getElementById("card-list");

      // 元データ保持
      const originalOrder = [...chars];
      let currentList = [...originalOrder];
      let sortMode = "code"; // "code" or "title"

      // ===== 一覧描画関数 =====
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
                <div class="card-title">${c.title}</div>
              </div>
            </div>
          `;
          container.appendChild(a);
        });
      }

      // 初期表示：コード順（JSONの順番）
      renderList(currentList);

      // ===== 並び替えトグル（コード順 / タイトル順） =====
      const sortToggleBtn = document.getElementById("sort-open");

      if (sortToggleBtn) {
        sortToggleBtn.textContent = "タイトル順";

        sortToggleBtn.addEventListener("click", () => {
          if (sortMode === "code") {
            // タイトル読みでソート
            currentList = [...originalOrder].sort((a, b) => {
              const ay = (a.titleYomi || a.title || "").toString();
              const by = (b.titleYomi || b.title || "").toString();
              return ay.localeCompare(by, "ja");
            });
            sortMode = "title";
            sortToggleBtn.textContent = "コード順";
          } else {
            // コード順に戻す
            currentList = [...originalOrder];
            sortMode = "code";
            sortToggleBtn.textContent = "タイトル順";
          }
          renderList(currentList);
        });
      }

      // ===== 検索UI要素 =====
      const overlay       = document.getElementById("search-overlay");
      const openBtn       = document.getElementById("search-open");
      const closeBtn      = document.getElementById("search-close");
      const applyBtn      = document.getElementById("search-apply"); // 決定ボタン

      const searchInput   = document.getElementById("search-input");
      const searchResults = document.getElementById("search-results"); // 使わないが、そのまま残してOK
      const seriesSelect  = document.getElementById("filter-series");
      const arcSelect     = document.getElementById("filter-arc");

      // ===== シリーズ / アークのプルダウン中身セット =====
      if (seriesSelect) {
        seriesSelect.innerHTML = `<option value="">全シリーズ</option>`;
        Object.values(seriesMap).forEach(s => {
          const opt = document.createElement("option");
          opt.value = s.id;        // "0"〜"9"
          opt.textContent = s.nameJa;
          seriesSelect.appendChild(opt);
        });
      }

      if (arcSelect) {
        arcSelect.innerHTML = `<option value="">全アーク</option>`;
        Object.entries(arcMap).forEach(([key, arc]) => {
          const opt = document.createElement("option");
          opt.value = key;         // "B","F",...
          opt.textContent = `${arc.icon} ${arc.name}`;
          arcSelect.appendChild(opt);
        });
      }

      // ===== 検索実行：カード一覧を絞り込み =====
      function runSearch() {
        const q = (searchInput?.value || "").trim().toLowerCase();
        const seriesFilter = seriesSelect?.value || "";
        const arcFilter    = arcSelect?.value || "";

        const filtered = originalOrder.filter(c => {
          const series = seriesMap[c.series];
          const exArc  = c.arc?.ex ? arcMap[c.arc.ex] : null;
          const coreArc= c.arc?.core ? arcMap[c.arc.core] : null;

          // シリーズ絞り込み
          if (seriesFilter && c.series !== seriesFilter) return false;

          // アーク絞り込み（exかcoreのどちらかが一致していればOK）
          if (arcFilter) {
            const exCode   = c.arc?.ex   || "";
            const coreCode = c.arc?.core || "";
            if (exCode !== arcFilter && coreCode !== arcFilter) return false;
          }

          // テキスト検索
          if (q) {
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
            ]
              .join(" ")
              .toLowerCase();

            if (!haystack.includes(q)) return false;
          }

          return true;
        });

        // 結果でカード一覧を差し替え
        currentList = filtered;
        renderList(currentList);

        // モーダルは閉じる
        if (overlay) {
          overlay.classList.remove("is-open");
        }

        // もう search-results は使わないので、空にしておく（任意）
        if (searchResults) {
          searchResults.innerHTML = "";
        }
      }

      // ===== 検索モーダル開く =====
      if (openBtn && overlay) {
        openBtn.addEventListener("click", () => {
          overlay.classList.add("is-open");

          // 開くたびに条件リセットしたい場合はここで
          if (searchInput)  searchInput.value = "";
          if (seriesSelect) seriesSelect.value = "";
          if (arcSelect)    arcSelect.value = "";

          if (searchResults) {
            searchResults.innerHTML = ""; // もう使っていないので空でOK
          }
        });
      }

      // ===== 決定ボタンで検索実行 =====
      if (applyBtn) {
        applyBtn.addEventListener("click", () => {
          runSearch();
        });
      }

      // ===== 閉じる系 =====
      if (closeBtn && overlay) {
        closeBtn.addEventListener("click", () => {
          overlay.classList.remove("is-open");
        });
      }

      if (overlay) {
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) {
            overlay.classList.remove("is-open");
          }
        });
      }
    })
    .catch(e => {
      console.error("読み込みエラー:", e);
    });
});
