// js/character.js
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) return;

  Promise.all([
    fetch("data/characters.json").then(r => r.json()),
    fetch("data/arcList.json").then(r => r.json()),
    fetch("data/series.json").then(r => r.json()),
    // links.json は無くても動くようにしておく
    fetch("data/links.json").then(r => r.json()).catch(() => ({}))
  ]).then(([chars, arcList, seriesMap, linksMap]) => {

    // 対象キャラ
    const c = chars.find(ch => ch.code === code);
    if (!c) return;

    // 画像パス（立ち絵カード）
    const imgPath = `images/characters/${c.code}.png`;

    // アーク
    const exArc   = c.arc?.ex   ? arcList[c.arc.ex]   : null;
    const coreArc = c.arc?.core ? arcList[c.arc.core] : null;

    // シリーズ
    const series = seriesMap[c.series];

    // ギャラリー用リンク
    const linkData = linksMap[c.code] || {};

    // ===== GALLERY HTMLを組み立て =====
    const buildGalleryGroup = (key, labelJa) => {
      const arr = linkData[key];
      if (!arr || !arr.length) return "";

      const items = arr.map(item => `
        <li class="char-gallery-item">
          <a href="${item.url}"
             target="_blank"
             rel="noopener noreferrer">
            ${item.label}
          </a>
        </li>
      `).join("");

      return `
        <section class="char-gallery-group">
          <h3 class="char-gallery-heading">${labelJa}</h3>
          <ul class="char-gallery-list">
            ${items}
          </ul>
        </section>
      `;
    };

    let galleryHtml =
      buildGalleryGroup("music", "Music") +
      buildGalleryGroup("novel", "Novel / Text") +
      buildGalleryGroup("video", "Movie / PV");

    if (!galleryHtml) {
      galleryHtml = `<p class="char-gallery-empty">関連コンテンツは準備中です。</p>`;
    }

    // ===== ページ全体を描画 =====
    const container = document.getElementById("character-content");
    if (!container) return;

    container.innerHTML = `
      <article class="char-page">

        <!-- 上段：カード ＋ 基本情報 -->
        <section class="char-hero">
          <div class="char-hero-card">
            <img src="${imgPath}"
                 alt="${c.title}"
                 class="char-hero-image">
          </div>

          <div class="char-hero-meta">
            <div class="char-hero-code">No.${c.code}</div>
            <h1 class="char-hero-title">${c.title}</h1>
            ${c.titleYomi ? `<div class="char-hero-yomi">${c.titleYomi}</div>` : ""}

            ${c.catchcopy ? `
              <p class="char-hero-catch">${c.catchcopy}</p>
            ` : ""}

            <div class="char-hero-tags">
              ${series ? `<span class="char-tag">シリーズ：${series.nameJa}</span>` : ""}
              ${c.theme ? `<span class="char-tag">テーマ：${c.theme}</span>` : ""}
              ${c.mainColorLabel ? `<span class="char-tag">メインカラー：${c.mainColorLabel}</span>` : ""}
            </div>
          </div>
        </section>

        <!-- 中段：INFORMATION -->
        <section class="char-section">
          <h2 class="char-section-title">INFORMATION</h2>

          <div class="char-info-grid">
            <div class="char-info-row">
              <div class="char-info-label">コード</div>
              <div class="char-info-value">${c.code}</div>
            </div>

            <div class="char-info-row">
              <div class="char-info-label">タイトル</div>
              <div class="char-info-value">${c.title}</div>
            </div>

            ${c.titleYomi ? `
            <div class="char-info-row">
              <div class="char-info-label">よみ</div>
              <div class="char-info-value">${c.titleYomi}</div>
            </div>
            ` : ""}

            ${series ? `
            <div class="char-info-row">
              <div class="char-info-label">シリーズ</div>
              <div class="char-info-value">${series.nameJa}</div>
            </div>
            ` : ""}

            ${c.theme ? `
            <div class="char-info-row">
              <div class="char-info-label">テーマ</div>
              <div class="char-info-value">${c.theme}</div>
            </div>
            ` : ""}

            ${c.mainColorLabel ? `
            <div class="char-info-row">
              <div class="char-info-label">メインカラー</div>
              <div class="char-info-value">${c.mainColorLabel}</div>
            </div>
            ` : ""}

            ${(c.colors && c.colors.length) ? `
            <div class="char-info-row">
              <div class="char-info-label">サブカラー</div>
              <div class="char-info-value">
                ${c.colors.join(" / ")}
              </div>
            </div>
            ` : ""}

            ${c.catchcopy ? `
            <div class="char-info-row">
              <div class="char-info-label">キャッチコピー</div>
              <div class="char-info-value">${c.catchcopy}</div>
            </div>
            ` : ""}

            <div class="char-info-row">
              <div class="char-info-label">エクスアーク</div>
              <div class="char-info-value">
                ${exArc
                  ? `<span class="arc-icon">${exArc.icon}</span> ${exArc.name}`
                  : "未設定"}
              </div>
            </div>

            <div class="char-info-row">
              <div class="char-info-label">コアアーク</div>
              <div class="char-info-value">
                ${coreArc
                  ? `<span class="arc-icon">${coreArc.icon}</span> ${coreArc.name}`
                  : "未設定"}
              </div>
            </div>

          </div>
        </section>

        <!-- 下段：GALLERY -->
        <section class="char-section">
          <h2 class="char-section-title">GALLERY</h2>
          ${galleryHtml}
        </section>

      </article>
    `;
  });
});
