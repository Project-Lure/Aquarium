document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    fetch("characters.json").then(r => r.json()),
    fetch("series.json").then(r => r.json())
  ]).then(([chars, seriesMap]) => {

    // タイトル読みでソート
    chars.sort((a, b) => {
      const ay = (a.titleYomi || a.title || "").toString();
      const by = (b.titleYomi || b.title || "").toString();
      return ay.localeCompare(by, "ja");
    });

    const container = document.getElementById("card-list");

    chars.forEach(c => {
      const imgPath = `images/characters/${c.code}.png`;
      const series = seriesMap[c.series];  // "0"〜"9" から取得

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
  }).catch(e => {
    console.error("読み込みエラー:", e);
  });
});

  // ==== ここから検索ポップアップ用 ====
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
