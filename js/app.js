// Route en schermen van de scan. Hash-routing, zodat de terugknop van de browser werkt.
import { buildConfig } from './config.js';
import { computeResult, progress, pillarComplete, deriveContext, isAutoNA, naAllowed, questionText } from './engine.js';
import * as store from './state.js';
import { COPY, PILOT_COPY } from './copy.js';
import { PILOT, isPilot, deliver, mailtoHref, mailBody } from './pilot.js';
import { radarSVG } from './charts/radar.js';
import {
  esc, thermometers, prioritiesBlock, flagsBlock, aiActBlock, pillarDetail, howItWorks, firstStepText, pillarModel,
} from './ui/blocks.js';
import { pillarIcon, shortLabel } from './ui/pillar-art.js';
import { requestCode, verifyCode, composeMail, isSimulationHost } from './delivery-sim.js';

const main = document.getElementById('main');
const progressEl = document.getElementById('progress');
let model;
let cfg;
let state = store.load();
const pilot = isPilot();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

init();

async function init() {
  try {
    model = await (await fetch('data/scan-model.v0.4.json')).json();
  } catch {
    main.innerHTML = '<p class="card">De scan kon niet laden. Ververs de pagina.</p>';
    return;
  }
  cfg = buildConfig(model);
  window.addEventListener('hashchange', route);
  route();
}

const go = (hash) => {
  if (location.hash === hash) route();
  else location.hash = hash;
};
const persist = () => store.save(state);

// ---------- router ----------

function contextComplete() {
  return model.context.filter((c) => c.type !== 'text' && c.type !== 'multi').every((c) => state.context[c.id]);
}
function allPillarsComplete() {
  return model.pillars.every((p) => pillarComplete(p, state, cfg));
}

function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [page, arg] = h.split('/');
  // Bewakers: niet verder dan je bent.
  if (['prioriteit', 'pijler', 'indienen', 'uitslag', 'rapport', 'klaar'].includes(page) && !contextComplete()) return go('#/over-jou');
  if (['pijler', 'indienen', 'uitslag', 'rapport', 'klaar'].includes(page) && !state.priority) return go('#/prioriteit');
  if (page === 'pijler') {
    const n = Number(arg);
    const firstOpen = model.pillars.findIndex((p) => !pillarComplete(p, state, cfg));
    if (!(n >= 1 && n <= 6)) return go('#/pijler/1');
    if (firstOpen !== -1 && n - 1 > firstOpen) return go(`#/pijler/${firstOpen + 1}`);
  }
  if (['indienen', 'uitslag', 'rapport', 'klaar'].includes(page) && !allPillarsComplete()) {
    const firstOpen = model.pillars.findIndex((p) => !pillarComplete(p, state, cfg));
    return go(`#/pijler/${firstOpen + 1}`);
  }
  // Pilot: de uitslag komt pas na het indienen, en de aanvraag met bevestigingscode bestaat niet.
  if (pilot) {
    if (page === 'uitslag' && !state.request?.submittedAt) return go('#/indienen');
    if (['rapport', 'klaar'].includes(page) || (page === 'indienen' && state.request?.submittedAt)) return go('#/uitslag');
  } else if (page === 'indienen') return go('#/uitslag');

  const screens = {
    '': pilot ? pilotWelcome : welcome,
    'over-jou': contextScreen,
    indienen: submitScreen,
    prioriteit: priorityScreen,
    pijler: () => pillarScreen(Number(arg)),
    uitslag: pilot ? pilotResultScreen : resultScreen,
    rapport: requestScreen,
    klaar: doneScreen,
  };
  (screens[page] || screens[''])();
  updateProgress(page, Number(arg));
  const h1 = main.querySelector('h1');
  if (h1) {
    h1.setAttribute('tabindex', '-1');
    h1.focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
}

function updateProgress(page, n) {
  if (page !== 'pijler') {
    progressEl.hidden = true;
    return;
  }
  const { done, total } = progress(model, cfg, state);
  progressEl.hidden = false;
  progressEl.innerHTML = `<div class="progress__steps" aria-hidden="true">${model.pillars
    .map((p, i) => `<span class="progress__step${i + 1 === n ? ' is-current' : ''}${pillarComplete(p, state, cfg) ? ' is-done' : ''}">${i + 1}</span>`)
    .join('')}</div>
    <div class="progress__bar" role="progressbar" aria-label="Voortgang" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-valuetext="${done} van ${total} vragen">
      <span style="--w:${(done / total) * 100}%"></span></div>
    <span class="progress__text">${done} van ${total} vragen · pijler ${n} van 6</span>`;
}

