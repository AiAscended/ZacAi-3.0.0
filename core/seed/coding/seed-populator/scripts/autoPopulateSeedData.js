const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const schema = require('../lib/schema');

// Map language to doc sources/selectors (expand as needed)
const docSources = {
  nextjs: {
    base: 'https://nextjs.org/docs/pages/building-your-application/',
    selector: 'article',
    github: 'https://github.com/vercel/next.js',
    soTag: 'https://stackoverflow.com/questions/tagged/next.js'
  },
  react: {
    base: 'https://react.dev/reference/react/',
    selector: 'main',
    github: 'https://github.com/facebook/react',
    soTag: 'https://stackoverflow.com/questions/tagged/reactjs'
  },
  javascript: {
    base: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/',
    selector: '#content',
    github: 'https://github.com/tc39/ecma262',
    soTag: 'https://stackoverflow.com/questions/tagged/javascript'
  },
  typescript: {
    base: 'https://www.typescriptlang.org/docs/handbook/',
    selector: 'main',
    github: 'https://github.com/microsoft/TypeScript',
    soTag: 'https://stackoverflow.com/questions/tagged/typescript'
  },
  tailwind: {
    base: 'https://tailwindcss.com/docs/',
    selector: 'main',
    github: 'https://github.com/tailwindlabs/tailwindcss',
    soTag: 'https://stackoverflow.com/questions/tagged/tailwind-css'
  },
  css: {
    base: 'https://developer.mozilla.org/en-US/docs/Web/CSS/',
    selector: '#content',
    github: 'https://github.com/mdn/content',
    soTag: 'https://stackoverflow.com/questions/tagged/css'
  },
  python: {
    base: 'https://docs.python.org/3/library/',
    selector: '#content',
    github: 'https://github.com/python/cpython',
    soTag: 'https://stackoverflow.com/questions/tagged/python'
  },
  html: {
    base: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/',
    selector: '#content',
    github: 'https://github.com/mdn/content',
    soTag: 'https://stackoverflow.com/questions/tagged/html'
  },
  sql: {
    base: 'https://www.w3schools.com/sql/',
    selector: '#main',
    github: 'https://github.com/sqlite/sqlite',
    soTag: 'https://stackoverflow.com/questions/tagged/sql'
  }
};

const seedDir = path.join(__dirname, '..', 'seed-structures');
const seedFiles = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'));

function loadAllStructures() {
  const all = {};
  for (const file of seedFiles) {
    const structure = require(path.join(seedDir, file));
    Object.assign(all, structure);
  }
  return all;
}

function getConceptUrl(lang, folder, concept) {
  const source = docSources[lang];
  if (!source) return null;
  if (lang === 'nextjs') return `${source.base}${folder.replace(/_/g, '-')}/${concept.replace(/_/g, '-')}`;
  if (lang === 'react') return `${source.base}${concept}`;
  if (lang === 'javascript') return `${source.base}${folder}/${concept}`;
  if (lang === 'typescript') return `${source.base}${concept}.html`;
  if (lang === 'tailwind') return `${source.base}${concept}`;
  if (lang === 'css') return `${source.base}${concept}`;
  if (lang === 'python') return `${source.base}${concept}.html`;
  if (lang === 'html') return `${source.base}${concept}`;
  if (lang === 'sql') return `${source.base}${concept}.asp`;
  return null;
}

async function scrapeDocs(lang, folder, concept) {
  const source = docSources[lang];
  const url = getConceptUrl(lang, folder, concept);
  let description = null, usage = null, examples = [];
  if (url) {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      description = $(`${source.selector} p`).first().text() || null;
      usage = $(`${source.selector} pre`).first().text() || null;
      $(`${source.selector} pre`).each((i, el) => {
        if (i < 3) examples.push({ code: $(el).text(), explanation: null });
      });
    } catch (e) {
      description = null;
      usage = null;
      examples = [];
    }
  }
  return { description, usage, examples, url };
}

async function main() {
  const structure = loadAllStructures();
  for (const lang of Object.keys(structure)) {
    for (const folder of Object.keys(structure[lang])) {
      const concepts = structure[lang][folder];
      const folderPath = path.join(__dirname, '..', 'data', lang, folder);
      fs.mkdirSync(folderPath, { recursive: true });
      for (const concept of concepts) {
        const filePath = path.join(folderPath, `${concept}.json`);
        if (fs.existsSync(filePath)) continue;
        const s = { ...schema };
        s.id = concept;
        s.name = concept;
        s.language = lang;
        s.category = folder;
        s.framework = ['nextjs','react','tailwind'].includes(lang) ? lang : null;
        s.links = [
          { title: 'Official Docs', url: null },
          { title: 'GitHub', url: docSources[lang]?.github || null },
          { title: 'Stack Overflow', url: docSources[lang]?.soTag || null }
        ];
        const { description, usage, examples, url } = await scrapeDocs(lang, folder, concept);
        s.description = description;
        s.usage = usage;
        s.examples = examples;
        if (url) s.links[0].url = url;
        fs.writeFileSync(filePath, JSON.stringify(s, null, 2));
        console.log(`Populated: ${filePath}`);
      }
    }
  }
}

main();
