document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  // characters.json と arcList.json をまとめて読み込む
  Promise.all([
    fetch("data/characters.json").then(r => r.json()),
    fetch("data/arcList.json").then(r => r.json())
  ]).then(([chars, arcList]) => {

    // code に一致するキャラを探す
    const c = chars.find(ch => ch.code === code);
    if (!c) return;

    // ★ 画像パスをコードから自動生成（imageUrl は使わない）
    const imgPath = `images/characters/${c.code}.png`;

    // arc 情報（空なら undefined になる）
    const exArc = c.arc.ex ? arcList[c.arc.ex] : null;
    const coreArc = c.arc.core ? arcList[c.arc.core] : null;

    const container = document.getElementById("character-content");

    container.innerHTML = `
      <h1>${c.code} ${c.title}</h1>

      <div class="char-image-wrapper">
        <img src="${imgPath}" alt="${c.title}" class="char-image">
      </div>

      <section class="arc-section">

        <div class="arc-row">
          <span class="arc-label">エクスアーク:</span>
          ${exArc ? `
            <span class="arc-icon">${exArc.icon}</span>
            <span class="arc-name">${exArc.name}</span>
          ` : `<span class="arc-name">未設定</span>`}
        </div>

        <div class="arc-row">
          <span class="arc-label">コアアーク:</span>
          ${coreArc ? `
            <span class="arc-icon">${coreArc.icon}</span>
            <span class="arc-name">${coreArc.name}</span>
          ` : `<span class="arc-name">未設定</span>`}
        </div>

      </section>
    `;
  });
});
