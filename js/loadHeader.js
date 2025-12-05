// loadHeader.js

// ヘッダーを読み込んでから初期化する
document.addEventListener('DOMContentLoaded', async () => {
  const headerContainer = document.getElementById('header-container');

  // 1) 共通ヘッダー読み込み（header.html を <div id="header-container"> に挿入）
  if (headerContainer) {
    try {
      const res = await fetch('header.html');  // header.html と同じ階層に各ページがある想定
      if (!res.ok) {
        throw new Error('header.html の読み込みに失敗しました');
      }
      const html = await res.text();
      headerContainer.innerHTML = html;
    } catch (err) {
      console.error('ヘッダー読み込みエラー:', err);
      // 読み込みに失敗した場合はこれ以上やることがないので return
      return;
    }
  } else {
    // headerContainer 自体がないページでは何もしない
    return;
  }

  // 2) ヘッダーの各種イベントを設定
  initHeader();
});

function initHeader() {
  // ==========
  // 要素取得
  // ==========
  const menuToggle   = document.getElementById('menu-toggle');
  const nav          = document.getElementById('site-nav');
  const navOverlay   = document.getElementById('nav-overlay');
  const navCloseBtn  = nav ? nav.querySelector('.nav-close-btn') : null;

  const searchOpenBtn   = document.getElementById('search-open');
  const searchOverlay   = document.getElementById('search-overlay');
  const searchCloseBtn  = searchOverlay ? document.getElementById('search-close') : null;

  const helpOpenBtn   = document.getElementById('help-open');
  const helpOverlay   = document.getElementById('help-overlay');
  const helpCloseBtn  = helpOverlay ? document.getElementById('help-close') : null;

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

  // ハンバーガーで開く（トグル）
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

  // ×ボタンで閉じる
  if (navCloseBtn) {
    navCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeNav();
    });
  }

  // オーバーレイクリックで閉じる
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

    // 優先順位：検索 → ヘルプ → ナビ
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
  // 現在ページに .is-current を付与
  // ==========
  try {
    let currentPage = window.location.pathname.split('/').pop();
    if (!currentPage || currentPage === '') {
      currentPage = 'index.html';
    }

    // メインメニュー
    const navLinks = document.querySelectorAll('.header-nav-link[href]');
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      const linkFile = href.split('/').pop().split('#')[0].split('?')[0];
      if (linkFile === currentPage) {
        link.classList.add('is-current');
      }
    });

    // サブメニュー（ABOUT配下）
    const subnavLinks = document.querySelectorAll('.header-subnav-link[href]');
    subnavLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      const linkFile = href.split('/').pop().split('#')[0].split('?')[0];
      if (linkFile === currentPage) {
        link.classList.add('is-current');
        const aboutParent = document.querySelector('.header-nav-link.nav-about');
        if (aboutParent) {
          aboutParent.classList.add('is-current');
        }
      }
    });
  } catch (err) {
    console.warn('current page 判定でエラー:', err);
  }
}