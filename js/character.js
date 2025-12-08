// js/character.js

// YouTube の URL から動画 ID を抜き出すユーティリティ
function extractYouTubeId(url) {
  if (!url) return "";

  try {
    const u = new URL(url);

    // youtu.be/XXXXXXXXXXX
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "") || "";
    }

    // youtube.com/watch?v=XXXXXXXXXXX
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;

      // youtube.com/embed/XXXXXXXXXXX など
      const segments = u.pathname.split("/").filter(Boolean);
      const embedIndex = segments.indexOf("embed");
      if (embedIndex >= 0 && segments[embedIndex + 1]) {
        return segments[embedIndex + 1];
      }
    }

    // うまくいかなかったとき用の簡易正規表現
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([0-9A-Za-z_-]{6,})/);
    return m ? m[1] : "";
  } catch (e) {
    const m = String(url).match(/(?:v=|youtu\.be\/|embed\/)([0-9A-Za-z_-]{6,})/);
    return m ? m[1] : "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) return;

  Promise.all([
    fetch("data/characters.json").then(r => r.json()),
    fetch("data/arcList.json").then(r => r.json()),
    fetch("data/series.json").then(r => r.json()),
    // links.json は無くても動くように
    fetch("data/links.json").then(r => r.json()).catch(() => ({})),
    // synopsis.json も無くても落ちないように
    fetch("data/synopsis.json").then(r => r.json()).catch(() => ({}))
  ])
    .then(([chars, arcList, seriesMap, linksMap, synopsisMap]) => {

      // 対象キャラの取得
      const c = chars.find(ch => ch.code === code);
      if (!c) return;

      // メインカラー（colors の先頭を採用）
      const mainColorHex = Array.isArray(c.colors)
        ? c.colors.find(Boolean)
        : null;

      // ページタイトル書き換え
      document.title = `${c.title} | ぎじえプロジェクト`;

      // 立ち絵画像パス
      const imgPath = `images/characters/${c.code}.png`;

      // アーク
      const exArc   = c.arc?.ex   ? arcList[c.arc.ex]   : null;
      const coreArc = c.arc?.core ? arcList[c.arc.core] : null;

      // シリーズ
      const series = seriesMap[c.series];

      // GALLERY / MV 用リンク
      const linkData = linksMap[c.code] || {};
      const musicArr = Array.isArray(linkData.music) ? linkData.music : [];
      const videoArr = Array.isArray(linkData.video) ? linkData.video : [];

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

      // ===== GALLERY HTML を組み立て =====
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

      // ===== MV 埋め込み用 HTML =====
      // 優先度：
      // 1) music 配列の中で embed:true のもの
      // 2) なければ video 配列の中で embed:true のもの
      let mvSectionHtml = "";
      let mvItem = null;

      if (musicArr.length) {
        mvItem = musicArr.find(v => v.embed);
      }
      if (!mvItem && videoArr.length) {
        mvItem = videoArr.find(v => v.embed);
      }

      if (mvItem && mvItem.url) {
        const mvId = extractYouTubeId(mvItem.url);

        if (mvId) {
          const caption = mvItem.label || `${c.title} - Music Video`;

          mvSectionHtml = `
<section class="section-card char-section char-mv-section">
  <h2 class="char-section-title">MUSIC VIDEO</h2>
  <div class="char-mv-body">
    <div class="char-mv-frame">
      <iframe
        src="https://www.youtube.com/embed/${mvId}"
        title="${caption}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
    </div>
    <p class="char-mv-caption">
      「${caption}」の MV です。<br>
      フルサイズは YouTube でもご覧いただけます。
    </p>
  </div>
</section>
`;
        }
      }

      // ===== ページ本体描画 =====
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
              <p class="char-hero-catch">〝${c.catchcopy}〟</p>
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

        <!-- 中段：INFORMATION（★カード枠を付与） -->
        <section class="section-card char-section">
          <h2 class="char-section-title">INFORMATION</h2>
          <div class="char-info-grid"></div>
        </section>

        <!-- MV セクション（あれば挿入） -->
        ${mvSectionHtml}

        <!-- 下段：GALLERY（★同じくカード枠を付与） -->
        <section class="section-card char-section">
          <h2 class="char-section-title">GALLERY</h2>
          ${galleryHtml}
        </section>

        <!-- 下部：一覧に戻るボタン -->
        <a href="index.html" class="char-back-btn bottom">一覧に戻る</a>

      </article>
    `;

      // 立ち絵画像の 404 対応（プレースホルダに差し替え）
      const heroImg = container.querySelector(".char-hero-image");
      if (heroImg) {
        heroImg.addEventListener("error", () => {
          heroImg.src = "images/ui/card-placeholder.png";
        });
      }

      // 泡エフェクト用の CSS 変数を設定
      if (mainColorHex) {
        document.documentElement.style.setProperty("--char-main-color", mainColorHex);
      } else {
        // カラーコード無し → デフォルト（:root のアクセント色のまま）
        document.documentElement.style.removeProperty("--char-main-color");
      }

      // ===== INFORMATION（左：色／右：アーク） =====
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
    })
    .catch(err => {
      console.error("キャラページ読み込みエラー:", err);
    });
});