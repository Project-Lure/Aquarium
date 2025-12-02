document.addEventListener("DOMContentLoaded", () => {
  fetch("components/footer.html")
    .then(res => res.text())
    .then(html => {
      const container = document.getElementById("footer-container");
      if (!container) return;
      container.innerHTML = html;
    })
    .catch(err => {
      console.error("フッター読み込みエラー:", err);
    });
});
