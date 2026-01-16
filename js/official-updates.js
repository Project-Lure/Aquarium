// js/official-updates.js
document.addEventListener('DOMContentLoaded', () => {
  const box = document.getElementById('official-update');
  if (!box) return;

  const JSON_URL = 'data/updates.json';

  const escapeHtml = (s) => String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const formatDateJP = (iso) => {
    // "YYYY-MM-DD" -> "YYYY.MM.DD"
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return escapeHtml(iso);
    return `${m[1]}.${m[2]}.${m[3]}`;
  };

  const buildItem = (item) => {
    const date = formatDateJP(item.date);
    const title = escapeHtml(item.title || '');
    const url = String(item.url || '').trim();

    const inner = `
      <div class="official-update__date">${date}</div>
      <div class="official-update__title">${title}</div>
    `;

    if (url) {
      return `<a class="official-update__item" href="${escapeHtml(url)}">${inner}</a>`;
    }
    return `<div class="official-update__item is-static">${inner}</div>`;
  };

  const render = (items) => {
    if (!items.length) {
      box.innerHTML = `<p class="official-update__empty">現在、更新情報はありません。</p>`;
      return;
    }

    box.innerHTML = `
      <div class="official-update__list">
        ${items.map(buildItem).join('')}
      </div>
    `;
  };

  (async () => {
    try {
      const res = await fetch(JSON_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('updates.json fetch failed');

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('updates.json is not array');

      // 日付降順にソートして上位10件（表示は好みで 5〜10 に調整）
      const sorted = data
        .slice()
        .filter(x => x && x.date && x.title)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

      const TOP_N = 8; // ←ここだけ変えれば表示数変更できる
      render(sorted.slice(0, TOP_N));
    } catch (e) {
      console.error(e);
      box.innerHTML = `<p class="official-update__error">更新情報を読み込めませんでした。</p>`;
    }
  })();
});