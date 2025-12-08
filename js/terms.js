// js/terms.js

document.addEventListener('DOMContentLoaded', () => {
  const ARC_JSON_URL = 'data/arcList.json';
  const SERIES_JSON_URL = 'data/series.json';

  const arcListContainer = document.getElementById('arc-list');
  const seriesListContainer = document.getElementById('series-list');

  // コンテナが無ければ何もしない
  if (!arcListContainer || !seriesListContainer) {
    console.warn('Terms: id="arc-list" / id="series-list" が見つかりません。');
    return;
  }

  // 共通 fetch ヘルパー
  async function fetchJson(url) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) {
        console.error(`Terms: ${url} の読み込みに失敗しました (status: ${res.status})`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error(`Terms: ${url} の読み込み時にエラーが発生しました`, err);
      return null;
    }
  }

  // ========== アーク一覧描画 ==========
  function renderArcs(arcData) {
    // arcData: { "B": { icon, name, eng, keywords:[] }, ... }
    const keys = Object.keys(arcData);
    // JSONの記述順をそのまま使う

    const frag = document.createDocumentFragment();

    keys.forEach(arcKey => {
      const arc = arcData[arcKey];
      if (!arc) return;

      const card = document.createElement('div');
      card.className = 'info-card about-arc-item';

      // ---- ヘッダー（アイコン＋名前） ----
      const header = document.createElement('div');
      header.className = 'about-arc-item-header';

      const iconSpan = document.createElement('span');
      iconSpan.className = 'arc-icon';
      iconSpan.textContent = arc.icon || '';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'arc-name';
      // ★ () 内を key ではなく eng に変更
      // 例: 「ブレイズ（Blaze）」の表記
      const eng = arc.eng || '';
      nameSpan.textContent = eng
        ? `${arc.name || ''}（${eng}）`
        : (arc.name || '');

      header.appendChild(iconSpan);
      header.appendChild(nameSpan);

      // ---- キーワード部分 ----
      const keywordsWrap = document.createElement('div');
      keywordsWrap.className = 'about-arc-keywords';

      if (Array.isArray(arc.keywords)) {
        arc.keywords.forEach(kw => {
          const kwSpan = document.createElement('span');
          kwSpan.className = 'about-arc-tag';
          kwSpan.textContent = kw;
          keywordsWrap.appendChild(kwSpan);
        });
      }

      card.appendChild(header);
      card.appendChild(keywordsWrap);
      frag.appendChild(card);
    });

    // CSS で .about-arc-list が用意されているので、それをラッパーに使う
    const wrapper = document.createElement('div');
    wrapper.className = 'about-arc-list';
    wrapper.appendChild(frag);

    arcListContainer.innerHTML = '';
    arcListContainer.appendChild(wrapper);
  }

  // ========== シリーズ一覧描画 ==========
  function renderSeries(seriesData) {
    // seriesData: { "0": {...}, "1": {...}, ... }
    const ids = Object.keys(seriesData).sort((a, b) => Number(a) - Number(b));

    const frag = document.createDocumentFragment();

    ids.forEach(id => {
      const s = seriesData[id];
      if (!s) return;

      const card = document.createElement('div');
      card.className = 'info-card about-theme-item';

      const title = document.createElement('h3');
      // 例: 「0_Occupation / そまりものがたり」
      title.textContent = `${s.id}_${s.key} / ${s.nameJa}`;

      const sub = document.createElement('p');
      sub.className = 'about-theme-sub';
      sub.textContent = s.description || '';

      card.appendChild(title);
      card.appendChild(sub);
      frag.appendChild(card);
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'about-theme-grid';
    wrapper.appendChild(frag);

    seriesListContainer.innerHTML = '';
    seriesListContainer.appendChild(wrapper);
  }

  // ========== メイン処理 ==========
  (async () => {
    const [arcData, seriesData] = await Promise.all([
      fetchJson(ARC_JSON_URL),
      fetchJson(SERIES_JSON_URL)
    ]);

    if (arcData) {
      renderArcs(arcData);
    } else {
      arcListContainer.innerHTML =
        '<p style="font-size:12px; color:var(--text-muted);">アーク一覧を読み込めませんでした。</p>';
    }

    if (seriesData) {
      renderSeries(seriesData);
    } else {
      seriesListContainer.innerHTML =
        '<p style="font-size:12px; color:var(--text-muted);">シリーズ一覧を読み込めませんでした。</p>';
    }
  })();
});