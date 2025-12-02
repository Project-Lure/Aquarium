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

    // ★ ここで title を書き換える
    document.title = `${c.title} | ぎじえプロジェクト`;

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

        <!-- 中段：INFORMATION（中身は後で JS で埋める） -->
        <section class="char-section">
          <h2 class="char-section-title">INFORMATION</h2>
          <div class="char-info-grid"></div>
        </section>

        <!-- 下段：GALLERY -->
        <section class="char-section">
          <h2 class="char-section-title">GALLERY</h2>
          ${galleryHtml}
        </section>

      </article>
    `;

    // ===== INFORMATION の4項目を生成 =====
    // ===== INFORMATION の4項目を生成（左：色／右：アーク） =====
    const colorRows = [
      {
        label: "メインカラー",
        value: c.mainColorLabel || "―",
      },
      {
        label: "カラーコード",
        value: (c.colors && c.colors.filter(Boolean).join(" / ")) || "―",
      }
    ];

    const arcRows = [
      {
        label: "エクスアーク",
        value: exArc ? `${exArc.icon} ${exArc.name}` : "未設定",
      },
      {
        label: "コアアーク",
        value: coreArc ? `${coreArc.icon} ${coreArc.name}` : "未設定",
      }
    ];

    const infoGrid = container.querySelector(".char-info-grid");
    if (infoGrid) {
      const colHtml = (rows) => rows.map(row => `
        <div class="char-info-row">
          <div class="char-info-label">${row.label}</div>
          <div class="char-info-value">${row.value}</div>
        </div>
      `).join("");

      infoGrid.innerHTML = `
        <div class="char-info-col">
          ${colHtml(colorRows)}
        </div>
        <div class="char-info-col">
          ${colHtml(arcRows)}
        </div>
      `;
    }
  });
});
