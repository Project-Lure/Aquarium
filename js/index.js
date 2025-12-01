document.addEventListener("DOMContentLoaded", () => {
  // ===== キャラクターデータ読み込み =====
  Promise.all([
    fetch("data/characters.json").then(r => {
      if (!r.ok) {
        throw new Error("characters.json が読み込めませんでした");
      }
      return r.json();
    }),
    // series.json は将来の検索用。失敗しても空オブジェクトで続行する
    fetch("data/series.json")
      .then(r => {
        if (!r.ok) {
          console.warn("series.json が読み込めませんでした (status:", r.status, ")");
          return {};
        }
        return r.json();
      })
      .catch(e => {
        console.warn("series.json 読み込みエラー:", e);
        return {};
      })
  ])
    .then(([chars, seriesMap]) => {
      console.log("chars:", chars);
      console.log("seriesMap:", seriesMap);

      const container = document.getElementById("card-list");

      // 元の順番を保持（コード順＝JSON に書いた順）
      const originalOrder = [...chars];
      let currentList = [...originalOrder];
      let sortMode = "code"; // "code" or "title"

      // 一覧描画用の関数
      function renderList(list) {
        container.innerHTML = ""; // 一旦クリア

        list.forEach(c => {
          const imgPath = `images/characters/${c.code}.png`;

          const a = document.createElement("a");
          a.href = `character.html?code=${c.code}`;
          a.className = "card";

          // 検索や絞り込み用に、コードやシリーズは data-* 属性に残しておく
          a.dataset.code = c.code;
          if (c.series != null) {
            a.dataset.series = c.series;
          }

          a.innerHTML = `
            <div class="card-inner">
              <div class="card-image">
                <img src="${imgPath}" alt="${c.title}">
              </div>
              <div class="card-meta">
                <div class="card-title">${c.title || c.code}</div>
              </div>
            </div>
          `;
          container.appendChild(a);
        });
      }

      // 初期表示：コード順（JSON の順番）
      renderList(currentList);

      // ===== 並び替えボタン（ヘッダー右の1個） =====
      const sortToggleBtn = document.getElementById("sort-open");

      if (sortToggleBtn) {
        // 最初のラベル
        sortToggleBtn.textContent = "タイトル順";

        sortToggleBtn.addEventListener("click", () => {
          if (sortMode === "code") {
            // タイトル読みでソート（読みがないときは title）
            currentList = [...originalOrder].sort((a, b) => {
              const ay = (a.titleYomi || a.title || "").toString();
              const by = (b.titleYomi || b.title || "").toString();
              return ay.localeCompare(by, "ja");
            });
            sortMode = "title";
            sortToggleBtn.textContent = "コード順";
          } else {
            // コード順（元の順番に戻す）
            currentList = [...originalOrder];
            sortMode = "code";
            sortToggleBtn.textContent = "タイトル順";
          }
          renderList(currentList);
        });
      }
    })
    .catch(e => {
      console.error("characters.json 側の読み込みエラー:", e);
    });

  // ===== ここから検索ポップアップ用 =====
  const overlay = document.getElementById("search-overlay");
  const openBtn = document.getElementById("search-open");
  const closeBtn = document.getElementById("search-close");

  if (openBtn && overlay) {
    openBtn.addEventListener("click", () => {
      overlay.classList.add("is-open");
    });
  }

  if (closeBtn && overlay) {
    closeBtn.addEventListener("click", () => {
      overlay.classList.remove("is-open");
    });
  }

  // オーバーレイの黒い部分をクリックしたら閉じる
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("is-open");
      }
    });
  }
});