// ---------- 1. welkom ----------

// Pilot: korte opening. De gewone welkomstpagina hieronder blijft ongewijzigd.
function pilotWelcome() {
  const W = PILOT_COPY.welcome;
  const resume = store.hasProgress(state);
  main.innerHTML = `
  <section class="hero hero--solo">
    <div class="hero__text">
      <p class="eyebrow">${W.eyebrow}</p>
      <h1>${W.title}</h1>
      <p class="lead">${W.intro}</p>
      <ul class="ticks">${W.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="actions">${resume
        ? `<a class="btn btn--primary" href="#/over-jou">${W.resume}</a><button class="btn btn--ghost" type="button" data-restart>${W.restart}</button>`
        : `<a class="btn btn--primary" href="#/over-jou">${W.start}</a>`}</div>
      <p class="muted small">${W.privacy} <a href="privacy.html">${COPY.footer.privacy}</a></p>
    </div>
  </section>`;
  main.querySelector('[data-restart]')?.addEventListener('click', () => {
    if (confirm('Weet je zeker dat je opnieuw wilt beginnen? Je antwoorden worden gewist.')) {
      state = store.reset();
      go('#/over-jou');
    }
  });
}

function welcome() {
  const sc = model.claims.siteCopy;
  const W = COPY.welcome;
  const resume = store.hasProgress(state);
  const startBtns = resume
    ? `<a class="btn btn--primary" href="#/over-jou" data-resume>${W.resume}</a>
       <button class="btn btn--ghost" type="button" data-restart>${W.restart}</button>`
    : `<a class="btn btn--primary" href="#/over-jou">${W.start}</a>`;
  const headline = esc(sc.headline).replace('*', '<sup>*</sup>');
  main.innerHTML = `
  <section class="hero hero--solo">
    <div class="hero__text">
      <p class="eyebrow">${W.eyebrow}</p>
      <h1>${W.title}</h1>
      <p class="lead">${W.intro}</p>
      <div class="actions">${startBtns}</div>
    </div>
  </section>

  <section class="why" aria-labelledby="why-t">
    <h2 id="why-t">${W.whyTitle}</h2>
    ${W.why.map((x) => `<p>${esc(x)}</p>`).join('')}
  </section>

  <section class="claims" aria-labelledby="cl-t">
    <h2 class="claims__headline" id="cl-t">${headline}</h2>
    <div class="claims__grid">
      <p class="claims__item">${esc(sc.transparency)}</p>
      <p class="claims__item">${esc(W.breadth)}</p>
    </div>
  </section>

  <section class="section isnot">
    <div class="card"><h2>${W.isTitle}</h2><ul class="ticks">${W.is.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="card"><h2>${W.isNotTitle}</h2><ul class="crosses">${W.isNot.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
  </section>

  <section class="section" aria-labelledby="po-t">
    <div class="section__head"><h2 id="po-t">${W.pillarsTitle}</h2><p class="lead">${W.pillarsIntro}</p></div>
    <ol class="ptiles">${model.pillars.map((p, i) => `<li class="ptile pc${i + 1}">
      <span class="ptile__icon">${pillarIcon(p.id, { size: 30 })}</span>
      <span class="ptile__num">PIJLER ${i + 1}</span>
      <h3>${esc(p.name)}</h3>
      <p>${p.dimensions.map((d) => esc(shortLabel(d))).join(' · ')}</p></li>`).join('')}</ol>
  </section>

  <section class="section" aria-labelledby="get-t">
    <div class="section__head"><h2 id="get-t">${W.getTitle}</h2></div>
    <div class="get">
      <div class="card"><h3><span>Direct</span> ${W.getNow.title}</h3><ul class="ticks">${W.getNow.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="card"><h3><span>Gratis</span> ${W.getMail.title}</h3><ul class="ticks">${W.getMail.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>
  </section>

  <section class="iris" aria-label="${esc(W.irisCaption)}">
    <figure class="hero__photo">
      <div class="hero__frame"><img src="assets/iris-portret.jpg" alt="Portret van Iris Ficker Younge" width="340" height="425" loading="lazy"></div>
      <figcaption>${W.irisCaption}</figcaption>
    </figure>
    <p class="iris__note">${esc(W.irisNote)}</p>
  </section>

  <section class="section" aria-labelledby="st-t">
    <div class="section__head"><h2 id="st-t">${W.stepsTitle}</h2></div>
    <ol class="steps">${W.steps.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ol>
  </section>

  <section class="section" aria-labelledby="cmp-t">
    <div class="section__head"><h2 id="cmp-t">${W.compareTitle}</h2></div>
    <table class="compare"><thead><tr>${W.compareHead.map((h) => `<th scope="col">${h ? esc(h) : '<span class="sr-only">Onderwerp</span>'}</th>`).join('')}</tr></thead>
      <tbody>${W.compare.map(([k, a, b]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table>
  </section>

  <section class="section faq" aria-labelledby="faq-t">
    <div class="section__head"><h2 id="faq-t">${W.faqTitle}</h2></div>
    ${W.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
  </section>

  <section class="cta-band" aria-labelledby="cta-t">
    <div><h2 id="cta-t">${W.ctaTitle}</h2><p>${W.ctaBody}</p></div>
    <div class="actions">${resume ? `<a class="btn btn--signal" href="#/over-jou">${W.resume}</a>` : `<a class="btn btn--signal" href="#/over-jou">${W.start}</a>`}</div>
  </section>

  <p class="footnote">${esc(sc.footnote)}</p>
  <section class="privacy-block" aria-labelledby="pv-t">
    <h2 id="pv-t">${W.privacyTitle}</h2>
    <p>${W.privacyBody} <a href="privacy.html">${W.privacyLink}</a>.</p>
  </section>`;
  main.querySelector('[data-restart]')?.addEventListener('click', () => {
    if (confirm('Weet je zeker dat je opnieuw wilt beginnen? Je antwoorden worden gewist.')) {
      state = store.reset();
      go('#/over-jou');
    }
  });
}

