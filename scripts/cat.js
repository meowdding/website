document.addEventListener('DOMContentLoaded', () => { cat() });

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
      name: "Moustache",
      files: [
        'moustache.jpg',
        'moustache2.jpg',
        'moustache3.jpg',
      ]
    },
    {
      name: "Not cookie (we dont know)",
      files: [
        'not-cookie.jpg',
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
