document.addEventListener("DOMContentLoaded", () => {
  fetch("characters.json")
    .then(res => res.json())
    .then(chars => {
      const container = document.getElementById("card-list");
      console.log("loaded chars:", chars);

      chars.forEach(c => {

        // ★画像パスを自動生成する部分（これだけ覚えればOK）
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
});
