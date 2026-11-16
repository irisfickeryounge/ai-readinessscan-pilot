// Bouwstenen voor uitslag én rapport (HTML-strings). Eén renderer voor scherm en pdf.
import { COPY } from '../copy.js';
import { pillarIcon, shortLabel, gviStar } from './pillar-art.js';
import { DIM, GATE_WHY, FLAG_TEXT, GREY_ADVICE } from '../content/duiding.js';
import { questionText, effectiveAnswer, dimLevel } from '../engine.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const pillarModel = (model, id) => model.pillars.find((p) => p.id === id);
export const pillarResult = (result, id) => result.pillars.find((p) => p.id === id);
export function dimModel(model, id) {
  for (const p of model.pillars) for (const d of p.dimensions) if (d.id === id) return d;
  return null;
}
export function questionModel(model, id) {
  for (const p of model.pillars) for (const d of p.dimensions) for (const q of d.questions) if (q.id === id) return q;
  return null;
}

export function badge(color, { long = false } = {}) {
  if (!color) return `<span class="badge badge--disabled">${COPY.status.disabled}</span>`;
  const text = long ? COPY.statusLong[color] : COPY.status[color];
  return `<span class="badge badge--${color}">${esc(text)}</span>`;
}

export function answerLabel(model, q, a) {
  if (a === 'unknown' || a === undefined) return COPY.levels.unknown;
  if (a === 'na') return COPY.levels.na;
  return `${a} · ${q.anchors[a]}`;
}

// ---------- pijleroverzicht (in één oogopslag) ----------

export function thermometers(model, result) {
  // Besluit Iris 16-11-2026: zes staven naast elkaar, per pijler alleen score, kleur en naam (met sterretje als de basis aandacht vraagt).
  const t = result.cfg.thresholds;
  return `<ol class="bars">${model.pillars
    .map((p, i) => {
      const r = result.pillars[i];
      const off = r.status === 'disabled';
      const grey = r.color === 'grey' || off;
      const val = grey ? null : r.score;
      const status = off ? COPY.status.disabled : grey ? COPY.status.grey : COPY.status[r.color];
      const star = r.gate?.triggered;
      return `<li class="bar bar--${r.color || 'disabled'}">
        <span class="bar__score">${val === null ? (off ? '–' : '?') : `${val}<small>/100</small>`}</span>
        <span class="bar__track" role="img" aria-label="${esc(p.name)}: ${val === null ? status : `${val} van 100, ${status}`}${star ? ', de basis vraagt nog aandacht' : ''}"><span class="bar__fill" style="--h:${val ?? 100}%"></span></span>
        <span class="bar__name">${esc(p.name)}${star ? `&nbsp;${gviStar({ size: 13 })}` : ''}</span>
      </li>`;
    })
    .join('')}</ol>
    <ul class="statlegend" aria-label="Legenda">
      <li class="statlegend--red"><i aria-hidden="true"></i>rood 0–${t.red - 1}</li>
      <li class="statlegend--orange"><i aria-hidden="true"></i>oranje ${t.red}–${t.green - 1}</li>
      <li class="statlegend--green"><i aria-hidden="true"></i>groen ${t.green}–100</li>
      <li class="statlegend--grey"><i aria-hidden="true"></i>grijs: nog niet in beeld</li>
      ${result.pillars.some((r) => r.gate?.triggered) ? `<li class="statlegend--star">${gviStar({ size: 12 })}${COPY.result.starLegend}</li>` : ''}
    </ul>`;
}

// ---------- niveau en advies ----------

// Drie treden: zoveel treden gevuld als het niveau (0 tot 3).
export function levelSteps(level) {
  const known = typeof level === 'number';
  return `<span class="steps${known ? '' : ' steps--unknown'}" role="img" aria-label="${known ? COPY.card.level(level) : COPY.status.grey}">${[1, 2, 3]
    .map((i) => `<i${known && i <= level ? ' class="is-on"' : ''}></i>`)
    .join('')}</span>`;
}

// Advies bij een dimensie, op basis van het niveau: de stap naar het volgende niveau, of vasthouden op niveau 3.
export function dimAdvice(dimId, level) {
  const c = DIM[dimId];
  if (!c) return null;
  if (typeof level !== 'number') return { kind: 'grey', ...GREY_ADVICE };
  if (level >= 3) return { kind: 'top', doen: c.top };
  return { kind: 'step', ...c.stap[level] };
}

function adviceHTML(a, { week = false, target = null } = {}) {
  if (!a) return '';
  if (a.kind === 'top') return `<div class="adv"><p class="adv__doen">${esc(a.doen)}</p></div>`;
  return `<div class="adv">
    <p class="adv__doen">${esc(a.doen)}</p>
    <dl class="adv__list">
      <div class="adv__row${week ? ' adv__row--week' : ''}"><dt>${week ? COPY.card.week : COPY.card.begin}</dt><dd>${esc(a.begin)}</dd></div>
      <div class="adv__row"><dt>${COPY.card.done}</dt><dd>${esc(a.klaar)}</dd></div>
      ${target ? `<div class="adv__row"><dt>${COPY.card.target}</dt><dd>${esc(target)}</dd></div>` : ''}
    </dl></div>`;
}

