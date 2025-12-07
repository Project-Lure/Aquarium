// js/terms.js

document.addEventListener('DOMContentLoaded', () => {
  // パスは前提条件通り data 配下とする
  const ARC_JSON_URL = 'data/arcList.json';
  const SERIES_JSON_URL = 'data/series.json';

  const arcListContainer = document.getElementById('arc-list');
  const seriesListContainer = document.getElementById('series-list');

  // 安全のため存在チェック
  if (!arcListContainer || !seriesListContainer) {
    console.warn('Terms: 必要なコンテナ要素が見つかりません。id="arc-list" / id="series-list" を確認してください。');
    return;
  }

  // 共通の fetch ヘルパー（エラー時は null を返す）
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

  // アーク一覧の描画
  function renderArcs(arcData) {
    // arcData: { "B": {icon, name, keywords:[]}, ... }
    const keys = Object.keys(arcData);

    // 表示順を固定したければ、ここでソート処理を追加する
    // 例: keys.sort(); // アルファベット順
    // 今回は JSON に書いた順をそのまま使うのでそのまま

    const frag = document.createDocumentFragment();

    keys.forEach((arcKey) => {
      const arc = arcData[arcKey];
      if (!arc) return;

      const card = document.createElement('div');
      card.className = 'info-card about-arc-item';

      // ヘッダー部分
      const header = document.createElement('div');
      header.className = 'about-arc-item-header';

      const iconSpan = document.createElement('span');
      iconSpan.className = 'arc-icon';
      iconSpan.textContent = arc.icon || '';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'arc-name';
      // 例: 「ブレイズ（Blaze）」のように英語名も表示
      nameSpan.textContent = `${arc.name || ''}（${eng}）`;

      header.appendChild(iconSpan);
      header.appendChild(nameSpan);

      // キーワード部分
      const keywordsWrap = document.createElement('div');
      keywordsWrap.className = 'about-arc-keywords';

      if (Array.isArray(arc.keywords)) {
        arc.keywords.forEach((kw) => {
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

    arcListContainer.innerHTML = '';
    arcListContainer.appendChild(frag);
  }

  // シリーズ一覧の描画
  function renderSeries(seriesData) {
    // seriesData: { "0": {...}, "1": {...}, ... }

    const ids = Object.keys(seriesData);

    // 数値順で並べたいのでソート
    ids.sort((a, b) => Number(a) - Number(b));

    const frag = document.createDocumentFragment();

    ids.forEach((id) => {
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

    seriesListContainer.innerHTML = '';
    seriesListContainer.appendChild(frag);
  }

  // メイン処理：非同期で JSON を読み込んで描画
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
