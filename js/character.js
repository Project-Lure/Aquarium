document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  // characters.json と arcList.json をまとめて読む
  Promise.all([
    fetch("characters.json").then(r => r.json()),
    fetch("arcList.json").then(r => r.json())
  ]).then(([chars, arcList]) => {
    const c = chars.find(ch => ch.code === code);
    if (!c) return;

    const exArc = arcList[c.arc.ex];
    const coreArc = arcList[c.arc.core];

    const container = document.getElementById("character-content");
    container.innerHTML = `
      <h1>${c.code} ${c.title}</h1>
      <img src="${c.imageUrl}" alt="${c.title}" class="char-image">

      <section class="arc-section">
        <div class="arc-row">
          <span class="arc-label">エクスアーク:</span>
          <span class="arc-icon">${exArc.icon}</span>
          <span class="arc-name">${exArc.name}</span>
        </div>
        <div class="arc-row">
          <span class="arc-label">コアアーク:</span>
          <span class="arc-icon">${coreArc.icon}</span>
          <span class="arc-name">${coreArc.name}</span>
        </div>
      </section>
    `;
  });
});