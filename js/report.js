// Volledig rapport (ontwerp §7). Dezelfde HTML wordt lokaal via de browser als pdf bewaard
// en kan later op de server (Apps Script) naar pdf worden omgezet.
import { radarSVG } from './charts/radar.js';
import { COPY, PILOT_COPY, AGENDA_URL } from './copy.js';
import {
  esc, thermometers, prioritiesBlock, flagsBlock, aiActBlock, pillarDetail, howItWorks, answerLabel,
} from './ui/blocks.js';
import { effectiveAnswer, questionText } from './engine.js';
import { pillarIcon } from './ui/pillar-art.js';

const fmtDate = (iso) => new Date(iso || Date.now()).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

// summary: de korte versie voor de deelnemer in de pilot. Zonder de uitwerking per dimensie, de verdiepende vragen en de bronnen.
export function renderReport(model, result, state, bronnen, { summary = false } = {}) {
  const req = state.request || {};
  const ctx = state.context || {};
  const agenda = /example\.invalid/.test(AGENDA_URL) ? '' : `<p class="rcta">Plan een gesprek met Iris: <a href="${esc(AGENDA_URL)}">${esc(AGENDA_URL)}</a></p>`;
  return `
  <article class="report">
    <section class="rpage rpage--first">
      <header class="rhead">
        <img src="assets/brand/gvi-logo-palette.svg" alt="GVI · Global Voice Intelligence" class="rhead__logo">
        <div><p class="eyebrow">${summary ? PILOT_COPY.report.eyebrow : 'AI-readinessscan · volledig rapport'}</p>
          <h1>${req.org ? esc(req.org) : summary ? 'Je AI-readinessscan' : 'Je AI-readinessrapport'}</h1>
          <p class="rmeta">Ingevuld door ${esc(req.name || 'onbekend')} · ${fmtDate(req.submittedAt || req.verifiedAt || state.startedAt)} · scanversie ${esc(model.version)}</p></div>
      </header>
      <div class="rgrid">
        <div><h2 class="rsub">${COPY.result.thermoTitle}</h2>${thermometers(model, result)}</div>
      </div>
      ${flagsBlock(model, result)}
      ${prioritiesBlock(model, result)}
      <div class="rradar"><h2 class="rsub">${COPY.result.webTitle(result.pillars.flatMap((p) => p.dimensions).filter((d) => d.status !== 'disabled').length)}</h2>${radarSVG(model, result, { animate: false, size: 640 })}${legendStatic(model)}</div>
      ${aiActBlock(result)}
    </section>

    ${summary ? '' : model.pillars
      .map(
        (p, i) => `<section class="rpage rpillar${i === 0 ? ' rpillar--first' : ''}">
        <h2 class="rpillar__title pc${i + 1}"><span class="ptile__icon">${pillarIcon(p.id, { size: 22 })}</span> ${esc(p.name)}${p.id === state.priority ? ' <span class="tag">jouw prioriteit</span>' : ''}</h2>
        ${pillarDetail(model, result, state, p.id, { headingLevel: 3, showTalk: false })}
      </section>`,
      )
      .join('')}

    <section class="rpage rtalk">
      <h2>Wat we in het gesprek samen bekijken</h2>
      <p>De scan geeft een eerste beeld vanuit één blik. In een gesprek van 20 tot 30 minuten maken we het concreet:</p>
      <ol class="rtalk__list">
        <li><strong>Bewijs.</strong> Bij de antwoorden die ertoe doen vragen we: kun je het laten zien? Een afspraak, een overzicht, een voorbeeld uit de praktijk.</li>
        <li><strong>Een tweede perspectief.</strong> Hoe zou een medewerker deze vragen beantwoorden? Waar verschilt dat beeld van het jouwe?</li>
        <li><strong>Je werkvraag.</strong> ${ctx.workQuestion ? `Je schreef: <em>"${esc(ctx.workQuestion)}"</em>. Daar beginnen we.` : 'Wat wil je eigenlijk bereiken met AI? Daar beginnen we.'}</li>
      </ol>
      ${summary ? `<p>${PILOT_COPY.result.nextBody}</p>` : conversationQuestions(model, result)}
      ${summary ? '' : agenda}
    </section>

    <section class="rpage rappendix">
      <h2>Bijlage A · Je antwoorden</h2>
      ${contextTable(model, ctx)}
      <p class="small muted">★ = poortvraag: een harde voorwaarde binnen de pijler.</p>
      ${answersTable(model, result, state)}
    </section>

    <section class="rpage rappendix">
      <h2>Bijlage B · Zo komt je uitslag tot stand</h2>
      ${howItWorks(result)}
      <h2>Bijlage C · Wat de scan wel en niet is</h2>
      <p><strong>Wel:</strong> ${esc(model.claims.allowed.join('; '))}.</p>
      <p><strong>Niet:</strong> geen gevalideerd instrument, geen benchmark ten opzichte van "het Nederlandse mkb", geen audit of certificering, geen oordeel over naleving van de AI-verordening en geen voorspelling van het succes van een pilot.</p>
      <p>${esc(model.claims.positioning.replace(/\s*\[[^\]]+\]/g, ''))}</p>
      <p class="muted small">${esc(model.claims.siteCopy.footnote)}</p>
      <p class="muted small">De signalen uit de AI-verordening volgen de tekst zoals gewijzigd door Verordening (EU) 2026/1744, met peildatum ${esc(model.date)}.</p>
    </section>

    ${summary ? '' : `<section class="rpage rappendix">
      <h2>Bijlage D · Bronnen</h2>
      <p class="small muted">De vragen zijn gebouwd op de bronnen hieronder, gegroepeerd per bronpakket. Welke bronnen per vraag zijn gebruikt, staat in de instrumentverantwoording van de scan.</p>
      <div class="rsources">${sourcesList(model, bronnen)}</div>
    </section>`}
  </article>`;
}