// ---------- 2. over jou ----------

function contextScreen() {
  const fields = model.context.map((c) => contextField(c)).join('');
  main.innerHTML = `
  <header class="screen-head"><p class="eyebrow">Voor je begint · 1 van 2</p><h1>${COPY.context.title}</h1><p class="lead">${COPY.context.intro}</p></header>
  <form class="stack" id="ctx" novalidate>
    ${fields}
    <p class="form-error" role="alert" hidden></p>
    <div class="actions actions--split"><a class="btn btn--ghost" href="#/">${COPY.pillar.back}</a>
      <button class="btn btn--primary" type="submit">Verder</button></div>
  </form>`;
  const form = main.querySelector('#ctx');
  form.addEventListener('change', (e) => {
    const t = e.target;
    const id = t.name;
    const c = model.context.find((x) => x.id === id);
    if (!c) return;
    if (c.type === 'multi') {
      let vals = [...form.querySelectorAll(`input[name="${id}"]:checked`)].map((i) => i.value);
      const excl = c.options.find((o) => o.exclusive)?.id;
      if (excl && t.checked) {
        vals = t.value === excl ? [excl] : vals.filter((v) => v !== excl);
        form.querySelectorAll(`input[name="${id}"]`).forEach((i) => (i.checked = vals.includes(i.value)));
      }
      state.context[id] = vals;
    } else {
      state.context[id] = t.value;
    }
    if (!state.startedAt) state.startedAt = new Date().toISOString();
    persist();
  });
  form.querySelector('textarea')?.addEventListener('input', (e) => {
    state.context.workQuestion = e.target.value.slice(0, 600);
    persist();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = model.context.filter((c) => c.type !== 'text' && c.type !== 'multi' && !state.context[c.id]);
    const err = form.querySelector('.form-error');
    form.querySelectorAll('.is-missing').forEach((x) => x.classList.remove('is-missing'));
    if (missing.length) {
      err.hidden = false;
      err.textContent = `Nog niet ingevuld: ${missing.map((m) => m.vraag.split('?')[0].replace(/^(Wat|Hoe|In welke|Gebruik je)\s*/i, '').trim()).join(', ')}.`;
      missing.forEach((m) => form.querySelector(`#f-${m.id}`)?.classList.add('is-missing'));
      form.querySelector(`#f-${missing[0].id} input`)?.focus();
      return;
    }
    go('#/prioriteit');
  });
}

