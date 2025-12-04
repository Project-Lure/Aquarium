document.addEventListener("DOMContentLoaded", () => {
  fetch("components/header.html")
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById("header-container");
      if (!container) return;
      container.innerHTML = html;
    })
    .then(() => {
      /* ============================
          1. ハンバーガー開閉（スライドメニュー）
      ============================ */
      const menuBtn   = document.getElementById("menu-toggle");
      const nav       = document.getElementById("header-nav");
      const navOverlay = document.getElementById("nav-overlay");

      function setNavOpen(isOpen) {
        if (!nav) return;
        nav.classList.toggle("is-open", isOpen);
        if (navOverlay) {
          navOverlay.classList.toggle("is-open", isOpen);
        }
      }

      if (menuBtn && nav) {
        menuBtn.addEventListener("click", () => {
          const willOpen = !nav.classList.contains("is-open");
          setNavOpen(willOpen);
        });
      }

      // オーバーレイクリックで閉じる
      if (navOverlay && nav) {
        navOverlay.addEventListener("click", () => {
          setNavOpen(false);
        });
      }

      /* ============================
          2. 検索ボタンの表示制御
      ============================ */
      const searchBtn = document.getElementById("search-open");
      const isIndex   = document.body.classList.contains("page-index");

      if (searchBtn && !isIndex) {
        searchBtn.style.display = "none";
      }

      /* ============================
          3. ヘルプボタンの表示制御
      ============================ */
      const helpBtn = document.getElementById("help-open");

      if (helpBtn && !isIndex) {
        helpBtn.style.display = "none";
      }

      /* ============================
          4. ヘルプオーバーレイ開閉処理
      ============================ */
      const helpOverlay = document.getElementById("help-overlay");
      const helpClose   = document.getElementById("help-close");

      if (helpBtn && helpOverlay && helpClose) {
        helpBtn.addEventListener("click", () => {
          helpOverlay.classList.add("is-open");
          helpOverlay.setAttribute("aria-hidden", "false");
        });

        helpClose.addEventListener("click", () => {
          helpOverlay.classList.remove("is-open");
          helpOverlay.setAttribute("aria-hidden", "true");
        });

        helpOverlay.addEventListener("click", (e) => {
          if (e.target === helpOverlay) {
            helpOverlay.classList.remove("is-open");
            helpOverlay.setAttribute("aria-hidden", "true");
          }
        });
      }
    })
    .catch(err => {
      console.error("ヘッダー読み込みエラー:", err);
    });
});