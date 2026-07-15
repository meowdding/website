document.addEventListener('DOMContentLoaded', () => {
  const cats = [
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
    'cookie.png',
    'cookie1.png',
    'lucky.JPG',
    'moustache.jpg',
    'moustache2.jpg',
    'moustache3.jpg',
    'not-cookie.jpg',
    'philou.png',
    'philou1.png',
    'philou2.png',
    'philou3.png',
    'philou4.png',
    'willow1.jpg',
    'willow2.jpg',
    'willow3.jpg',
  ];

  const catElement = document.getElementById('cat-image');
  if (catElement) {
    const randomIndex = Math.floor(Math.random() * cats.length);
    catElement.src = `public/${cats[randomIndex]}`;
  } else {
    console.warn('Cat Element is missing');
  }
});