function contextField(c) {
  const proposedTag = '';
  const v = state.context[c.id];
  if (c.type === 'text') {
    return `<div class="field" id="f-${c.id}"><label for="in-${c.id}" class="field__label">${esc(c.vraag)} <span class="muted">(${COPY.context.optional})</span>${proposedTag}</label>
      <textarea id="in-${c.id}" name="${c.id}" rows="3" maxlength="600" placeholder="${esc(COPY.context.workQuestionPlaceholder)}">${esc(v || '')}</textarea></div>`;
  }
  const multi = c.type === 'multi';
  const type = multi ? 'checkbox' : 'radio';
  const [label, ...rest] = c.vraag.split(/(?<=\?)\s/);
  const opts = c.options
    .map((o) => {
      const checked = multi ? (v || []).includes(o.id) : v === o.id;
      return `<label class="opt opt--compact"><input type="${type}" name="${c.id}" value="${esc(o.id)}"${checked ? ' checked' : ''}><span>${esc(o.label)}</span></label>`;
    })
    .join('');
  return `<fieldset class="field" id="f-${c.id}"><legend class="field__label">${esc(label)}${multi ? ` <span class="muted">(${COPY.context.optional})</span>` : ''}${proposedTag}</legend>
    ${rest.length ? `<p class="field__help">${esc(rest.join(' '))}</p>` : ''}
    <div class="opts ${c.options.length > 4 ? 'opts--grid' : 'opts--row'}">${opts}</div></fieldset>`;
}

// ---------- 3. prioriteit ----------

function priorityScreen() {
  const pq = model.priorityQuestion;
  main.innerHTML = `
  <header class="screen-head"><p class="eyebrow">Voor je begint · 2 van 2</p><h1>${COPY.priority.title}</h1><p class="lead">${pilot ? PILOT_COPY.priorityIntro : COPY.priority.intro}</p></header>
  <form id="prio" class="stack">
    <fieldset class="field"><legend class="sr-only">${esc(pq.text)}</legend>
      <div class="opts opts--cards">${pq.options
        .map((o, i) => {
          const p = model.pillars[i];
          return `<label class="opt opt--card"><input type="radio" name="priority" value="${o.id}"${state.priority === o.id ? ' checked' : ''}>
          <span class="opt__num">${i + 1}</span><span class="opt__title">${esc(o.label)}</span>
          <span class="opt__desc">${esc(p.dimensions.map((d) => d.name).join(' · '))}</span></label>`;
        })
        .join('')}</div></fieldset>
    <p class="form-error" role="alert" hidden></p>
    <div class="actions actions--split"><a class="btn btn--ghost" href="#/over-jou">${COPY.pillar.back}</a>
      <button class="btn btn--primary" type="submit">Naar de vragen</button></div>
  </form>`;
  const form = main.querySelector('#prio');
  form.addEventListener('change', (e) => {
    state.priority = e.target.value;
    persist();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.priority) {
      const err = form.querySelector('.form-error');
      err.hidden = false;
      err.textContent = 'Kies één pijler.';
      form.querySelector('input')?.focus();
      return;
    }
    const firstOpen = model.pillars.findIndex((p) => !pillarComplete(p, state, cfg));
    go(firstOpen === -1 ? (pilot ? '#/indienen' : '#/uitslag') : `#/pijler/${firstOpen + 1}`);
  });
}

// ---------- 4. pijlers ----------

function pillarScreen(n) {
  const p = model.pillars[n - 1];
  const derived = deriveContext(cfg, state.context);
  const last = n === 6;
  main.innerHTML = `
  <header class="screen-head pc${n}"><p class="eyebrow eyebrow--pillar"><span class="ptile__icon ptile__icon--s">${pillarIcon(p.id, { size: 18 })}</span> Pijler ${n} van 6</p><h1>${esc(p.name)}</h1>
    <p class="lead">${esc(p.intro)}</p>
    ${derived.isSolo && p.zzpNote ? `<p class="note">${esc(p.zzpNote)}</p>` : ''}
    ${n === 1
      ? `<div class="scale-help scale-help--open"><h2>${COPY.pillar.helpTitle}</h2>${scaleHelp()}</div>`
      : `<details class="scale-help"><summary>${COPY.pillar.helpTitle}</summary>${scaleHelp()}</details>`}
  </header>
  <form id="qs" class="stack" novalidate>
    ${p.dimensions.map((d) => dimensionBlock(d, derived)).join('')}
    <p class="form-error" role="alert" hidden></p>
    <div class="actions actions--split">
      <a class="btn btn--ghost" href="${n === 1 ? '#/prioriteit' : `#/pijler/${n - 1}`}">${COPY.pillar.back}</a>
      <button class="btn btn--primary" type="submit">${last ? (pilot ? PILOT_COPY.toSubmit : COPY.pillar.toResult) : COPY.pillar.next}</button></div>
  </form>`;
  const form = main.querySelector('#qs');
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (!t.name?.startsWith('q-')) return;
    const id = t.name.slice(2);
    state.answers[id] = /^[0-3]$/.test(t.value) ? Number(t.value) : t.value;
    // Pilot: na een wijziging moet de scan opnieuw worden ingediend, anders heeft Iris een oude versie.
    if (pilot && state.request?.submittedAt) state.request = { ...state.request, submittedAt: null, verified: false, changed: true };
    t.closest('.question')?.classList.remove('is-missing');
    persist();
    updateProgress('pijler', n);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = [...form.querySelectorAll('.question[data-required]')].filter(
      (el) => state.answers[el.dataset.q] === undefined,
    );
    form.querySelectorAll('.is-missing').forEach((x) => x.classList.remove('is-missing'));
    if (missing.length) {
      const err = form.querySelector('.form-error');
      err.hidden = false;
      err.textContent = `${COPY.pillar.incomplete} (${missing.length} open)`;
      missing.forEach((m) => m.classList.add('is-missing'));
      missing[0].querySelector('input')?.focus();
      return;
    }
    go(last ? (pilot ? '#/indienen' : '#/uitslag') : `#/pijler/${n + 1}`);
  });
}

