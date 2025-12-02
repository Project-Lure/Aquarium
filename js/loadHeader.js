document.addEventListener("DOMContentLoaded", () => {
  fetch("components/header.html")
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById("header-container");
      if (!container) return;
      container.innerHTML = html;
    })
    .then(() => {
      // ハンバーガー開閉処理
      const menuBtn = document.getElementById("menu-toggle");
      const nav = document.getElementById("header-nav");

      if (menuBtn && nav) {
        menuBtn.addEventListener("click", () => {
          nav.classList.toggle("is-open");
        });
      }
    })
    .catch(err => {
      console.error("ヘッダー読み込みエラー:", err);
    });
});
