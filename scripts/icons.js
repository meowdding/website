const HARDCODED_NAMES = {
  // STATS
  "\\ue000": "(Unsure)",
  "\\ue001": "Attack Speed",
  "\\ue002": "Ability Damage",
  "\\ue003": "Intelligence / Mana",
  "\\ue004": "Rift Mana Regen",
  "\\ue005": "Breaking Power",
  "\\ue006": "Cold / Cold Resistance",
  "\\ue007": "Crit Damage",
  "\\ue008": "Defense",
  "\\ue009": "Double Hook Chance",
  "\\ue00a": "Fear",
  "\\ue00b": "Ferocity",
  "\\ue00c": "Fishing Speed",
  "\\ue00d": "Strength",
  "\\ue00e": "Machine Fuel",
  "\\ue00f": "Gemstone Spread",
  "\\ue010": "Health",
  "\\ue011": "Health Regen",
  "\\ue012": "Heat / Heat Resistance",
  "\\ue013": "Pet Luck",
  "\\ue014": "Mending",
  "\\ue015": "Mining Speed",
  "\\ue016": "Mining Spread",
  "\\ue017": "Overflow Mana",
  "\\ue018": "Pest",
  "\\ue019": "Bonus Pest Chance",
  "\\ue01a": "Magic Find",
  "\\ue01b": "Pressure Resistance",
  "\\ue01c": "Pristine",
  "\\ue01d": "Respiration",
  "\\ue01e": "Rift Damage",
  "\\ue01f": "Rift Health",
  "\\ue020": "Rift Time",
  "\\ue021": "Sea Creature Chance",
  "\\ue022": "Speed",
  "\\ue023": "Sweep",
  "\\ue024": "Swing Range",
  "\\ue025": "Treasure Chance",
  "\\ue026": "(Unsure)",
  "\\ue027": "True Defense",
  "\\ue028": "Vitality",
  "\\ue029": "(Unsure)",
  "\\ue02a": "Trophy Chance",
  "\\ue02b": "Overbloom",
  "\\ue02c": "Crit Chance",
  "\\ue02d": "Pull",

  // SKILLS
  "\\ue050": "Combat",
  "\\ue051": "Farming",
  "\\ue052": "Fishing",
  "\\ue053": "Mining",
  "\\ue054": "Foraging",
  "\\ue055": "Enchanting",
  "\\ue056": "Alchemy",
  "\\ue057": "Carpentry",
  "\\ue058": "Runecrafting",
  "\\ue059": "Taming",
  "\\ue05a": "Social",
  "\\ue05b": "Hunting",

  // ICONS
  "\\ue060": "Left Arrow (Interpreted)",
  "\\ue061": "Right Arrow (Interpreted)",
  "\\ue062": "Up Arrow (Interpreted)",
  "\\ue063": "Down Arrow (Interpreted)",
  "\\u2714": "Checkmark (Interpreted)",
  "\\u2716": "X (Interpreted)",
  "\\ue066": "Lock (Interpreted)",
  "\\ue067": "Location",
  "\\ue068": "Fragged Item",

  // MOBS
  "\\ue070": "Airborne",
  "\\ue071": "Animal",
  "\\ue072": "Aquatic",
  "\\ue073": "Arcane",
  "\\ue074": "Arthropod",
  "\\ue075": "Construct",
  "\\ue076": "Cubic",
  "\\ue077": "Elusive",
  "\\ue078": "Ender",
  "\\ue079": "Frozen",
  "\\ue07a": "Glacial",
  "\\ue07b": "Humanoid",
  "\\ue07c": "Infernal",
  "\\ue07d": "Magmatic",
  "\\ue07e": "Mythological",
  "\\ue07f": "Pest",
  "\\ue080": "Shielded",
  "\\ue081": "Skeletal",
  "\\ue082": "Spooky",
  "\\ue083": "Subterranean",
  "\\ue084": "Undead",
  "\\ue085": "Wither",
  "\\ue086": "Woodland",
  "\\ue087": "Critter",

  // STAFF ICONS
  "\\u12de": "Hypixel Admins"
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

    const things = result.providers.map(it => ({
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
