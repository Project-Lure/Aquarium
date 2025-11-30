document.addEventListener("DOMContentLoaded", () => {
    fetch("characters.json")
        .then(res => res.json())
        .then(chars => {
            const container = document.getElementById("card-list");
            chars.forEach(c => {
                const a = document.createElement("a");
                a.href = `character.html?code=${c.code}`;
                a.className = "card";
                a.innerHTML = `
          <img src="${c.imageUrl}">
          <div class="card-meta">
            <div>${c.code}</div>
            <div>${c.title}</div>
          </div>
        `;
                container.appendChild(a);
            });
        });
});