// ---------- waar je begint: drie prioriteiten ----------

export function prioritiesBlock(model, result) {
  const items = result.priorities || [];
  if (!items.length) {
    return `<section class="card prios" aria-labelledby="pr-t"><h2 id="pr-t">${COPY.prio.title}</h2><p>${COPY.prio.none}</p></section>`;
  }
  const cards = items
    .map((it, i) => {
      const p = pillarModel(model, it.pillarId);
      const pi = model.pillars.indexOf(p);
      const d = dimModel(model, it.dimensionId);
      const q = d.questions[0];
      const known = typeof it.level === 'number';
      const a = dimAdvice(d.id, known ? it.level : null);
      const target = known && it.level < 3 ? q.anchors[Math.max(it.level + 1, 2)] : null;
      return `<li class="prio pc${pi + 1}${i === 0 ? ' prio--first' : ''}">
        <div class="prio__head"><span class="prio__num" aria-hidden="true">${i + 1}</span>
          <div><h3 class="prio__name">${esc(d.name)}</h3>
          <p class="prio__meta">${esc(p.name)} · ${esc(COPY.prio.reason[it.reason])}</p></div></div>
        <p class="prio__now"><span class="prio__label">${COPY.prio.now}</span> ${esc(known ? q.anchors[it.level] : COPY.levels.unknown)}</p>
        ${adviceHTML(a, { week: i === 0, target })}
      </li>`;
    })
    .join('');
  return `<section class="card prios" aria-labelledby="pr-t"><h2 id="pr-t">${COPY.prio.title}</h2>
    <p class="prios__intro">${COPY.prio.intro(items.length)}</p>
    <ol class="prios__list">${cards}</ol>
    <p class="muted small">${COPY.prio.how}</p></section>`;
}

// Korte tekst voor de mail: de eerste prioriteit met de stap voor deze week.
export function firstStepText(model, result) {
  const it = (result.priorities || [])[0];
  if (!it) return COPY.prio.none;
  const d = dimModel(model, it.dimensionId);
  const a = dimAdvice(d.id, typeof it.level === 'number' ? it.level : null);
  return `${d.name}. ${a.doen}\n${COPY.card.week}: ${a.begin}`;
}

// ---------- de basis op orde: uitleg bij basisvoorwaarden die nog aandacht vragen ----------

export function flagsBlock(model, result) {
  const items = result.redFlags.map((f) => {
    const p = pillarModel(model, f.pillarId);
    const d = dimModel(model, f.dimensionId);
    const q = questionModel(model, f.questionId);
    const unknown = f.answer === 'unknown' || f.answer === undefined;
    return `<li class="flag">
      <p class="flag__head">${gviStar({ size: 14 })} <strong>${esc(d.name)}</strong> · ${esc(p.name)}</p>
      <p class="flag__q">${esc(questionText(q, result.derived))}</p>
      <p class="small"><span class="flag__label">${FLAG_TEXT.answer}:</span> ${esc(unknown ? COPY.levels.unknown : q.anchors[f.answer])}</p>
      <p><span class="flag__label">${FLAG_TEXT.why}:</span> ${esc(GATE_WHY[q.id] || '')}${unknown ? ` ${esc(FLAG_TEXT.unknown)}` : ''}</p>
    </li>`;
  });
  return `<section class="card flags-card" aria-labelledby="fl-t"><h2 id="fl-t">${COPY.result.flagsTitle}</h2>
    ${items.length ? `<p>${FLAG_TEXT.intro}</p><ul class="flags">${items.join('')}</ul><p class="flags__todo">${FLAG_TEXT.todo}</p>` : `<p>${COPY.result.flagsNone}</p>`}</section>`;
}

export function aiActBlock(result) {
  return `<section class="card" aria-labelledby="ai-t"><h2 id="ai-t">${COPY.result.aiActTitle}</h2>
    ${result.aiActIntro ? `<p>${esc(result.aiActIntro)}</p>` : ''}
    <ul class="signals">${result.aiActSignals.map((s) => `<li><strong>${esc(s.trigger)}.</strong> ${esc(s.text)}</li>`).join('')}</ul>
    <p class="muted small">${COPY.result.aiActNote}</p></section>`;
}

// ---------- pijler volledig uitgewerkt ----------

