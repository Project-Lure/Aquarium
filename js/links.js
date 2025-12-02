// js/links.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("links-container");
  if (!container) return;

  fetch("data/officialLinks.json")
    .then(res => {
      if (!res.ok) throw new Error("officialLinks.json の読み込みに失敗しました");
      return res.json();
    })
    .then(platforms => {
      platforms.forEach(platform => {
        const section = document.createElement("section");
        section.className = "links-platform-section";

        // プラットフォームの見出し
        const heading = document.createElement("h2");
        heading.className = "links-platform-title";

        const iconSpan = document.createElement("span");
        iconSpan.className = "links-platform-icon";
        if (platform.icon) {
          const i = document.createElement("i");
          i.className = platform.icon;
          iconSpan.appendChild(i);
        }

        const labelSpan = document.createElement("span");
        labelSpan.textContent = platform.platformLabel || platform.platformId;

        heading.appendChild(iconSpan);
        heading.appendChild(labelSpan);

        // アカウント一覧
        const list = document.createElement("div");
        list.className = "links-account-list";

        (platform.accounts || []).forEach(acc => {
          const card = document.createElement("a");
          card.className = "links-account-card";
          card.href = acc.url;
          card.target = "_blank";
          card.rel = "noopener noreferrer";

          // 上段：ラベル + ハンドル
          const top = document.createElement("div");
          top.className = "links-account-top";

          const nameSpan = document.createElement("span");
          nameSpan.className = "links-account-label";
          nameSpan.textContent = acc.label;

          const handleSpan = document.createElement("span");
          handleSpan.className = "links-account-handle";
          if (acc.handle) {
            handleSpan.textContent = acc.handle;
          }

          top.appendChild(nameSpan);
          if (acc.handle) {
            top.appendChild(handleSpan);
          }

          // 下段：説明
          const desc = document.createElement("p");
          desc.className = "links-account-desc";
          desc.textContent = acc.description || "";

          card.appendChild(top);
          card.appendChild(desc);

          list.appendChild(card);
        });

        section.appendChild(heading);
        section.appendChild(list);
        container.appendChild(section);
      });
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>公式リンクの読み込みに失敗しました。</p>";
    });
});
