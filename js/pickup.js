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

  // 配列から重複なしで最大 n 件ランダムに取り出す
  function pickRandomN(arr, n) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
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

    // ランダムに最大3件選択
    const picks = pickRandomN(pool, 3);
    if (!picks.length) return;

    // 1件分のカード HTML を組み立てるヘルパー
    function buildCardHtml(c) {
      // シリーズ
      const series = seriesMap[c.series];

      // アーク
      const exArc   = c.arc && c.arc.ex   ? arcMap[c.arc.ex]   : null;
      const coreArc = c.arc && c.arc.core ? arcMap[c.arc.core] : null;

      // アーク表示用テキスト（emoji + 日本語名）
      const formatArc = (a) =>
        a ? `${a.icon || ''} ${a.name || ''}` : '';

      let arcLine = '';
      if (exArc && coreArc) {
        arcLine = `${formatArc(exArc)} / ${formatArc(coreArc)}`;
      } else if (exArc) {
        arcLine = formatArc(exArc);
      } else if (coreArc) {
        arcLine = formatArc(coreArc);
      }

      // 説明テキスト（キャッチコピー優先 → synopsis の1行目）
      let summary = '';
      if (c.catchcopy && String(c.catchcopy).trim() !== '') {
        summary = String(c.catchcopy).trim();
      } else {
        const syn = synopsisMap[c.code];
        if (syn && syn.summary) {
          summary = String(syn.summary).split('\n')[0].trim();
        }
      }

      // 〝〟が元から入っていたら除去して二重にならないようにする
      const summaryForDisplay = summary
        ? `〝${summary.replace(/[〝〟]/g, '')}〟`
        : '';

      // 詳細ページURL
      const detailUrl = `character.html?code=${encodeURIComponent(c.code)}`;

      // サムネ画像
      const thumbPath = `images/characters/${c.code}.png`;

      return `
        <div class="pickup-card">
          <div class="pickup-inner">
            <div class="pickup-thumb">
              <a href="${detailUrl}">
                <img src="${thumbPath}" alt="${c.title}" class="pickup-thumb-img">
              </a>
            </div>

            <div class="pickup-main">
              <div class="pickup-title-row">
                <span class="pickup-code">No.${c.code}</span>
                <a href="${detailUrl}" class="pickup-title">${c.title}</a>
              </div>

              <div class="pickup-meta">
                ${series ? `<span class="pickup-series">シリーズ：${series.nameJa}</span>` : ''}
                ${c.theme ? `<span class="pickup-theme">テーマ：${c.theme}</span>` : ''}
              </div>

              ${arcLine ? `<div class="pickup-arc-row">${arcLine}</div>` : ''}

              ${
                summaryForDisplay
                  ? `<p class="pickup-summary">${summaryForDisplay}</p>`
                  : ''
              }

              <a href="${detailUrl}" class="pickup-cta">キャラ詳細を見る</a>
            </div>
          </div>
        </div>
      `;
    }

    // 全カード HTML
    const cardsHtml = picks.map(buildCardHtml).join('');

    // ドット HTML
    const dotsHtml = `
      <div class="pickup-dots">
        ${picks
          .map(
            (_c, i) =>
              `<button type="button" class="pickup-dot" data-index="${i}" aria-label="ピックアップ ${i + 1}"></button>`
          )
          .join('')}
      </div>
    `;

    // セクション HTML 全体
    const pickupHtml = `
<section class="section-card pickup-section" id="pickup-section">
  <button type="button" class="pickup-close-btn" aria-label="ピックアップを閉じる">×</button>

  <div class="pickup-label">PICKUP</div>

  <div class="pickup-track">
    ${cardsHtml}
  </div>

  ${dotsHtml}
</section>
`;

    // main の先頭に差し込む
    main.insertAdjacentHTML('afterbegin', pickupHtml);

    const section   = document.getElementById('pickup-section');
    const track     = section.querySelector('.pickup-track');
    const cards     = Array.from(section.querySelectorAll('.pickup-card'));
    const dots      = Array.from(section.querySelectorAll('.pickup-dot'));

    // 画像404時はプレースホルダに差し替え
    const imgs = section.querySelectorAll('.pickup-thumb-img');
    imgs.forEach(img => {
      img.addEventListener('error', () => {
        img.src = 'images/ui/card-placeholder.png';
      });
    });

    // アクティブ状態の更新
    function setActive(index) {
      cards.forEach((card, i) => {
        card.classList.toggle('is-active', i === index);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
      });
    }

    // スクロール位置から「中央のカード」を判定
    function updateActiveByScroll() {
      if (!track) return;
      const trackRect = track.getBoundingClientRect();
      const centerX = trackRect.left + trackRect.width / 2;

      let closestIndex = 0;
      let minDist = Infinity;

      cards.forEach((card, idx) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const dist = Math.abs(cardCenter - centerX);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = idx;
        }
      });

      setActive(closestIndex);
    }

    // 初期状態：真ん中のカードを中央付近に寄せる（縦スクロールはいじらない）
    if (cards.length > 0 && track) {
      const initialIndex = Math.floor(cards.length / 2);
      setActive(initialIndex);

      setTimeout(() => {
        const trackRect = track.getBoundingClientRect();
        const cardRect  = cards[initialIndex].getBoundingClientRect();

        const trackCenter = trackRect.left + trackRect.width / 2;
        const cardCenter  = cardRect.left  + cardRect.width  / 2;

        const delta = cardCenter - trackCenter;

        // 横方向だけ調整
        track.scrollLeft += delta;
        updateActiveByScroll();
      }, 0);
    }

    // スクロール時：中央カードを更新
    let scrollTimer = null;
    track.addEventListener('scroll', () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        updateActiveByScroll();
      }, 80);
    });

    // ドットクリック → 対応するカードを中央にスクロール
    dots.forEach(dot => {
      const idx = Number(dot.dataset.index || '0') || 0;
      dot.addEventListener('click', () => {
        if (!cards[idx]) return;

        const trackRect = track.getBoundingClientRect();
        const cardRect  = cards[idx].getBoundingClientRect();
        const trackCenter = trackRect.left + trackRect.width / 2;
        const cardCenter  = cardRect.left  + cardRect.width  / 2;
        const delta = cardCenter - trackCenter;

        track.scrollLeft += delta;
      });
    });

    // 閉じるボタン
    const closeBtn = section.querySelector('.pickup-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        section.remove();
      });
    }
  })();
});