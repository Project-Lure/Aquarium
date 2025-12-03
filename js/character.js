document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) return;

  Promise.all([
    fetch("data/characters.json").then(r => r.json()),
    fetch("data/arcList.json").then(r => r.json()),
    fetch("data/series.json").then(r => r.json()),
    // links.json は無くても動くようにしておく
    fetch("data/links.json").then(r => r.json()).catch(() => ({})),
    // synopsis.json も無くても落ちないように
    fetch("data/synopsis.json").then(r => r.json()).catch(() => ({}))
  ]).then(([chars, arcList, seriesMap, linksMap, synopsisMap]) => {

    // 対象キャラ
    const c = chars.find(ch => ch.code === code);
    if (!c) return;

    // ★ メインカラー（基本1色だけ使う想定）
    const mainColorHex = Array.isArray(c.colors)
      ? c.colors.find(Boolean)   // 先頭の truthy な色を1つ取る
      : null;

    // ★ ここで title を書き換える
    document.title = `${c.title} | ぎじえプロジェクト`;

    // 画像パス（立ち絵カード）
    const imgPath = `images/characters/${c.code}.png`;

    // アーク
    const exArc   = c.arc?.ex   ? arcList[c.arc.ex]   : null;
    const coreArc = c.arc?.core ? arcList[c.arc.core] : null;

    // シリーズ
    const series = seriesMap[c.series];

    // GALLERY 用リンク
    const linkData = linksMap[c.code] || {};

    // ===== STORY（あらすじ＋キーワード） =====
    const syn = synopsisMap[c.code] || {};
    const summaryRaw = syn.summary || "";
    const summaryHtml = summaryRaw
      ? summaryRaw.replace(/\n/g, "<br>")
      : "";

    const keywords = Array.isArray(syn.keywords) ? syn.keywords : [];
    const keywordsHtml = keywords.length
      ? `<ul class="char-keywords-list">
           ${keywords.map(w => `<li>${w}</li>`).join("")}
         </ul>`
      : "";

    const hasStoryBlock = summaryHtml || keywordsHtml;

    // ===== ページ全体を描画 =====
    const container = document.getElementById("character-content");
    if (!container) return;

    container.innerHTML = `
      <article class="char-page">

        <!-- 上部：一覧に戻るボタン -->
        <a href="index.html" class="char-back-btn">一覧に戻る</a>

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
              ${
                c.mainColorLabel
                  ? `
                    <span class="char-tag char-tag-maincolor">
                      メインカラー：${c.mainColorLabel}
                    </span>
                    `
                  : ""
              }
            </div>

            <!-- STORY ブロック（タイトルブロックと分割） -->
            ${hasStoryBlock ? `
              <div class="char-story-block">
                <h3 class="char-story-title">STORY</h3>
                ${summaryHtml ? `<p class="char-story-text">${summaryHtml}</p>` : ""}
                ${keywordsHtml}
              </div>
            ` : ""}
          </div>
        </section>

        <!-- 中段：INFORMATION -->
        <section class="char-section">
          <h2 class="char-section-title">INFORMATION</h2>
          <div class="char-info-grid"></div>
        </section>

        <!-- 下段：GALLERY -->
        <section class="char-section">
          <h2 class="char-section-title">GALLERY</h2>
          ${galleryHtml}
        </section>

        <!-- 下部：一覧に戻るボタン -->
        <a href="index.html" class="char-back-btn bottom">一覧に戻る</a>

      </article>
    `;

    // ★ 泡の色をキャラ色にする（ここだけでOK）
    if (mainColorHex) {
      // 例: "#ff6699" みたいな値が入る想定
      document.documentElement.style.setProperty("--char-main-color", mainColorHex);
    } else {
      // カラーコード無し → デフォルト（:root のアクセント色のまま）
      document.documentElement.style.removeProperty("--char-main-color");
    }

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
