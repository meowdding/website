document.addEventListener('DOMContentLoaded', () => {
  cat();
  projectList();
});

function cat() {
  const cats = [
    {
      name: "Concreate",
      files: [
        'concreate.png',
        'concreate1.jpg',
        'concreate10.jpg',
        'concreate2.jpg',
        'concreate2.png',
        'concreate3.jpg',
        'concreate4.jpg',
        'concreate5.jpg',
        'concreate6.jpg',
        'concreate7.jpg',
        'concreate8.jpg',
        'concreate9.jpg',
      ]
    },
    {
      name: "Creature",
      files: [
        'creature.png'
      ]
    },
    {
      name: "Cookie",
      files: [
        'cookie.png',
        'cookie1.png',
      ]
    },
    {
      name: "Lucky",
      files: [
        'lucky.JPG',
      ]
    },
    {
      name: "Luise",
      files: [
        "luise.jpg"
      ]
    },
    {
      name: "Moustache",
      files: [
        'moustache.jpg',
        'moustache2.jpg',
        'moustache3.jpg',
      ]
    },
    {
      name: "Penny",
      files: [
        'penny.jpg',
      ]
    },
    {
      name: "Philou",
      files: [
        'philou.png',
        'philou1.png',
        'philou2.png',
        'philou3.png',
        'philou4.png',
      ]
    },
    {
      name: "Willow",
      files: [
        'willow1.jpg',
        'willow2.jpg',
        'willow3.jpg',
        'willow4.jpg',
      ]
    },
    {
      name: "Cosmo",
      files: [
        'cosmo.png',
        'cosmo1.png',
      ]
    }
  ];

  const catElement = document.getElementById('cat-image');
  const catNameDisplay = document.getElementById('cat-name');
  if (catElement) {
    const randomCat = cats[Math.floor(Math.random() * cats.length)];
    const randomFile = randomCat.files[Math.floor(Math.random() * randomCat.files.length)];
    catElement.src = `public/${randomFile}`;
    catNameDisplay.textContent = randomCat.name;
  } else {
    console.warn('Cat Element is missing');
  }
}

function projectList() {
  const sites = [
    {
      title: "Catharsis Documentation",
      description: "View the Documentation on how to create a Catharsis Texturepack.",
      link: "https://catharsis.meowdd.ing/"
    },
    {
      title: 'Catharsis Texturepacks',
      description: 'A list of all Texturepacks created using Catharsis.',
      link: './texturepacks.html'
    },
    {
      title: "Hypixel Pack Research Page",
      description: "View the current (alpha) Official Hypixel Texturepack or compare it between versions.",
      link: "https://mrrp.meowdd.ing/"
    },
    {
      title: 'Hypixel Pack Icons',
      description: 'View all SkyBlocks Official Pack Icons with the ability to copy them.',
      link: './icons.html'
    },
    {
      title: 'Catpack',
      description: 'Converts a Texturepack into a .cats Texturepack and the other way around.',
      link: './catpack.html'
    },
    {
      title: 'Custom Scoreboard Background',
      description: 'Create a custom textured background for Custom Scoreboard.',
      link: './scoreboard.html'
    },
    {
      title: '1.8 Death Day',
      description: 'See how many days (maybe even years) since 1.8 has been killed in Hypixel SkyBlock',
      link: './onedoteight.html'
    }
  ];

  function createCard(link, title, description, iconUrl = null) {
    const a = document.createElement('a');
    a.href = link;
    a.className = 'card-link';

    if (iconUrl) {
      const img = document.createElement('img');
      img.src = iconUrl;
      img.className = 'card-icon';
      img.alt = `${title} icon`;
      a.append(img);
    }

    const infoDiv = document.createElement('div');
    infoDiv.className = 'card-info';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'card-title';
    titleDiv.textContent = title;

    const descDiv = document.createElement('div');
    descDiv.className = 'card-description';
    descDiv.textContent = description;

    infoDiv.append(titleDiv, descDiv);
    a.append(infoDiv);

    return a;
  }

  const sitesCategory = document.getElementById('sites-category');
  sites.forEach(site => {
    sitesCategory.append(createCard(site.link, site.title, site.description));
  });

  fetch('public/projects.json')
    .then(response => response.json())
    .then(data => {
      const modsCategory = document.getElementById('mods-category');
      if (data.mods) {
        data.mods.sort((a, b) => b.downloads - a.downloads).forEach(mod => {
          const link = `https://modrinth.com/mod/${mod.slug}`;
          modsCategory.append(createCard(link, mod.title, mod.description, mod.icon));
        });
      }

      const packsCategory = document.getElementById('packs-category');
      if (data.texturepacks) {
        data.texturepacks.sort((a, b) => b.downloads - a.downloads).forEach(pack => {
          const link = `https://modrinth.com/resourcepack/${pack.slug}`;
          packsCategory.append(createCard(link, pack.title, pack.description, pack.icon));
        });
      }
    })
    .catch(error => {
      console.error('Failed to load projects.json:', error);
    });
}
