document.addEventListener("DOMContentLoaded", () => {
  // 一覧カード生成（あなたの既存コード）
  fetch("characters.json")
    .then(res => res.json())
    .then(chars => {
      const container = document.getElementById("card-list");

      chars.forEach(c => {
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
              <div class="card-code">${c.code}</div>
              <div class="card-title">${c.title}</div>
            </div>
          </div>
        `;
        container.appendChild(a);
      });
    })
    .catch(e => {
      console.error("読み込みエラー:", e);
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
