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

      const name = document.createElement("h3");
      name.textContent = pack.title;
      info.appendChild(name);

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

async function getPacks() {
  return fetch("/public/resourcepacks.json").then(response => response.json());
}
