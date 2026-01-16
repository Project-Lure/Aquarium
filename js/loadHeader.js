// js/loadHeader.js

// 1. components/header.html を読み込んで #header-container に挿入
document.addEventListener('DOMContentLoaded', async () => {
  const headerContainer = document.getElementById('header-container');

  if (!headerContainer) {
    // ヘッダーを置かないページなら何もしない
    return;
  }

  try {
    // index.html と同じ階層に components/ フォルダがある前提
    const res = await fetch('components/header.html');
    if (!res.ok) {
      throw new Error('components/header.html の読み込みに失敗しました');
    }
    const html = await res.text();
    headerContainer.innerHTML = html;
  } catch (err) {
    console.error('ヘッダー読み込みエラー:', err);
    return; // 失敗したら初期化せず終了
  }

  // HTML を差し込んでから初期化
  initHeader();
});

function initHeader() {
  // ==========
  // 要素取得
  // ==========
  const menuToggle  = document.getElementById('menu-toggle');
  const nav         = document.getElementById('site-nav');
  const navOverlay  = document.getElementById('nav-overlay');
  const navCloseBtn = nav ? nav.querySelector('.nav-close-btn') : null;

  const searchOpenBtn  = document.getElementById('search-open');
  const searchOverlay  = document.getElementById('search-overlay');
  const searchCloseBtn = searchOverlay ? document.getElementById('search-close') : null;

  const helpOpenBtn  = document.getElementById('help-open');
  const helpOverlay  = document.getElementById('help-overlay');
  const helpCloseBtn = helpOverlay ? document.getElementById('help-close') : null;

  // ==========
  // サイドナビ開閉
  // ==========
  const openNav = () => {
    if (!nav || !navOverlay) return;
    nav.classList.add('is-open');
    navOverlay.classList.add('is-active');
    nav.setAttribute('aria-hidden', 'false');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'true');
    }
    document.body.dataset.navOpen = 'true';
  };

  const closeNav = () => {
    if (!nav || !navOverlay) return;
    nav.classList.remove('is-open');
    navOverlay.classList.remove('is-active');
    nav.setAttribute('aria-hidden', 'true');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.dataset.navOpen = 'false';
  };

  // ハンバーガー（トグル）
  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = nav && nav.classList.contains('is-open');
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });
  }

  // ×ボタン
  if (navCloseBtn) {
    navCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeNav();
    });
  }

  // オーバーレイクリック
  if (navOverlay) {
    navOverlay.addEventListener('click', () => {
      closeNav();
    });
  }

  // ==========
  // 検索モーダル
  // ==========
  const openSearch = () => {
    if (!searchOverlay) return;
    searchOverlay.classList.add('is-open');
    const input = document.getElementById('search-input');
    if (input) {
      setTimeout(() => input.focus(), 0);
    }
  };

  const closeSearch = () => {
    if (!searchOverlay) return;
    searchOverlay.classList.remove('is-open');
  };

  if (searchOpenBtn && searchOverlay) {
    searchOpenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openSearch();
    });
  }

  if (searchCloseBtn) {
    searchCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeSearch();
    });
  }

  if (searchOverlay) {
    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) {
        closeSearch();
      }
    });
  }

  // ==========
  // ヘルプモーダル
  // ==========
  const openHelp = () => {
    if (!helpOverlay) return;
    helpOverlay.classList.add('is-open');
  };

  const closeHelp = () => {
    if (!helpOverlay) return;
    helpOverlay.classList.remove('is-open');
  };

  if (helpOpenBtn && helpOverlay) {
    helpOpenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openHelp();
    });
  }

  if (helpCloseBtn) {
    helpCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeHelp();
    });
  }

  if (helpOverlay) {
    helpOverlay.addEventListener('click', (e) => {
      if (e.target === helpOverlay) {
        closeHelp();
      }
    });
  }

  // ==========
  // Escキーでナビ／モーダルを閉じる
  // ==========
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    if (searchOverlay && searchOverlay.classList.contains('is-open')) {
      closeSearch();
      return;
    }
    if (helpOverlay && helpOverlay.classList.contains('is-open')) {
      closeHelp();
      return;
    }
    if (nav && nav.classList.contains('is-open')) {
      closeNav();
    }
  });

  // ==========
  // 現在ページに .is-current を付与（親も光らせる）
  // ==========
  try {
    let currentPage = window.location.pathname.split('/').pop();
    if (!currentPage || currentPage === '') {
      currentPage = 'index.html';
    }

    const normalizeFile = (href) => {
      if (!href) return '';
      return href.split('/').pop().split('#')[0].split('?')[0];
    };

    const setCurrent = (el) => {
      if (!el) return;
      el.classList.add('is-current');
    };

    // 親リンク（メイン）
    const navLinks = document.querySelectorAll('.header-nav-link[href]');
    navLinks.forEach((link) => {
      const linkFile = normalizeFile(link.getAttribute('href'));
      if (linkFile === currentPage) {
        setCurrent(link);
      }
    });

    // 子リンク（サブ）
    const subnavLinks = document.querySelectorAll('.header-subnav-link[href]');
    subnavLinks.forEach((link) => {
      const linkFile = normalizeFile(link.getAttribute('href'));
      if (linkFile !== currentPage) return;

      // 子を光らせる
      setCurrent(link);

      // その子が属している subnav ブロックを見て、親を決める
      const subnavBlock = link.closest('.header-subnav');
      if (!subnavBlock) return;

      if (subnavBlock.classList.contains('header-subnav--about')) {
        setCurrent(document.querySelector('.header-nav-link.nav-about'));
      } else if (subnavBlock.classList.contains('header-subnav--series')) {
        setCurrent(document.querySelector('.header-nav-link.nav-series'));
      } else if (subnavBlock.classList.contains('header-subnav--official')) {
        setCurrent(document.querySelector('.header-nav-link.nav-official'));
      }
    });

  } catch (err) {
    console.warn('current page 判定でエラー:', err);
  }
}
