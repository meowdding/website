import fs from 'fs';

// Maybe Some Day
const currentlyDeadMods = ["hypixel-sky-block"]

const projects = {
  mods: [],
  texturepacks: []
};

function fetchAll() {
  console.log('Fetching organization projects...');
  return fetch('https://api.modrinth.com/v3/organization/CGW8DHEi/projects', {
    headers: {
      'User-Agent': 'meowdding/website (' + atob('Y29udGFjdEB0aGF0Z3Jhdnlib2F0LnRlY2g=') + ')'
    }
  })
    .then((response) => {
      try {
        return response.json();
      } catch (e) {
        console.error('Failed to fetch data from Modrinth API');
        throw e;
      }
    }).then((data) => {
      data.forEach((project) => {
        if (currentlyDeadMods.includes(project.slug)) return

        const formattedProject = {
          slug: project.slug,
          title: project.name,
          description: project.summary,
          icon: project.icon_url,
          downloads: project.downloads,
        };

        if (project.project_types.includes('resourcepack')) {
          projects.texturepacks.push(formattedProject);
        } else if (project.project_types.includes('mod')) {
          projects.mods.push(formattedProject);
        }
      });
    });
}

async function run() {
  await fetchAll();

  fs.writeFileSync('./public/projects.json', JSON.stringify(projects, null, 2));
}

run();
