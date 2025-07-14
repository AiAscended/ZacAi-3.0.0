const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const Ajv = require('ajv');

const schemaTemplate = require('../lib/schema');
const schemaValidation = require('../lib/schema.validation.json');

const TEST_MODE = process.env.TEST_MODE === 'true';
const TEST_LIMIT = 5;

// --- Doc sources (same as before, add more as needed) ---
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
  },
  php: {
    base: 'https://www.php.net/manual/en/',
    selector: '#layout-content',
    github: 'https://github.com/php/php-src',
    soTag: 'https://stackoverflow.com/questions/tagged/php'
  },
  mysql: {
    base: 'https://dev.mysql.com/doc/refman/8.0/en/',
    selector: '#content',
    github: 'https://github.com/mysql/mysql-server',
    soTag: 'https://stackoverflow.com/questions/tagged/mysql'
  },
  postgresql: {
    base: 'https://www.postgresql.org/docs/current/',
    selector: '#content',
    github: 'https://github.com/postgres/postgres',
    soTag: 'https://stackoverflow.com/questions/tagged/postgresql'
  },
  supabase: {
    base: 'https://supabase.com/docs/',
    selector: 'main',
    github: 'https://github.com/supabase/supabase',
    soTag: 'https://stackoverflow.com/questions/tagged/supabase'
  }
};

const seedDir = path.join(__dirname, '..', 'seed-structure');
console.log("Script started");
console.log("Looking for seed structures in:", seedDir);

const seedFiles = fs.readdirSync(seedDir).filter(f => f.endsWith('.json'));
console.log("Seed files found:", seedFiles);

function loadAllStructures() {
  const all = {};
  for (const file of seedFiles) {
    console.log("Loading structure:", file);
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
  if (lang === 'php') return `${source.base}${concept}.php`;
  if (lang === 'mysql') return `${source.base}${concept}.html`;
  if (lang === 'postgresql') return `${source.base}${concept}.html`;
  if (lang === 'supabase') return `${source.base}${concept}`;
  return null;
}

async function scrapeDocs(lang, folder, concept) {
  const source = docSources[lang];
  const url = getConceptUrl(lang, folder, concept);
  let description = null, usage = null, examples = [];
  let performance_notes = [], security_notes = [], instructions = [], tags = [];

  if (url) {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      description = $(`${source.selector} p`).first().text() || null;
      usage = $(`${source.selector} pre`).first().text() || null;

      $(`${source.selector} pre`).each((i, el) => {
        if (i < 3) examples.push({ code: $(el).text(), explanation: null });
      });

      // Try to scrape performance notes, security notes, instructions if present
      $('h2, h3').each((i, el) => {
        const heading = $(el).text().toLowerCase();
        if (heading.includes('performance')) {
          performance_notes.push($(el).next('p').text());
        }
        if (heading.includes('security')) {
          security_notes.push($(el).next('p').text());
        }
        if (heading.includes('usage') || heading.includes('how to')) {
          instructions.push({ step: i + 1, details: $(el).next('p').text() });
        }
      });

      // Generate tags from concept/lang/folder
      tags = [concept, lang, folder];
    } catch (e) {
      description = null;
      usage = null;
      examples = [];
      performance_notes = [];
      security_notes = [];
      instructions = [];
      tags = [];
      console.error(`Failed to scrape ${lang}/${folder}/${concept}: ${url}`);
    }
  }
  return { description, usage, examples, url, performance_notes, security_notes, instructions, tags };
}

// Helper to robustly assign types for all fields
function assignField(val, type) {
  if (type === "string") return typeof val === "string" ? val : "";
  if (type === "number") return typeof val === "number" ? val : null;
  if (type === "boolean") return typeof val === "boolean" ? val : null;
  if (type === "array") return Array.isArray(val) ? val : [];
  if (type === "object") return (val && typeof val === "object" && !Array.isArray(val)) ? val : {};
  return val;
}

async function main() {
  try {
    const ajv = new Ajv();
    const validate = ajv.compile(schemaValidation);

    const structure = loadAllStructures();
    let filesWritten = 0;

    for (const lang of Object.keys(structure)) {
      for (const folder of Object.keys(structure[lang])) {
        const concepts = structure[lang][folder];
        const folderPath = path.join(__dirname, '..', 'data', lang, folder);
        fs.mkdirSync(folderPath, { recursive: true });
        for (const concept of concepts) {
          if (TEST_MODE && filesWritten >= TEST_LIMIT) {
            console.log("Test mode: reached file limit, stopping early.");
            return;
          }
          const filePath = path.join(folderPath, `${concept}.json`);
          if (fs.existsSync(filePath)) {
            console.log(`File exists, skipping: ${filePath}`);
            continue;
          }
          const s = { ...schemaTemplate };
          s.id = assignField(concept, "string");
          s.name = assignField(concept, "string");
          s.language = assignField(lang, "string");
          s.category = assignField(folder, "string");
          s.framework = ['nextjs','react','tailwind'].includes(lang) ? lang : null;
          s.links = [
            { title: 'Official Docs', url: null },
            { title: 'GitHub', url: docSources[lang]?.github || null },
            { title: 'Stack Overflow', url: docSources[lang]?.soTag || null }
          ];

          // Scrape as much as possible
          const {
            description, usage, examples, url,
            performance_notes, security_notes, instructions, tags
          } = await scrapeDocs(lang, folder, concept);

          s.description = assignField(description, "string");
          s.usage = assignField(usage, "string");
          s.examples = assignField(examples, "array");
          if (url) s.links[0].url = url;
          s.performance_notes = assignField(performance_notes, "array");
          s.security_notes = assignField(security_notes, "array");
          s.instructions = assignField(instructions, "array");
          s.tags = assignField(tags, "array");

          // Heuristic/static fields
          s.priority = filesWritten + 1;
          s.frequency = "common";
          s.update_history = [{ date: new Date().toISOString(), by: "auto-populator" }];
          s.schema_version = "1.0";

          // Placeholders for future AI/LLM/manual completion
          s.use_cases = [];
          s.anti_patterns = [];
          s.ai_notes = [];
          s.logic_flows = [];
          s.decision_trees = [];
          s.preconditions = [];
          s.postconditions = [];
          s.related = [];
          s.compatibility = {};
          s.dependencies = [];
          s.metrics = {};
          s.user_feedback = [];
          s.usage_telemetry = {};
          s.media = [];
          s.voice_instructions = [];
          s.localizations = {};
          s.semantic_embedding = "";
          s.search_boost = null;
          s.related_questions = [];
          s.api_contract = "";
          s.success = null;
          s.error = "";
          s.metadata = {};
          s.common_errors = [];
          s.debugging_steps = [];
          s.error_examples = [];
          s.test_cases = [];
          s.validation_schema = {};
          s.reference_implementations = [];
          s.alternative_approaches = [];
          s.prerequisites = [];
          s.next_steps = [];
          s.environment_constraints = [];
          s.contextual_adaptations = [];
          s.reasoning_paths = [];
          s.self_assessment = {};
          s.discussion_threads = [];
          s.license = "";
          s.usage_restrictions = "";
          s.trend_score = "";
          s.deprecation_status = "";
          s.prompt_templates = [];
          s.integration_guides = [];

          fs.writeFileSync(filePath, JSON.stringify(s, null, 2));
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (!validate(data)) {
            console.error(`Validation failed for ${filePath}:`, validate.errors);
          }
          console.log(`Populated: ${filePath}`);
          filesWritten++;
        }
      }
    }
    console.log("All done!");
  } catch (err) {
    console.error("Script failed:", err);
  }
}

main();
