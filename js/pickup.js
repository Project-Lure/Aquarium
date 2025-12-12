// js/pickup.js
// HOME以外では動かさない
document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('page-index')) return;

  const main = document.querySelector('.l-main');
  if (!main) return;

  // 必要JSONパス（synopsis は使わない）
  const CHAR_JSON_URL = 'data/characters.json';

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
    const chars = await fetchJson(CHAR_JSON_URL);
    if (!Array.isArray(chars)) return;

    // キャッチコピーがあるキャラだけを候補にする（全面押し出し方針）
    const pool = chars.filter(c => {
      return c && c.catchcopy && String(c.catchcopy).trim() !== '';
    });
    if (!pool.length) return;

    // ランダムに最大3件選択
    const picks = pickRandomN(pool, 3);
    if (!picks.length) return;

    // 1件分のカード HTML
    function buildCardHtml(c) {
      const title = (c.title || '').toString();
      const catchcopy = String(c.catchcopy || '').trim();
      const summaryForDisplay = catchcopy
        ? `〝${catchcopy.replace(/[〝〟]/g, '')}〟`
        : '';

      const detailUrl = `character.html?code=${encodeURIComponent(c.code)}`;
      const thumbPath = `images/characters/${c.code}.png`;

      return `
        <div class="pickup-card">
          <a href="${detailUrl}" class="pickup-card-link">
            <div class="pickup-inner">
              <div class="pickup-thumb">
                <img src="${thumbPath}" alt="${title}" class="pickup-thumb-img">
              </div>

              <div class="pickup-main">
                <div class="pickup-title-row">
                  <span class="pickup-title">${title}</span>
                </div>

                ${summaryForDisplay ? `<p class="pickup-summary">${summaryForDisplay}</p>` : ''}
              </div>
            </div>
          </a>
        </div>
      `;
    }

    // 全カード HTML
    const cardsHtml = picks.map(buildCardHtml).join('');

    // ドット HTML
    const dotsHtml = `
      <div class="pickup-dots">
        ${picks
          .map((_, i) =>
            `<button type="button" class="pickup-dot" data-index="${i}" aria-label="ピックアップ ${i + 1}"></button>`
          )
          .join('')}
      </div>
    `;

    // セクション HTML
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

    const section = document.getElementById('pickup-section');
    const track   = section.querySelector('.pickup-track');
    const cards   = Array.from(section.querySelectorAll('.pickup-card'));
    const dots    = Array.from(section.querySelectorAll('.pickup-dot'));

    // 画像404時はプレースホルダに差し替え（リンクは残す方針）
    const imgs = section.querySelectorAll('.pickup-thumb-img');
    imgs.forEach(img => {
      img.addEventListener('error', () => {
        img.src = 'images/ui/card-placeholder.png';
      });
    });

    // アクティブ更新
    function setActive(index) {
      cards.forEach((card, i) => card.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    }

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

    // 初期状態：1枚目を基準にして、横方向だけ中央寄せ（縦スクロールはいじらない）
    if (cards.length > 0 && track) {
      const initialIndex = 0;
      setActive(initialIndex);

      requestAnimationFrame(() => {
        const trackRect = track.getBoundingClientRect();
        const cardRect  = cards[initialIndex].getBoundingClientRect();

        const trackCenter = trackRect.left + trackRect.width / 2;
        const cardCenter  = cardRect.left  + cardRect.width  / 2;
        const delta = cardCenter - trackCenter;

        track.scrollLeft += delta;

        updateActiveByScroll();

        // ready フラグ：CSS側で拡大演出などをここから許可
        section.classList.add('pickup-ready');
      });
    }

    // スクロール時：中央カードを更新
    let scrollTimer = null;
    track.addEventListener('scroll', () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateActiveByScroll, 80);
    });

    // ドットクリック：対応カードを中央に
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

    // 閉じる
    const closeBtn = section.querySelector('.pickup-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        section.remove();
      });
    }
  })();
});
