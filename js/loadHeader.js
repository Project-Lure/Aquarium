<header class="site-header">

  <!-- 左：ハンバーガー + ナビ -->
  <div class="header-left">
    <!-- ハンバーガー（全デバイスで表示） -->
    <button id="menu-toggle" class="header-menu-btn" aria-label="メニュー">
      <i class="fa-solid fa-bars"></i>
    </button>

    <!-- スライドメニュー用ナビ -->
    <nav class="header-nav" id="header-nav">
      <a href="index.html">HOME</a>
      <a href="about.html">ABOUT</a>
      <a href="links.html">LINKS</a>
    </nav>
  </div>

  <!-- 中央：横長ロゴ -->
  <div class="header-center">
    <a href="index.html" class="header-logo-link">
      <img src="images/ui/logo-horizontal.png"
           alt="Project Lure"
           class="header-logo">
    </a>
  </div>

  <!-- 右：検索・ヘルプボタン -->
  <div class="header-right">
    <button id="search-open" class="header-icon-btn header-search-btn">
      <i class="fa-solid fa-magnifying-glass"></i>
    </button>
    <button id="help-open" class="header-icon-btn header-help-btn">
      <i class="fa-regular fa-circle-question"></i>
    </button>
  </div>
</header>

<!-- ★ ナビ用オーバーレイ -->
<div id="nav-overlay" class="nav-overlay"></div>