import katex from 'katex';
import { DIMENSIONS, ROMAN } from '../content/chapters.js';
import { store } from './store.js';

/*
 * Renders a chapter into the folio: THE LAW (science) and THE HUMAN MIRROR (reflection).
 * The two are separate tabs with distinct typography so they can never be confused.
 */

const tex = (s, display = false) => katex.renderToString(s, { displayMode: display, throwOnError: false, output: 'html' });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function lawHTML(ch, index, total) {
  const eqs = (ch.equations || [])
    .map(
      (e) => `
      <figure class="equation">
        ${tex(e.tex, true)}
        <figcaption>${e.caption}</figcaption>
        <dl class="vars">${e.vars.map(([sym, meaning]) => `<dt>${tex(sym)}</dt><dd>${meaning}</dd>`).join('')}</dl>
      </figure>`
    )
    .join('');

  const open = ch.openQuestions
    ? `<section class="f-section"><h4>Open questions</h4><ol class="open-q">${ch.openQuestions
        .map(([q, a]) => `<li><h5>${q}</h5><p>${a}</p></li>`)
        .join('')}</ol></section>`
    : '';

  return `
    <header class="f-head">
      <p class="micro">Chapter ${ROMAN[index]} · ${esc(ch.region)}</p>
      <p class="f-sci">${esc(ch.scientificTitle)}</p>
      <h3 class="f-poetic">${esc(ch.poeticTitle)}</h3>
      <p class="f-lede">${ch.lede}${ch.edgeLine ? ` ${ch.edgeLine}` : ''}</p>
    </header>

    <section class="f-section"><h4>What it says</h4>${ch.meaning.map((p) => `<p>${p}</p>`).join('')}</section>
    ${open}
    ${eqs ? `<section class="f-section"><h4>${ch.id === 'unknown' ? 'The measured budget' : 'In mathematics'}</h4>${eqs}</section>` : ''}
    <section class="f-section"><h4>How we know</h4>${ch.evidence.map((p) => `<p>${p}</p>`).join('')}
      <ol class="timeline">${ch.history.map(([y, who, what]) => `<li><b>${y}</b><i>${who}</i> — ${what}</li>`).join('')}</ol>
    </section>
    <section class="f-section"><h4>Limits of the law</h4><div class="limit"><p>${ch.limitations}</p></div></section>
    <section class="f-section"><h4>Scope</h4>
      <div class="scope">
        <div class="yes"><h5>Where it applies</h5><ul>${ch.applies.map((x) => `<li>${x}</li>`).join('')}</ul></div>
        <div class="no"><h5>Where it does not directly apply</h5><ul>${ch.notApplies.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      </div>
    </section>
    ${ch.imagery ? `<p class="figure-credit" data-imagery-credit hidden>${ch.imagery.caption}<span>Image · ${ch.imagery.credit}</span></p>` : ''}
    <div class="f-next">
      <button type="button" class="ghost-btn primary" data-action="show-mirror">The Human Mirror →</button>
    </div>
  `;
}

export function mirrorItemHTML(ch, dim, { showChapter = false } = {}) {
  const m = ch.mirror[dim.key];
  const kept = store.isKept(ch.id, dim.key);
  const chain = m.chain ? `<div class="chain">${m.chain.map((c) => `<span>${c}</span>`).join('<i>→</i>')}</div>` : '';
  return `
    <div class="mirror-item ${dim.key === 'belief' ? 'is-belief' : ''}">
      <p class="micro"><span class="glyph" aria-hidden="true">${dim.glyph}</span>${dim.name}${showChapter ? ` <span class="chapter-tag">· ${esc(ch.poeticTitle)}</span>` : ''}</p>
      <h5>${dim.key === 'belief' ? `“${esc(m.text)}”` : esc(m.label)}</h5>
      ${dim.key === 'belief' ? '' : `<p>${esc(m.text)}</p>`}
      ${chain}
      <button type="button" class="keep" data-keep="${ch.id}:${dim.key}" aria-pressed="${kept}">${kept ? 'In your constellation' : 'Keep as a star'}</button>
    </div>`;
}

export function mirrorHTML(ch, index, total, nextLabel) {
  return `
    <header class="f-head">
      <p class="micro">Chapter ${ROMAN[index]} · The Human Mirror</p>
      <p class="f-sci">Inspired by ${esc(ch.scientificTitle)}</p>
      <h3 class="f-poetic">${esc(ch.poeticTitle)}</h3>
    </header>
    <p class="mirror-disclaimer"><b>A reflection, not a scientific claim</b>
      What follows is philosophy inspired by the science above. Physics does not prove a feeling, prescribe an action, or validate a belief —
      but its ideas can be good company for thinking.</p>
    ${DIMENSIONS.map((d) => mirrorItemHTML(ch, d)).join('')}
    <div class="f-next">
      <button type="button" class="ghost-btn" data-action="show-law">← The Law</button>
      <button type="button" class="ghost-btn primary" data-action="next">${nextLabel} →</button>
    </div>
  `;
}

export function syncKeepButtons(root = document) {
  root.querySelectorAll('[data-keep]').forEach((b) => {
    const [id, dim] = b.dataset.keep.split(':');
    const kept = store.isKept(id, dim);
    b.setAttribute('aria-pressed', String(kept));
    b.textContent = kept ? 'In your constellation' : 'Keep as a star';
  });
}
