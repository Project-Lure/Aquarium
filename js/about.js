// js/about.js
document.addEventListener("DOMContentLoaded", () => {
  const arcListContainer   = document.querySelector("#about-arc .about-arc-list");
  const themeGridContainer = document.querySelector("#about-theme .about-theme-grid");

  // どちらのコンテナも存在しないなら何もしない
  if (!arcListContainer && !themeGridContainer) {
    console.warn("ABOUT: #about-arc .about-arc-list / #about-theme .about-theme-grid が見つかりません");
    return;
  }

  Promise.all([
    fetch("data/arcList.json").then(res => res.json()),
    fetch("data/series.json").then(res => res.json())
  ])
    .then(([arcMap, seriesMap]) => {

      // ===== アーク一覧 =====
      if (arcListContainer && arcMap) {
        const entries = Object.entries(arcMap).sort((a, b) =>
          a[0].localeCompare(b[0])
        );

        const arcHtml = entries.map(([code, arc]) => {
          if (!arc) return "";

          const icon = arc.icon || "";
          const name = arc.name || "";

          const kws = Array.isArray(arc.keywords) ? arc.keywords : [];
          const padded = [...kws, "", "", "", "", ""].slice(0, 6);

          const kwHtml = padded.map(kw =>
            kw
              ? `<span class="about-arc-tag">${kw}</span>`
              : `<span class="about-arc-tag"></span>`
          ).join("");

          return `
            <div class="about-arc-item">
              <div class="about-arc-item-header">
                <span class="arc-icon">${icon}</span>
                <span class="arc-name">${name}</span>
              </div>
              <div class="about-arc-keywords">
                ${kwHtml}
              </div>
            </div>
          `;
        }).join("");

        arcListContainer.innerHTML = arcHtml;
      }

      // ===== シリーズ一覧 =====
      if (themeGridContainer && seriesMap) {
        const entries = Object.entries(seriesMap).sort(
          (a, b) => Number(a[0]) - Number(b[0])
        );

        const themeHtml = entries.map(([rawId, s]) => {
          const id          = s.id ?? rawId;
          const key         = s.key || "";
          const nameJa      = s.nameJa || "";
          const description = s.description || "";
          const heading     = `${id}_${key}`;

          return `
            <div class="about-theme-item">
              <h3>
                ${heading}<br>
                <span class="about-theme-sub">${nameJa}</span>
              </h3>
              <p>${description}</p>
            </div>
          `;
        }).join("");

        themeGridContainer.innerHTML = themeHtml;
      }
    })
    .catch(err => {
      console.error("ABOUT ページ用データ読み込みエラー:", err);

      if (arcListContainer && !arcListContainer.innerHTML.trim()) {
        arcListContainer.innerHTML =
          "<p>アーク一覧の読み込みに失敗しました。</p>";
      }
      if (themeGridContainer && !themeGridContainer.innerHTML.trim()) {
        themeGridContainer.innerHTML =
          "<p>シリーズ一覧の読み込みに失敗しました。</p>";
      }
    });
});