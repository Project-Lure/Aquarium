document.addEventListener("DOMContentLoaded", () => {
  // ===== キャラクターデータ読み込み =====
  Promise.all([
    fetch("data/characters.json").then(r => {
      if (!r.ok) {
        throw new Error("characters.json が読み込めませんでした");
      }
      return r.json();
    }),
    fetch("data/series.json").then(r => {
      if (!r.ok) {
        console.warn("series.json が読み込めませんでした (status:", r.status, ")");
        return {};
      }
      return r.json();
    }).catch(e => {
      console.warn("series.json 読み込みエラー:", e);
      return {};
    }),
    fetch("data/arcList.json").then(r => {
      if (!r.ok) {
        console.warn("arcList.json が読み込めませんでした (status:", r.status, ")");
        return {};
      }
      return r.json();
    }).catch(e => {
      console.warn("arcList.json 読み込みエラー:", e);
      return {};
    })
  ])
    .then(([chars, seriesMap, arcMap]) => {
      const container = document.getElementById("card-list");

      // 元の順番を保持（コード順＝JSON の順番）
      const originalOrder = [...chars];
      let currentList = [...originalOrder];
      let sortMode = "code"; // "code" or "title"

      // ===== 一覧描画用関数 =====
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

      // 初期表示：コード順（JSON の順番）
      renderList(currentList);

      // ===== 並び替えトグルボタン =====
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

      // ===== 検索まわり =====
      const overlay       = document.getElementById("search-overlay");
      const openBtn       = document.getElementById("search-open");
      const closeBtn      = document.getElementById("search-close");
      const searchInput   = document.getElementById("search-input");
      const searchResults = document.getElementById("search-results");
      const seriesSelect  = document.getElementById("filter-series");
      const arcSelect     = document.getElementById("filter-arc");

      // ▼ プルダウン中身のセット

      // シリーズ select：series.json から
      if (seriesSelect) {
        seriesSelect.innerHTML = `<option value="">全シリーズ</option>`;
        Object.values(seriesMap).forEach(s => {
          const opt = document.createElement("option");
          opt.value = s.id;           // "0"〜"9"
          opt.textContent = s.nameJa; // そまりものがたり 等
          seriesSelect.appendChild(opt);
        });
      }

      // アーク select：arcList.json から
      if (arcSelect) {
        arcSelect.innerHTML = `<option value="">全アーク</option>`;
        Object.entries(arcMap).forEach(([key, arc]) => {
          const opt = document.createElement("option");
          opt.value = key;                 // B / G / M / ...
          opt.textContent = `${arc.icon} ${arc.name}`;
          arcSelect.appendChild(opt);
        });
      }

      // ▼ 検索実行関数（テキスト＋シリーズ＋アーク）
      function runSearch() {
        if (!searchResults) return;

        const q = (searchInput?.value || "").trim().toLowerCase();
        const seriesFilter = seriesSelect?.value || "";
        const arcFilter = arcSelect?.value || "";

        searchResults.innerHTML = "";

        // 元データからフィルタ
        const filtered = originalOrder.filter(c => {
          const series = seriesMap[c.series];
          const exArc  = c.arc?.ex   ? arcMap[c.arc.ex]   : null;
          const coreArc= c.arc?.core ? arcMap[c.arc.core] : null;

          // シリーズ絞り込み
          if (seriesFilter && c.series !== seriesFilter) return false;

          // アーク絞り込み（ex / core どちらか一致）
          if (arcFilter) {
            const exCode   = c.arc?.ex   || "";
            const coreCode = c.arc?.core || "";
            if (exCode !== arcFilter && coreCode !== arcFilter) return false;
          }

          // テキスト検索がない場合はここまでで OK（シリーズ/アークだけで絞る）
          if (!q) return true;

          // テキスト検索対象
          const haystack = [
            c.code || "",
            c.title || "",
            c.titleYomi || "",
            c.mainColorLabel || "",
            ...(c.colors || []),

            // シリーズ情報
            c.series || "",
            series?.nameJa || "",
            series?.key || "",

            // アーク情報
            c.arc?.ex || "",
            c.arc?.core || "",
            exArc?.name || "",
            coreArc?.name || "",
            exArc?.icon || "",
            coreArc?.icon || ""
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(q);
        });

        if (filtered.length === 0) {
          searchResults.innerHTML = `<div>該当なし</div>`;
          return;
        }

        filtered.forEach(c => {
          const series = seriesMap[c.series];
          const item = document.createElement("a");
          item.href = `character.html?code=${c.code}`;
          item.className = "search-result-item";
          item.innerHTML = `
            <div class="search-result-code">${c.code}</div>
            <div class="search-result-title">${c.title}</div>
            <div class="search-result-series">
              ${series ? series.nameJa : ""}
            </div>
          `;
          searchResults.appendChild(item);
        });
      }

      // ▼ オーバーレイ開閉
      if (openBtn && overlay) {
        openBtn.addEventListener("click", () => {
          overlay.classList.add("is-open");

          // 開いた瞬間は「全件」を出す（ポケスリっぽく）
          if (searchInput) searchInput.value = "";
          if (seriesSelect) seriesSelect.value = "";
          if (arcSelect) arcSelect.value = "";
          runSearch();
        });
      }

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

      // ▼ 入力・選択で都度フィルタ
      if (searchInput) {
        searchInput.addEventListener("input", runSearch);
      }
      if (seriesSelect) {
        seriesSelect.addEventListener("change", runSearch);
      }
      if (arcSelect) {
        arcSelect.addEventListener("change", runSearch);
      }
    })
    .catch(e => {
      console.error("characters.json 側の読み込みエラー:", e);
    });
});
