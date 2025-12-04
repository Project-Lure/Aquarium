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
          1. ハンバーガー開閉
      ============================ */
      const menuBtn = document.getElementById("menu-toggle");
      const nav = document.getElementById("header-nav");

      if (menuBtn && nav) {
        menuBtn.addEventListener("click", () => {
          nav.classList.toggle("is-open");
        });
      }

      /* ============================
          2. 検索ボタン（虫眼鏡）の表示制御
             → index.html 以外では非表示
      ============================ */
      const searchBtn = document.getElementById("search-open");
      const isIndex = document.body.classList.contains("page-index");

      if (searchBtn && !isIndex) {
        searchBtn.style.display = "none";
      }

      /* ============================
          3. ヘルプボタン（？）の表示制御
             → index.html 以外では非表示
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

        // 開く
        helpBtn.addEventListener("click", () => {
          helpOverlay.classList.add("is-open");
          helpOverlay.setAttribute("aria-hidden", "false");
        });

        // 閉じる（×ボタン）
        helpClose.addEventListener("click", () => {
          helpOverlay.classList.remove("is-open");
          helpOverlay.setAttribute("aria-hidden", "true");
        });

        // 暗幕クリックで閉じる
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