// Invulinstructie: bij pijler 1 altijd open, daarna inklapbaar.
function scaleHelp() {
  return `<p>${esc(model.scale.instruction)}</p>
    <p>${esc(model.scale.ladder)}</p>
    <p>${esc(model.scale.unknownHelp)}</p>`;
}

function dimensionBlock(d, derived) {
  return `<section class="dimblock" aria-labelledby="dh-${d.id}">
    <div class="dimblock__head"><h2 id="dh-${d.id}">${esc(d.name)}</h2><span class="dimblock__term">${esc(d.term)}</span></div>
    ${d.explainer ? `<p class="field__help">${esc(capitalize(d.explainer))}</p>` : ''}
    ${d.questions.map((q) => questionBlock(q, derived)).join('')}
  </section>`;
}

function questionBlock(q, derived) {
  const auto = isAutoNA(q, state.context, derived);
  const a = state.answers[q.id];
  const name = `q-${q.id}`;
  const text = questionText(q, derived);
  if (auto) {
    const why = q.na.autoWhen.some((w) => w.startsWith('orgType')) ? COPY.pillar.autoNA.solo : COPY.pillar.autoNA.agents;
    return `<div class="question question--auto"><p class="question__text"><span class="question__id">${q.id}</span> ${esc(text)}</p>
      <p class="auto-na"><span aria-hidden="true">—</span> ${why}</p></div>`;
  }
  const levels = q.anchors
    .map(
      (anchor, i) => `<label class="opt opt--level"><input type="radio" name="${name}" value="${i}"${a === i ? ' checked' : ''}>
      <span class="opt__level">${i}</span><span class="opt__anchor">${esc(anchor)}</span></label>`,
    )
    .join('');
  const extra = `<label class="opt opt--extra"><input type="radio" name="${name}" value="unknown"${a === 'unknown' ? ' checked' : ''}><span>${COPY.levels.unknown}</span></label>
    ${naAllowed(q) ? `<label class="opt opt--extra"><input type="radio" name="${name}" value="na"${a === 'na' ? ' checked' : ''}><span>${COPY.levels.na}</span></label>` : ''}`;
  // Poortvragen en bronnen zijn bewust onzichtbaar tijdens het invullen (geen sturing van antwoorden).
  return `<fieldset class="question" data-q="${q.id}" data-required>
    <legend class="question__text"><span class="question__id">${q.id}</span> ${esc(text)}</legend>
    ${q.na?.condition ? `<p class="field__help">Kies "Niet van toepassing" ${esc(q.na.condition.replace(/^n\.v\.t\.\s*/, ''))}.</p>` : ''}
    <div class="levels">${levels}</div>
    <div class="extras">${extra}</div>
  </fieldset>`;
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- 5a. pilot: indienen en samenvatting ----------

function submitScreen() {
  const S = PILOT_COPY.submit;
  const r = state.request || {};
  main.innerHTML = `
  <header class="screen-head"><p class="eyebrow">${S.eyebrow}</p><h1>${S.title}</h1><p class="lead">${S.intro}</p></header>
  ${r.changed ? `<p class="note">${PILOT_COPY.result.changed}</p>` : ''}
  <form id="submit" class="card stack narrow" novalidate>
    <div class="field"><label class="field__label" for="s-name">${S.name}</label><input id="s-name" name="name" autocomplete="name" required value="${esc(r.name || '')}"></div>
    <div class="field"><label class="field__label" for="s-org">${S.org} <span class="muted">(${COPY.context.optional})</span></label><input id="s-org" name="org" autocomplete="organization" value="${esc(r.org || '')}"></div>
    <p>${S.consent}</p>
    ${PILOT.endpoint ? '' : `<p class="muted small">${S.how}</p>`}
    <p class="form-error" role="alert" hidden></p>
    <div class="actions actions--split"><a class="btn btn--ghost" href="#/pijler/6">${S.back}</a>
      <button class="btn btn--primary" type="submit">${S.button}</button></div>
    <p class="muted small" data-mail-way hidden>${S.mailWay} <button class="linklike" type="submit" data-via-mail>${S.mailWayCta}</button></p>
  </form>`;
  const form = main.querySelector('#submit');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    if (!name) {
      const err = form.querySelector('.form-error');
      err.hidden = false;
      err.textContent = S.missing;
      form.name.focus();
      return;
    }
    const now = new Date().toISOString();
    const request = { name, org: form.org.value.trim(), submittedAt: now, verifiedAt: now, verified: true };
    const btn = form.querySelector('button[type=submit]');
    const err = form.querySelector('.form-error');
    const viaMail = e.submitter?.hasAttribute('data-via-mail');
    // Zonder ontvanger, of als de deelnemer na mislukte pogingen voor de mail kiest: een kant-en-klare mail aan Iris.
    if (!PILOT.endpoint || viaMail) {
      state.request = { ...request, delivered: false };
      persist();
      openMail();
      return go('#/uitslag');
    }
    btn.disabled = true;
    btn.textContent = S.busy;
    err.hidden = true;
    const delivered = await deliver({ ...state, request });
    if (delivered) {
      state.request = { ...request, delivered: true };
      persist();
      return go('#/uitslag');
    }
    // Niet aangekomen: de uitslag blijft dicht tot het indienen is gelukt. Na de eerste mislukte poging komt de mail als uitweg erbij.
    state.request = { name: request.name, org: request.org, submittedAt: null, verified: false };
    persist();
    btn.disabled = false;
    btn.textContent = S.retry;
    err.hidden = false;
    err.textContent = S.failed;
    form.querySelector('[data-mail-way]').hidden = false;
  });
}

