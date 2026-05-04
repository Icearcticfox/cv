#!/usr/bin/env node
// Generates site/resume.html from kirill_kashin_resume.tex

const fs = require('fs');
const path = require('path');

const TEX = path.join(__dirname, '../kirill_kashin_resume.tex');
const OUT = path.join(__dirname, '../site/resume.html');

let src = fs.readFileSync(TEX, 'utf8');

// Strip LaTeX comments (but not \% which is a literal percent sign)
src = src.replace(/(?<!\\)%[^\n]*/g, '');
src = src.replace(/\r\n/g, '\n');

// --- Balanced brace extractor ---
function extractBraced(s, start) {
  let i = start;
  while (i < s.length && s[i] !== '{') {
    if (s[i] === '\n' && !/\s/.test(s[i])) break;
    i++;
  }
  if (s[i] !== '{') return { val: '', end: start };
  let depth = 0, val = '', j = i;
  while (j < s.length) {
    const c = s[j];
    if (c === '{') { depth++; if (depth === 1) { j++; continue; } }
    else if (c === '}') { depth--; if (depth === 0) return { val: val.trim(), end: j + 1 }; }
    if (depth > 0) val += c;
    j++;
  }
  return { val: val.trim(), end: j };
}

function extractArgs(s, pos, n) {
  const args = [];
  let p = pos;
  for (let i = 0; i < n; i++) {
    const { val, end } = extractBraced(s, p);
    args.push(val);
    p = end;
  }
  return { args, end: p };
}

// --- LaTeX → plain text helpers ---
function fixDashes(t) {
  return t.replace(/---/g, '—').replace(/--/g, '–');
}

function latexToHtml(t) {
  // Handle \href{url}{\underline{text}} or \href{url}{text}
  t = t.replace(/\\href\{([^}]+)\}\{\\underline\{([^}]+)\}\}/g,
    '<a href="$1">$2</a>');
  t = t.replace(/\\href\{([^}]+)\}\{([^}]+)\}/g,
    '<a href="$1">$2</a>');
  t = t.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
  t = t.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
  t = t.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>');
  t = fixDashes(t);
  t = t.replace(/\$\|\$/g, '|');
  t = t.replace(/\\%/g, '%');
  t = t.replace(/\\\\/g, '');
  t = t.replace(/~/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

// --- Parse header ---
function parseHeader() {
  const m = src.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/);
  if (!m) return { name: '', contacts: [] };
  const center = m[1];

  // Name inside \textbf{\Huge \scshape ...}
  const nameM = center.match(/\\textbf\{\\Huge\s+\\scshape\s+([^}]+)\}/);
  const name = nameM ? nameM[1].trim() : '';

  // Contacts: \href{url}{\underline{text}}
  const contacts = [];
  const re = /\\href\{([^}]+)\}\{\\underline\{([^}]+)\}\}/g;
  let hit;
  while ((hit = re.exec(center)) !== null) {
    contacts.push({ url: hit[1], text: hit[2] });
  }

  return { name, contacts };
}

// --- Parse sections ---
function parseSections() {
  const sections = [];
  const sectionRe = /\\section\{([^}]+)\}/g;
  let m;
  const matches = [];

  while ((m = sectionRe.exec(src)) !== null) {
    matches.push({ name: m[1], start: m.index + m[0].length });
  }

  for (let i = 0; i < matches.length; i++) {
    const { name, start } = matches[i];
    const end = i + 1 < matches.length ? matches[i + 1].start : src.length;
    const body = src.slice(start, end);
    sections.push({ name, body });
  }

  return sections;
}

// --- Parse entries (Experience / Education) ---
function parseEntries(body) {
  const entries = [];
  const re = /\\resumeSubheading/g;
  let m;

  while ((m = re.exec(body)) !== null) {
    const { args, end } = extractArgs(body, m.index + m[0].length, 4);
    const [title, date, company, location] = args.map(fixDashes);

    // Find bullets between \resumeItemListStart and \resumeItemListEnd
    const after = body.slice(end);
    const listStart = after.indexOf('\\resumeItemListStart');
    const listEnd = after.indexOf('\\resumeItemListEnd');

    const bullets = [];
    if (listStart !== -1 && listEnd !== -1 && listStart < listEnd) {
      const listBody = after.slice(listStart + '\\resumeItemListStart'.length, listEnd);
      const itemRe = /\\resumeItem/g;
      let im;
      while ((im = itemRe.exec(listBody)) !== null) {
        const { val } = extractBraced(listBody, im.index + im[0].length);
        bullets.push(latexToHtml(val));
      }
    }

    entries.push({ title, date, company, location, bullets });
  }

  return entries;
}

// --- Parse skills ---
function parseSkills(body) {
  const skills = [];
  // \textbf{Key}{: values} \\
  const re = /\\textbf\{([^}]+)\}\{:\s*([^\\]+)\}/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    skills.push({ key: m[1].trim(), value: m[2].trim() });
  }
  return skills;
}

// --- Render HTML ---
function renderEntry(e) {
  const bullets = e.bullets.length
    ? `<ul>${e.bullets.map(b => `<li>${b}</li>`).join('\n')}</ul>`
    : '';
  return `
    <div class="entry">
      <div class="entry-row">
        <strong>${e.title}</strong>
        <span>${e.date}</span>
      </div>
      <div class="entry-row entry-sub">
        <em>${e.company}</em>
        <em>${e.location}</em>
      </div>
      ${bullets}
    </div>`;
}

function renderSection(sec) {
  const name = sec.name;

  if (name === 'Core Skills') {
    const skills = parseSkills(sec.body);
    const items = skills.map(s =>
      `<p><strong>${s.key}:</strong> ${s.value}</p>`
    ).join('\n');
    return `
  <section>
    <h2>${name}</h2>
    <div class="skills">
      ${items}
    </div>
  </section>`;
  }

  const entries = parseEntries(sec.body);
  return `
  <section>
    <h2>${name}</h2>
    ${entries.map(renderEntry).join('\n')}
  </section>`;
}

// --- Build output ---
const header = parseHeader();
const sections = parseSections();

const contactsHtml = header.contacts
  .map(c => `<a href="${c.url}">${c.text}</a>`)
  .join(' <span class="sep">|</span> ');

const sectionsHtml = sections.map(renderSection).join('\n');

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${header.name} — Resume</title>
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="preload" href="/fonts/cmu-serif-500-roman.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/cmu-serif-700-roman.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="./style.css" />
    <link rel="stylesheet" href="./resume.css" />
  </head>
  <body>
    <div class="layout">
      <header>
        <nav>
          <a href="./">about me</a>
          <span class="nav-sep">|</span>
          <a href="./resume.html" class="active">resume</a>
        </nav>
      </header>
      <hr />
    </div>

    <div class="resume">
      <div class="resume-header">
        <h1>${header.name}</h1>
        <div class="resume-contacts">
          ${contactsHtml}
        </div>
      </div>

      ${sectionsHtml}

      <div class="resume-footer">
        <a href="./resume.pdf">Download PDF</a>
      </div>
    </div>
  </body>
</html>
`;

fs.writeFileSync(OUT, html, 'utf8');
console.log(`Generated ${OUT}`);
