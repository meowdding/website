document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("pack-container");

  getPacks().then(packs => {
    Object.values(packs).forEach(pack => {
      const packElement = document.createElement("a");
      packElement.href = `https://modrinth.com/resourcepack/${pack.slug}`;
      packElement.target = "_blank";
      packElement.classList.add("pack-entry");

      const img = document.createElement("img");
      img.src = pack.icon;
      img.alt = `${pack.title} Preview`;
      img.classList.add("pack-icon");
      packElement.appendChild(img);

      const info = document.createElement("div");
      info.classList.add("pack-info");

      const titleContainer = document.createElement("div");
      titleContainer.classList.add("pack-title-container");

      const name = document.createElement("h3");
      name.textContent = pack.title;
      titleContainer.appendChild(name);

      const creatorName = pack.organization || pack.author;
      const creatorId = pack.organization_id || pack.author_id
      if (creatorName && creatorId) {
        const creatorType = pack.organization ? "organization" : "user";
        const creatorLink = document.createElement("a");
        creatorLink.href = `https://modrinth.com/${creatorType}/${creatorId}`;
        creatorLink.textContent = `by ${creatorName}${nameSuffix[creatorName] ?? ""}`;
        creatorLink.target = "_blank";
        creatorLink.classList.add("pack-creator");

        titleContainer.appendChild(creatorLink);
      }

      info.appendChild(titleContainer);

      const description = document.createElement("p");
      description.textContent = pack.description;
      info.appendChild(description);

      const downloadLink = document.createElement("a");
      downloadLink.href = `https://modrinth.com/resourcepack/${pack.slug}/version/${pack.latest_version}`;
      downloadLink.textContent = "Newest Version";
      downloadLink.target = "_blank";
      downloadLink.classList.add("button-design", "secondary-button", "pack-download");
      info.appendChild(downloadLink);

      const downloadCount = document.createElement("p");
      downloadCount.textContent = pack.downloads.toLocaleString() + " ↓";
      downloadCount.classList.add("download-count");
      packElement.appendChild(downloadCount);

      packElement.appendChild(info);
      container.appendChild(packElement);
    });
  });
});

const nameSuffix = {
  "Meowdding": "🐈",
  "Helicoptero": "🚁",
}

async function getPacks() {
  return fetch("/public/resourcepacks.json").then(response => response.json());
}