function openMail() {
  const a = document.createElement('a');
  a.href = mailtoHref(state);
  a.click();
}

function sentNotice() {
  const T = PILOT_COPY.sent;
  if (state.request?.delivered) return `<section class="card notice notice--ok" role="status"><h2>${T.autoTitle}</h2><p>${T.autoBody}</p></section>`;
  const to = esc(PILOT.to);
  return `<section class="card notice" role="status"><h2>${T.mailTitle}</h2><p>${T.mailBody}</p>
    <div class="actions"><button class="btn btn--primary" type="button" data-mail>${T.mailAgain}</button>
      <button class="btn btn--ghost" type="button" data-copy>${T.copy}</button></div>
    <p class="muted small" data-copy-note>${T.noMail} <strong>${to || 'Iris'}</strong>.</p></section>`;
}

function pilotResultScreen() {
  const result = computeResult(model, cfg, state);
  const R = PILOT_COPY.result;
  const narrow = matchMedia('(max-width: 700px)').matches;
  const activeDims = result.pillars.flatMap((p) => p.dimensions).filter((d) => d.status !== 'disabled').length;
  main.innerHTML = `
  <header class="screen-head"><p class="eyebrow">Je uitslag</p><h1>Hier staat je organisatie nu</h1></header>

  ${sentNotice()}

  <section class="card overview-card" aria-labelledby="t-t">
    <h2 id="t-t">${COPY.result.thermoTitle}</h2>
    ${thermometers(model, result)}
  </section>

  ${flagsBlock(model, result)}

  ${prioritiesBlock(model, result)}

  <section class="card radar-card" aria-labelledby="w-t">
    <h2 id="w-t">${COPY.result.webTitle(activeDims)}</h2>
    <p class="muted small">${COPY.result.webHelp}</p>
    <div class="radar-wrap">${radarSVG(model, result, { animate: !reducedMotion, labels: narrow ? 'id' : 'name' })}</div>
    ${legend()}
    ${narrow ? dimList(result) : ''}
  </section>

  ${aiActBlock(result)}

  <section class="teaser" aria-labelledby="sv-t">
    <h2 id="sv-t">${R.saveTitle}</h2>
    <p>${R.saveBody}</p>
    <a class="btn btn--primary btn--light" href="rapport.html?kort" target="_blank" rel="noopener">${R.saveCta}</a>
  </section>

  <section class="card" aria-labelledby="nx-t"><h2 id="nx-t">${R.nextTitle}</h2><p>${R.nextBody}</p></section>

  <details class="card how-card"><summary><h2>${COPY.result.howTitle}</h2></summary>${howItWorks(result)}</details>

  <div class="actions"><a class="btn btn--ghost" href="#/pijler/1">${COPY.result.edit}</a></div>`;
  main.querySelector('[data-mail]')?.addEventListener('click', openMail);
  main.querySelector('[data-copy]')?.addEventListener('click', async () => {
    const note = main.querySelector('[data-copy-note]');
    try {
      await navigator.clipboard.writeText(mailBody(state));
      note.innerHTML = `${PILOT_COPY.sent.copied} <strong>${esc(PILOT.to) || 'Iris'}</strong>.`;
    } catch {
      note.textContent = mailBody(state);
    }
  });
}

