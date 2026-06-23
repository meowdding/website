import fs from 'fs';

const projects = {};

function fetchAll(start, max) {
  console.log('Fetching ' + start + ' / ' + max);
  return fetch('https://api.modrinth.com/v3/search?facets=[[%22project_types:resourcepack%22],[%22dependency_project_ids:fc4wBpRx%22]]&limit=100&offset=' + start, {
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
      data.hits.forEach((project) => {
        projects[project.project_id] = {
          slug: project.slug,
          title: project.name,
          description: project.summary,
          icon: project.icon_url,
          latest_version: project.version_id,
          downloads: project.downloads,
          organization: project.organization,
          organization_id: project.organization_id,
          author: project.author,
          author_id: project.author_id,
        };
      });
      return data;
    }).then(async (data) => {
      if (start + 100 >= data.total_hits) return;

      await timeout(1000);
      return fetchAll(start + 100, data.total_hits);
    });
}

async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  await fetchAll(0, 101);

  fs.writeFileSync('./public/resourcepacks.json', JSON.stringify(projects, null, 2));
}

run();
