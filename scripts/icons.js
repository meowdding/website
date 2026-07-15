const HARDCODED_NAMES = {
  "\\ue000": "Health",
};

async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const originalText = button.innerText;
    button.innerText = "Copied!";
    button.classList.add("success");

    setTimeout(() => {
      button.innerText = originalText;
      button.classList.remove("success");
    }, 1500);
  } catch (err) {
    console.error(err);
  }
}

async function run() {
  const fontUrl = "https://raw.githubusercontent.com/meowdding/hypixel-pack/refs/heads/26.2/assets/minecraft/font/default.json";
  const baseImage = "https://raw.githubusercontent.com/meowdding/hypixel-pack/refs/heads/26.2/assets/hypixel_skyblock/textures/";
  const container = document.getElementById("container");

  try {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      document.getElementById("failure").innerText = `Response status: ${response.status}`;
      return;
    }

    const result = await response.json();

    const things = result[0].providers.map(it => ({
      file: baseImage + it.file.slice(17),
      name: it.file.slice(17).replace('.png', '').toUpperCase(),
      chars: it.chars
    }));

    things.forEach(provider => {
      const rows = provider.chars.length;
      const maxCols = Math.max(...provider.chars.map(row => Array.from(row).length));

      const details = document.createElement("details");
      details.className = "category";

      const name = document.createElement("summary");
      name.className = "category-name";
      name.innerText = provider.name;
      details.appendChild(name);

      const grid = document.createElement("div");
      grid.className = "grid";

      provider.chars.forEach((rowStr, y) => {
        const rowChars = Array.from(rowStr);

        rowChars.forEach((char, x) => {
          if (char === ' ' || char === '\u0000') return;

          const codePoint = char.codePointAt(0).toString(16);
          const escapedChar = codePoint.length > 4
            ? `\\U${codePoint.padStart(8, '0')}`
            : `\\u${codePoint.padStart(4, '0')}`;

          const displayName = HARDCODED_NAMES[escapedChar] || "Unknown Icon";

          const bgPosX = maxCols > 1 ? (x / (maxCols - 1)) * 100 : 0;
          const bgPosY = rows > 1 ? (y / (rows - 1)) * 100 : 0;

          const bgSizeX = maxCols * 100;
          const bgSizeY = rows * 100;

          const card = document.createElement("div");
          card.className = "card";

          card.innerHTML = `
              <div class="preview" style="
                background-image: url('${provider.file}');
                background-size: ${bgSizeX}% ${bgSizeY}%;
                background-position: ${bgPosX}% ${bgPosY}%;
              "></div>
              <div class="icon-name">${displayName}</div>
              <div class="icon-char">${escapedChar}</div>
              <div class="button-row">
                <button class="copy-button copy-raw">Char</button>
                <button class="copy-button copy-escaped">\\u</button>
              </div>
            `;

          card.querySelector('.copy-raw').addEventListener('click', function () {
            copyToClipboard(char, this);
          });

          card.querySelector('.copy-escaped').addEventListener('click', function () {
            copyToClipboard(escapedChar, this);
          });

          grid.appendChild(card);
        });
      });

      details.appendChild(grid);
      container.appendChild(details);
    });

  } catch (error) {
    document.getElementById("failure").innerText = error.message;
  }
}