// Verdiepende vragen voor het gesprek: bij dimensies die nog niet groen zijn.
function conversationQuestions(model, result) {
  const blocks = model.pillars
    .map((p, pi) => {
      const qs = p.dimensions.flatMap((d, di) => {
        const dr = result.pillars[pi].dimensions[di];
        if (dr.status === 'disabled' || dr.color === 'green') return [];
        return d.questions.flatMap((q) => q.gesprek || []);
      });
      return qs.length ? `<li><strong>${esc(p.name)}</strong><ul>${qs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></li>` : '';
    })
    .join('');
  return blocks ? `<h3>Vragen om samen verder uit te diepen</h3><p class="small muted">Bij de onderdelen die nog niet groen zijn. De scan stelt per onderdeel één vraag. De verdieping hoort in het gesprek.</p><ul class="rtalk__deep">${blocks}</ul>` : '';
}

function legendStatic(model) {
  return `<ul class="legend rlegend">${model.pillars.map((p, i) => `<li class="pc${i + 1}"><i></i>P${i + 1} ${esc(p.name)}</li>`).join('')}</ul>`;
}

function contextTable(model, ctx) {
  const rows = model.context
    .map((c) => {
      let v = ctx[c.id];
      if (Array.isArray(v)) v = v.map((id) => c.options.find((o) => o.id === id)?.label || id).join('; ');
      else if (c.options?.length) v = c.options.find((o) => o.id === v)?.label || v;
      return `<tr><th scope="row">${esc(c.vraag.split(/(?<=\?)\s/)[0])}</th><td>${esc(v || '—')}</td></tr>`;
    })
    .join('');
  return `<h3>Over jou</h3><table class="rtable"><tbody>${rows}</tbody></table>`;
}

function answersTable(model, result, state) {
  return model.pillars
    .map(
      (p) => `<h3>P${p.id.slice(1)} · ${esc(p.name)}</h3><table class="rtable"><thead><tr><th>Vraag</th><th>Je antwoord</th></tr></thead><tbody>${p.dimensions
        .flatMap((d) =>
          d.questions.map((q) => {
            const a = effectiveAnswer(q, state.answers || {}, state.context || {}, result.derived);
            return `<tr><td><strong>${q.id}${q.gate ? ' ★' : ''}</strong> ${esc(questionText(q, result.derived))}</td><td>${esc(answerLabel(model, q, a))}</td></tr>`;
          }),
        )
        .join('')}</tbody></table>`,
    )
    .join('');
}

function sourcesList(model, bronnen) {
  if (!bronnen) return '<p>De bronnenlijst kon niet worden geladen.</p>';
  const used = new Set();
  for (const p of model.pillars) for (const d of p.dimensions) for (const q of d.questions)
    for (const s of q.sources) for (const m of s.matchAll(/\b([GMRS]\d{2})\b/g)) used.add(m[1]);
  return Object.entries(bronnen.packages)
    .filter(([code]) => used.has(code))
    .map(
      ([code, pkg]) => `<div class="rsrc"><h3><span>${code}</span> ${esc(pkg.label)}</h3><ul>${pkg.sources
        .map((s) => `<li>${esc(s.reference || s.key)}${s.incomplete ? ' <span class="muted">(gegevens onvolledig)</span>' : ''}</li>`)
        .join('')}</ul></div>`,
    )
    .join('');
}