// ---------- 5. uitslag ----------

function resultScreen() {
  const result = computeResult(model, cfg, state);
  const prio = pillarModel(model, state.priority);
  const narrow = matchMedia('(max-width: 700px)').matches;
  const activeDims = result.pillars.flatMap((p) => p.dimensions).filter((d) => d.status !== 'disabled').length;
  main.innerHTML = `
  <header class="screen-head"><p class="eyebrow">Je uitslag</p><h1>Hier staat je organisatie nu</h1></header>

  <section class="card overview-card" aria-labelledby="t-t">
    <h2 id="t-t">${COPY.result.thermoTitle}</h2>
    ${thermometers(model, result)}
  </section>

  ${flagsBlock(model, result)}

  ${prioritiesBlock(model, result)}

  <section class="card radar-card" aria-labelledby="w-t">
    <h2 id="w-t">${COPY.result.webTitle(activeDims)}</h2>
    <p class="muted small">${COPY.result.webHelp}</p>
    <div class="radar-wrap">${radarSVG(model, result, { animate: !reducedMotion, labels: narrow ? 'id' : 'name' })}</div>
    ${legend()}
    ${narrow ? dimList(result) : ''}
  </section>


  <section class="card card--wide" aria-labelledby="d-t">
    <h2 id="d-t">${esc(COPY.result.detailTitle(prio.name))}</h2>
    ${pillarDetail(model, result, state, state.priority, { headingLevel: 3 })}
  </section>

  ${aiActBlock(result)}

  <section class="teaser" aria-labelledby="te-t">
    <h2 id="te-t">${COPY.result.teaserTitle}</h2>
    <p>${COPY.result.teaserBody}</p>
    <a class="btn btn--primary btn--light" href="#/rapport">${COPY.result.teaserCta}</a>
  </section>

  <details class="card how-card"><summary><h2>${COPY.result.howTitle}</h2></summary>${howItWorks(result)}</details>

  <div class="actions"><a class="btn btn--ghost" href="#/pijler/1">${COPY.result.edit}</a></div>`;
}

function dimList(result) {
  return `<details class="dimlist"><summary>Alle dimensies als lijst</summary><ol>${model.pillars
    .map((p, pi) => p.dimensions
      .map((d, di) => {
        const r = result.pillars[pi].dimensions[di];
        if (r.status === 'disabled') return '';
        return `<li class="pc${pi + 1}"><span class="dimlist__id">${d.id.replace('D', '')}</span> ${esc(shortLabel(d))} <strong class="dimlist__v">${r.status === 'grey' ? '?' : Math.round((r.score / 100) * 3)}</strong></li>`;
      }).join(''))
    .join('')}</ol></details>`;
}

function legend() {
  return `<ul class="legend" aria-label="Pijlers">${model.pillars
    .map((p, i) => `<li class="pc${i + 1}"><i aria-hidden="true"></i>P${i + 1} ${esc(p.name)}</li>`)
    .join('')}</ul>`;
}

// ---------- 6. rapport aanvragen ----------