export function pillarDetail(model, result, state, pillarId, { headingLevel = 3, showTalk = true } = {}) {
  const pi = model.pillars.findIndex((p) => p.id === pillarId);
  const p = model.pillars[pi];
  const r = result.pillars[pi];
  const h = `h${headingLevel}`;
  const ctx = state.context || {};
  const dims = p.dimensions
    .map((d, di) => {
      const dr = r.dimensions[di];
      const q = d.questions[0];
      const gateMark = q.gate ? ` <span class="gate" title="${esc(COPY.card.gateNote)}">${gviStar({ size: 13 })}<span class="sr-only"> ${esc(COPY.card.gateNote)}</span></span>` : '';
      if (dr.status === 'disabled') {
        return `<li class="dim dim--disabled"><div class="dim__head"><${h} class="dim__name">${esc(shortLabel(d))}${gateMark}</${h}>${badge(null)}</div>
          <p class="dim__full muted small">${esc(questionText(q, result.derived))}</p></li>`;
      }
      const c = DIM[d.id] || {};
      const a = effectiveAnswer(q, state.answers || {}, ctx, result.derived);
      const level = dimLevel(dr);
      const known = typeof level === 'number';
      const advice = dimAdvice(d.id, level);
      const target = known && level < 3 ? q.anchors[Math.max(level + 1, 2)] : null;
      const talk = showTalk && q.gesprek?.length
        ? `<div class="dim__talk"><span class="dim__label">${COPY.card.talk}</span><ul>${q.gesprek.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`
        : '';
      return `<li class="dim dim--${dr.color}">
        <div class="dim__head"><${h} class="dim__name">${esc(shortLabel(d))}${gateMark}</${h}>
          ${levelSteps(level)}${badge(dr.color, { long: true })}</div>
        <p class="dim__full muted small">${esc(d.name)} · <em>${esc(d.term)}</em></p>
        <div class="dim__block"><span class="dim__label">${COPY.card.meaning}</span><p>${esc(c.text || '')}</p></div>
        <div class="dim__block dim__block--now"><span class="dim__label">${COPY.card.now}</span>
          <p class="dim__q">${esc(questionText(q, result.derived))}</p>
          <p class="dim__answer">${esc(known ? q.anchors[level] : answerLabel(model, q, a))}</p>
          ${known && c.stand ? `<p>${esc(c.stand[level])}</p>` : ''}</div>
        <div class="dim__block dim__block--step"><span class="dim__label">${known && level >= 3 ? COPY.card.hold : COPY.card.step}</span>${adviceHTML(advice, { target })}</div>
        ${talk}
      </li>`;
    })
    .join('');
  const g = p.dimensions.find((d) => d.questions[0].gate);
  return `<div class="pdetail pc${pi + 1}">
    <div class="pdetail__head"><span class="ptile__icon ptile__icon--s">${pillarIcon(p.id, { size: 18 })}</span><span class="pdetail__score pdetail__score--${r.color || 'disabled'}">${r.color === 'grey' ? 'nog niet in beeld' : r.status === 'disabled' ? 'niet van toepassing' : `${r.score} van 100`}</span></div>
    <p class="pdetail__approach">${esc(p.intro || p.approach)}</p>
    ${result.derived.isSolo && p.zzpNote ? `<p class="note">${esc(p.zzpNote)}</p>` : ''}
    <ul class="dims">${dims}</ul>
    ${g ? `<div class="gatenote"><p><strong>${gviStar({ size: 13 })} ${esc(g.name)} is de basis van deze pijler.</strong> Staat het antwoord op 0, 1 of "weet ik niet", dan vraagt dit onderdeel als eerste je aandacht.</p><p>${esc(GATE_WHY[g.questions[0].id] || '')}</p></div>` : ''}
  </div>`;
}

// ---------- scoreregels in gewone taal ----------

export function howItWorks(result) {
  const t = result.cfg.thresholds;
  return `<div class="how">
    <p>Elke vraag heeft vier antwoorden, van 0 tot 3. Ze zijn steeds op dezelfde manier opgebouwd: het gebeurt nog niet (0), mensen doen het op eigen initiatief (1), het is afgesproken (2), en het is afgesproken en al eens bijgestuurd (3).</p>
    <ul>
      <li><strong>Dimensie:</strong> bij elke dimensie hoort één vraag. Niveau 0 en 1 zijn rood, niveau 2 is oranje en niveau 3 is groen.</li>
      <li><strong>Weet ik niet</strong> telt niet als nul. De dimensie is dan grijs: nog niet in beeld.</li>
      <li><strong>Niet van toepassing</strong> telt niet mee.</li>
      <li><strong>Pijler:</strong> het gemiddelde van de dimensies, omgerekend naar een score van 0 tot 100. Rood onder ${t.red}, oranje van ${t.red} tot en met ${t.green - 1}, groen vanaf ${t.green}. Grijs als meer dan een derde van de vragen "weet ik niet" is.</li>
      <li><strong>De basis (${gviStar({ size: 12 })}):</strong> elke pijler heeft één vraag naar de basis. Staat die op 0, 1 of "weet ik niet", dan vraagt dat onderdeel als eerste je aandacht. Aan de score van de pijler verandert dat niets.</li>
      <li><strong>Waar je begint:</strong> eerst de basis die nog niet op orde is, met eigenaarschap en menselijk toezicht voorop. Dan het laagste onderdeel in de pijler die jij koos, en daarna je laagste onderdelen in de andere pijlers.</li>
      <li><strong>Geen totaalscore.</strong> Een gemiddelde over zulke verschillende onderwerpen zou meer precisie suggereren dan er is.</li>
    </ul>
    <p class="muted small">De grenzen ${t.red} en ${t.green} zijn voorlopige ontwerpkeuzes; geen bron geeft onderbouwde afkapwaarden. We maken ze openbaar en herzien ze na de pilots.</p>
  </div>`;
}
