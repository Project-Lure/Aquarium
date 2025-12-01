document.addEventListener("DOMContentLoaded", () => {
  // ===== キャラクターデータ読み込み =====
  Promise.all([
    fetch("characters.json").then(r => r.json()),
    fetch("series.json").then(r => r.json())
  ])
    .then(([chars, seriesMap]) => {
      const container = document.getElementById("card-list");

      // 元の順番を保持しておく（コード順＝JSONに書いた順）
      const originalOrder = [...chars];
      let currentList = [...originalOrder]; // 今表示しているリスト
      let sortMode = "code";                // "code" or "title"

      // 一覧描画用の関数
      function renderList(list) {
        container.innerHTML = ""; // 一旦クリア

        list.forEach(c => {
          const imgPath = `images/characters/${c.code}.png`;
          const series = seriesMap[c.series]; // "0"〜"9"

          const a = document.createElement("a");
          a.href = `character.html?code=${c.code}`;
          a.className = "card";
          a.innerHTML = `
            <div class="card-inner">
              <div class="card-image">
                <img src="${imgPath}" alt="${c.title}">
              </div>
              <div class="card-meta">
                <div class="card-code">${c.code}</div>
                <div class="card-title">${c.title}</div>
                <div class="card-series">
                  ${series ? series.nameJa : ""}
                </div>
              </div>
            </div>
          `;
          container.appendChild(a);
        });
      }

      // 初期表示：コード順（＝JSONの順番）
      renderList(currentList);

      // ===== 並び替えボタン（ヘッダー右の1個だけ） =====
      const sortToggleBtn = document.getElementById("sort-open");

      if (sortToggleBtn) {
        // 初期表示のラベル（お好みで調整）
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
            sortToggleBtn.textContent = "コード順";  // 押すとコード順に戻せるようにラベル変更
          } else {
            // コード順（元の順番に戻す）
            currentList = [...originalOrder];
            sortMode = "code";
            sortToggleBtn.textContent = "タイトル順";
          }
          renderList(currentList);
        });
      }

      // ===== （検索機能を実装するなら、ここで currentList / originalOrder を使う） =====
      // 例：検索は originalOrder を基準にフィルタして renderList(filtered) を呼ぶ
    })
    .catch(e => {
      console.error("読み込みエラー:", e);
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
