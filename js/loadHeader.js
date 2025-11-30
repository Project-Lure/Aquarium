document.addEventListener("DOMContentLoaded", () => {
    fetch("components/header.html")
        .then(res => res.text())
        .then(html => {
            document.getElementById("header-container").innerHTML = html;
        })
        .then(() => {
            // ハンバーガー開閉処理
            const menuBtn = document.getElementById("menu-toggle");
            const nav = document.getElementById("header-nav");

            if (menuBtn && nav) {
                menuBtn.addEventListener("click", () => {
                    const d = getComputedStyle(nav).display;
                    nav.style.display = d === "none" ? "flex" : "none";
                });
            }
        });
});