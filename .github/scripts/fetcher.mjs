import fs from 'fs';

const projects = {};

function fetchAll(start, max) {
  console.log('Fetching ' + start + ' / ' + max);
  return fetch('https://api.modrinth.com/v2/search?facets=[[%22project_type:resourcepack%22]]&limit=100&offset=' + start, {
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
          title: project.title,
          description: project.description,
          icon: project.icon_url,
          latest_version: project.latest_version,
          downloads: project.downloads,
          creator: project.organization ?? project.author,
          creator_id: project.organization_id ?? project.author_id,
        };
      });
      return data;
    }).then(async (data) => {
      if (data.offset + 100 >= max) return;

      await timeout(1000);
      return fetchAll(data.offset + 100, data.total_hits);
    });
}

async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCatharsisVersions() {
  return fetch('https://api.modrinth.com/v2/project/catharsis', {
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
    })
    .then((data => data.versions));
}

function chunk(input, size) {
  const chunks = [];
  for (let i = 0; i < input.length; i += size) {
    chunks.push(input.slice(i, i + size));
  }
  return chunks;
}

async function fetchVersionChunk(versionChunk, catharsisVersions) {
  return fetch('https://api.modrinth.com/v2/versions?include_changelog=false&ids=' + JSON.stringify(versionChunk), {
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
    })
    .then((data) => {
      let versions = [];

      data.forEach((version) => {
        version.dependencies.forEach((element) => {
          if (element.project_id === 'fc4wBpRx' || element.version_id in catharsisVersions) {
            console.log(version.project_id)
            versions.push(version.project_id);
          }
        });
      });

      return versions;
    });
}

async function fetchVersions(versionIds, catharsisVersions) {
  let versions = chunk(versionIds, 200);
  let requires = [];

  for (let versionChunk in versions) {
    await timeout(1000);
    console.log("Fetching chunk " + (parseInt(versionChunk) + 1) + " / " + versions.length);
    let list = await fetchVersionChunk(versions[versionChunk], catharsisVersions);
    requires.push(...list)
    console.log(requires);
  }

  return requires
}

async function run() {
  let catharsisVersions = await fetchCatharsisVersions();
  await fetchAll(0, 101);
  let versions = [];
  for (let projectId in projects) {
    let project = projects[projectId];
    versions.push(project.latest_version);
  }
  let requireCatharsis = await fetchVersions(versions, catharsisVersions);

  let projectData = {};

  for (let project in requireCatharsis) {
    let id = requireCatharsis[project];
    projectData[id] = projects[id];
  }

  fs.writeFileSync('./public/resourcepacks.json', JSON.stringify(projectData, null, 2));
}

run();