function requestScreen() {
  const r = state.request || {};
  main.innerHTML = `
  <header class="screen-head"><p class="eyebrow">Volledig rapport</p><h1>${COPY.request.title}</h1><p class="lead">${COPY.request.intro}</p></header>
  <form id="req" class="stack narrow" novalidate>
    <div class="field"><label class="field__label" for="r-name">${COPY.request.name}</label>
      <input id="r-name" name="name" autocomplete="name" maxlength="80" required value="${esc(r.name || '')}"></div>
    <div class="field"><label class="field__label" for="r-org">${COPY.request.org} <span class="muted">(${COPY.context.optional})</span></label>
      <input id="r-org" name="org" autocomplete="organization" maxlength="120" value="${esc(r.org || '')}"></div>
    <div class="field"><label class="field__label" for="r-email">${COPY.request.email}</label>
      <input id="r-email" name="email" type="email" autocomplete="email" required value="${esc(r.email || '')}"></div>
    <label class="check"><input type="checkbox" name="reportConsent" required> <span>${COPY.request.reportConsent}</span></label>
    <label class="check"><input type="checkbox" name="news"> <span>${COPY.request.newsConsent}</span></label>
    <p class="small"><a href="privacy.html" target="_blank" rel="noopener">${COPY.request.privacyLink}</a></p>
    <p class="form-error" role="alert" hidden></p>
    <div class="actions actions--split"><a class="btn btn--ghost" href="#/uitslag">${COPY.pillar.back}</a>
      <button class="btn btn--primary" type="submit">${COPY.request.submit}</button></div>
  </form>
  <div id="code-step"></div>`;
  const form = main.querySelector('#req');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const err = form.querySelector('.form-error');
    const email = String(fd.get('email') || '').trim();
    const name = String(fd.get('name') || '').trim();
    const problems = [];
    if (!name) problems.push('je naam');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) problems.push('een geldig e-mailadres');
    if (!fd.get('reportConsent')) problems.push('het vakje voor de rapportaanvraag');
    if (problems.length) {
      err.hidden = false;
      err.textContent = `Vul nog in: ${problems.join(', ')}.`;
      return;
    }
    err.hidden = true;
    state.request = { name, org: String(fd.get('org') || '').trim(), email, news: !!fd.get('news'), verified: false };
    persist();
    const { code } = requestCode(email);
    showSim({ code });
    codeStep(email);
  });
}

function codeStep(email) {
  const box = main.querySelector('#code-step');
  box.innerHTML = `<form id="code" class="card stack narrow" novalidate aria-labelledby="c-t">
    <h2 id="c-t">${COPY.request.codeTitle}</h2><p>${esc(COPY.request.codeIntro(email))}</p>
    <div class="field"><label class="field__label" for="c-in">${COPY.request.codeLabel}</label>
      <input id="c-in" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" class="code-input"></div>
    <p class="form-error" role="alert" hidden></p>
    <div class="actions"><button class="btn btn--primary" type="submit">${COPY.request.codeSubmit}</button>
      <button class="btn btn--ghost" type="button" data-resend>${COPY.request.resend}</button></div></form>`;
  box.querySelector('#c-in').focus();
  box.querySelector('[data-resend]').addEventListener('click', () => {
    const { code } = requestCode(email);
    showSim({ code });
  });
  box.querySelector('#code').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = verifyCode(box.querySelector('#c-in').value);
    const err = box.querySelector('.form-error');
    if (!v.ok) {
      err.hidden = false;
      err.textContent = v.expired ? COPY.request.codeExpired : COPY.request.codeWrong(v.left);
      return;
    }
    state.request.verified = true;
    state.request.verifiedAt = new Date().toISOString();
    persist();
    const result = computeResult(model, cfg, state);
    const mail = composeMail({ name: state.request.name, email: state.request.email, firstStepText: firstStepText(model, result) });
    showSim({ mail });
    go('#/klaar');
  });
}

// ---------- 7. klaar ----------

function doneScreen() {
  if (!state.request?.verified) return go('#/rapport');
  main.innerHTML = `
  <header class="screen-head"><p class="eyebrow">Gelukt</p><h1>${COPY.request.doneTitle}</h1><p class="lead">${COPY.request.doneBody}</p></header>
  <div class="actions"><a class="btn btn--primary" href="rapport.html" target="_blank" rel="noopener">${COPY.request.openReport}</a>
    <a class="btn btn--ghost" href="#/uitslag">Terug naar je uitslag</a></div>`;
}

// ---------- testpaneel (alleen lokaal of met ?test) ----------

function showSim({ code, mail }) {
  if (!isSimulationHost()) return;
  let panel = document.getElementById('sim');
  if (!panel) {
    panel = document.createElement('aside');
    panel.id = 'sim';
    panel.className = 'sim';
    panel.setAttribute('aria-label', COPY.sim.title);
    document.body.appendChild(panel);
  }
  panel.innerHTML = `<div class="sim__head"><strong>${COPY.sim.title}</strong><button type="button" class="sim__close" aria-label="Sluit testpaneel">×</button></div>
    <p class="small">${COPY.sim.note}</p>
    ${code ? `<p>${COPY.sim.code}: <code class="sim__code">${code}</code></p>` : ''}
    ${mail ? `<p class="small"><strong>${COPY.sim.mail}</strong><br>Aan: ${esc(mail.to)}<br>Onderwerp: ${esc(mail.subject)}<br>Bijlage: ${esc(mail.attachment)}</p><pre class="sim__mail">${esc(mail.body)}</pre>` : ''}`;
  panel.querySelector('.sim__close').addEventListener('click', () => panel.remove());
}
