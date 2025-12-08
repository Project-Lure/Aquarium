// js/pickup.js

// HOME以外では動かさない
document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('page-index')) return;

  const main = document.querySelector('.l-main');
  if (!main) return;

  // 必要JSONパス
  const CHAR_JSON_URL   = 'data/characters.json';
  const ARC_JSON_URL    = 'data/arcList.json';
  const SERIES_JSON_URL = 'data/series.json';
  const SYN_JSON_URL    = 'data/synopsis.json';

  // 共通 fetch ヘルパー
  async function fetchJson(url) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('pickup fetch error:', url, e);
      return null;
    }
  }

  (async () => {
    const [chars, arcMap, seriesMap, synopsisMapRaw] = await Promise.all([
      fetchJson(CHAR_JSON_URL),
      fetchJson(ARC_JSON_URL),
      fetchJson(SERIES_JSON_URL),
      // synopsis.json は存在しない可能性もあるので失敗しても無視
      fetchJson(SYN_JSON_URL).catch(() => null)
    ]);

    const synopsisMap = synopsisMapRaw || {};

    if (!Array.isArray(chars) || !arcMap || !seriesMap) {
      // キャラ一覧 or マスタが取れない場合は何もしない
      return;
    }

    // 「紹介文を出せるキャラ」を優先
    const withText = chars.filter(c => {
      if (c.catchcopy && String(c.catchcopy).trim() !== '') return true;
      const syn = synopsisMap[c.code];
      return syn && syn.summary && String(syn.summary).trim() !== '';
    });

    const pool = withText.length ? withText : chars;
    if (!pool.length) return;

    // ランダムに1件選択
    const pick = pool[Math.floor(Math.random() * pool.length)];

    // シリーズ名
    const series = seriesMap[pick.series];

    // アーク
    const exArc   = pick.arc && pick.arc.ex ? arcMap[pick.arc.ex]   : null;
    const coreArc = pick.arc && pick.arc.core ? arcMap[pick.arc.core] : null;

    // アーク表示用テキスト
    let arcLine = '';
    const formatArc = (a) => a ? `${a.icon || ''} ${a.name || ''}` : '';

    if (exArc && coreArc) {
      arcLine = `${formatArc(exArc)} / ${formatArc(coreArc)}`;
    } else if (exArc) {
      arcLine = formatArc(exArc);
    } else if (coreArc) {
      arcLine = formatArc(coreArc);
    }

    // 説明テキスト（キャッチコピー優先 → synopsis の1行目）
    let summary = '';
    if (pick.catchcopy && String(pick.catchcopy).trim() !== '') {
      summary = String(pick.catchcopy).trim();
    } else {
      const syn = synopsisMap[pick.code];
      if (syn && syn.summary) {
        summary = String(syn.summary).split('\n')[0].trim();
      }
    }

    // 詳細ページURL（必要に応じてファイル名だけ変更）
    const detailUrl = `character.html?code=${encodeURIComponent(pick.code)}`;

    // サムネ画像（なければ自動でプレースホルダに差し替え）
    const thumbPath = `images/characters/${pick.code}.png`;

    // カードHTMLを生成
    const pickupHtml = `
<section class="section-card pickup-section" id="pickup-section">
  <button type="button" class="pickup-close-btn" aria-label="ピックアップを閉じる">×</button>

  <div class="pickup-label">PICKUP</div>

  <div class="pickup-inner">
    <div class="pickup-thumb">
      <a href="${detailUrl}">
        <img src="${thumbPath}" alt="${pick.title}" class="pickup-thumb-img">
      </a>
    </div>

    <div class="pickup-main">
      <div class="pickup-title-row">
        <span class="pickup-code">No.${pick.code}</span>
        <a href="${detailUrl}" class="pickup-title">${pick.title}</a>
      </div>

      <div class="pickup-meta">
        ${series ? `<span class="pickup-series">シリーズ：${series.nameJa}</span>` : ''}
        ${pick.theme ? `<span class="pickup-theme">テーマ：${pick.theme}</span>` : ''}
      </div>

      ${arcLine ? `<div class="pickup-arc-row">${arcLine}</div>` : ''}

      ${summary ? `<p class="pickup-summary">${summary}</p>` : ''}

      <a href="${detailUrl}" class="pickup-cta">キャラ詳細を見る</a>
    </div>
  </div>
</section>
`;

    // main の先頭に差し込む
    main.insertAdjacentHTML('afterbegin', pickupHtml);

    // 画像404時はプレースホルダに差し替え
    const img = document.querySelector('#pickup-section .pickup-thumb-img');
    if (img) {
      img.addEventListener('error', () => {
        img.src = 'images/ui/card-placeholder.png';
      });
    }

    // 閉じるボタン
    const closeBtn = document.querySelector('#pickup-section .pickup-close-btn');
    const section  = document.getElementById('pickup-section');
    if (closeBtn && section) {
      closeBtn.addEventListener('click', () => {
        section.remove();
      });
    }
  })();
});