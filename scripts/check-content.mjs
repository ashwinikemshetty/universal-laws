// Validates chapter content: every law has its science sections, a four-part Human Mirror,
// and equations that KaTeX can parse. Run with `npm run check`.
import katex from 'katex';
import { chapters, DIMENSIONS } from '../src/content/chapters.js';

const problems = [];
const need = ['id', 'region', 'orbit', 'scientificTitle', 'poeticTitle', 'transition', 'lede', 'meaning', 'evidence', 'history', 'limitations', 'applies', 'notApplies', 'mirror'];
for (const ch of chapters) {
  for (const k of need) if (!ch[k] || (Array.isArray(ch[k]) && !ch[k].length)) problems.push(`${ch.id}: missing ${k}`);
  for (const d of DIMENSIONS) if (!ch.mirror?.[d.key]?.text) problems.push(`${ch.id}: Human Mirror missing ${d.key}`);
  for (const eq of ch.equations || []) {
    for (const t of [eq.tex, ...eq.vars.map((v) => v[0])]) {
      try { katex.renderToString(t, { throwOnError: true }); } catch (e) { problems.push(`${ch.id}: KaTeX — ${e.message}`); }
    }
  }
}
if (chapters.length !== 12) problems.push(`expected 12 chapters, found ${chapters.length}`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`✓ ${chapters.length} chapters: science, scope, limits and a four-part Human Mirror each; all equations parse.`);
