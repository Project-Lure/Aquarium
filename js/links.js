// js/links.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("links-container");
  if (!container) return;

  fetch("data/officialLinks.json")
    .then(res => {
      if (!res.ok) throw new Error("officialLinks.json の読み込みに失敗しました");
      return res.json();
    })
    .then(data => {
      // 各カテゴリの見出し名・アイコンをここで定義
      const platformMeta = {
        SNS: {
          label: "SNS / 配信",
          icon: "fa-solid fa-share-nodes"
        },
        PORTFOLIO: {
          label: "Portfolio",
          icon: "fa-regular fa-id-card"
        },
        SHOP: {
          label: "Shop / 支援",
          icon: "fa-solid fa-bag-shopping"
        },
        CONTACT: {
          label: "Contact",
          icon: "fa-regular fa-envelope"
        }
      };

      // data は { SNS: [...], PORTFOLIO: [...], ... } というオブジェクト
      Object.entries(data).forEach(([platformId, accounts]) => {
        if (!Array.isArray(accounts) || accounts.length === 0) return;

        const meta = platformMeta[platformId] || {
          label: platformId,
          icon: "fa-solid fa-link"
        };

        // ---- セクション（★ section-card を付ける） ----
        const section = document.createElement("section");
        section.className = "section-card links-platform-section";

        const heading = document.createElement("h2");
        heading.className = "links-platform-title";

        const iconSpan = document.createElement("span");
        iconSpan.className = "links-platform-icon";

        const i = document.createElement("i");
        i.className = meta.icon;
        iconSpan.appendChild(i);

        const labelSpan = document.createElement("span");
        labelSpan.textContent = meta.label;

        heading.appendChild(iconSpan);
        heading.appendChild(labelSpan);

        // ---- アカウント一覧 ----
        const list = document.createElement("div");
        list.className = "links-account-list";

        accounts.forEach(acc => {
          // ★ info-card / info-card--link を付与
          const card = document.createElement("a");
          card.className = "info-card info-card--link links-account-card";
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
            top.appendChild(handleSpan);
          }

          top.insertBefore(nameSpan, top.firstChild);

          // 下段：説明（JSON のキー名は desc）
          const desc = document.createElement("p");
          desc.className = "links-account-desc";
          desc.textContent = acc.desc || "";

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