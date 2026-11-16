// Pure scorelogica van de GVI AI-readinessscan (ontwerp v0.2 §4; model v0.4: één vraag per dimensie).
// Geen DOM, geen opslag: werkt in de browser, in tests en later op een server.
// Antwoordwaarden: 0 | 1 | 2 | 3 | 'unknown' | 'na'.
// Er bestaat bewust GEEN totaalscore over de zes pijlers.

export const UNKNOWN = 'unknown';
export const NA = 'na';

// ---------- context ----------

export function deriveContext(cfg, context = {}) {
  const isSolo = cfg.soloWhen.some((r) => context[r.id] === r.equals);
  const areas = Array.isArray(context.applicationAreas) ? context.applicationAreas : [];
  return {
    isSolo,
    usesAgents: context.usesAgents ?? null,
    usesAI: context.aiUse ? context.aiUse !== 'none' : null,
    areas,
  };
}

function conditionHolds(cond, context, derived) {
  // Vorm in de JSON: "orgType=zzp", "usesAgents=no".
  const [key, value] = cond.split('=');
  if (key === 'orgType' && value === 'zzp') return derived.isSolo;
  return context[key] === value;
}

export function isAutoNA(question, context, derived) {
  const when = question.na?.autoWhen || [];
  return when.some((c) => conditionHolds(c, context, derived));
}

export function naAllowed(question) {
  return !!question.na?.allowed;
}

// Tekst van de zzp-variant, uit het veld zzpVariant ("... De vraag wordt dan: "...""), anders null.
export function zzpVariantText(question) {
  if (!question.zzpVariant) return null;
  const m = question.zzpVariant.match(/[„"“](.+?)[”"]\s*$/);
  return m ? m[1] : question.zzpVariant;
}

export function questionText(question, derived) {
  return (derived.isSolo && zzpVariantText(question)) || question.text;
}

export function effectiveAnswer(question, answers, context, derived) {
  if (isAutoNA(question, context, derived)) return NA;
  const a = answers[question.id];
  return a === undefined ? undefined : a;
}

// ---------- hulpfuncties ----------

export function allQuestions(model) {
  return model.pillars.flatMap((p) => p.dimensions.flatMap((d) => d.questions.map((q) => ({ q, d, p }))));
}

export function colorFor(score, cfg) {
  if (score === null || score === undefined) return 'grey';
  if (score < cfg.thresholds.red) return 'red';
  if (score >= cfg.thresholds.green) return 'green';
  return 'orange';
}

function compare(value, comparison, limit) {
  // Kleine marge tegen afrondingsfouten (1/3 als drijvende komma).
  const eps = 1e-9;
  switch (comparison) {
    case '>=': return value >= limit - eps;
    case '>': return value > limit + eps;
    default: throw new Error(`Onbekende vergelijking: ${comparison}`);
  }
}

const isLevel = (a) => a === 0 || a === 1 || a === 2 || a === 3;

// ---------- dimensie ----------

export function scoreDimension(dim, answers, context, derived, cfg) {
  const items = dim.questions.map((q) => ({ id: q.id, answer: effectiveAnswer(q, answers, context, derived) }));
  const applicable = items.filter((i) => i.answer !== NA);
  const unknown = applicable.filter((i) => i.answer === UNKNOWN || i.answer === undefined);
  const known = applicable.filter((i) => isLevel(i.answer));
  const base = { id: dim.id, items, applicableCount: applicable.length, unknownCount: unknown.length };

  if (applicable.length === 0 && cfg.dimensionDisabledIfAllNA) {
    return { ...base, status: 'disabled', score: null, color: null };
  }
  const unknownShare = applicable.length ? unknown.length / applicable.length : 0;
  if (known.length === 0 || compare(unknownShare, cfg.dimensionGrey.comparison, cfg.dimensionGrey.share)) {
    return { ...base, status: 'grey', score: null, color: 'grey' };
  }
  const mean = known.reduce((s, i) => s + i.answer, 0) / known.length;
  const score = Math.round((mean / 3) * 100); // eerst afronden, dan drempels
  return { ...base, status: 'scored', score, color: colorFor(score, cfg) };
}

// ---------- pijler ----------

export function gateQuestion(pillar) {
  for (const d of pillar.dimensions) for (const q of d.questions) if (q.gate) return { q, d };
  return null;
}

export function scorePillar(pillar, answers, context, derived, cfg) {
  const dims = pillar.dimensions.map((d) => scoreDimension(d, answers, context, derived, cfg));
  const scored = dims.filter((d) => d.status === 'scored');
  const applicable = dims.reduce((s, d) => s + d.applicableCount, 0);
  const unknown = dims.reduce((s, d) => s + d.unknownCount, 0);

  const gate = gateQuestion(pillar);
  let gateTriggered = false;
  let gateAnswer;
  if (gate) {
    gateAnswer = effectiveAnswer(gate.q, answers, context, derived);
    const ans = gateAnswer === undefined ? UNKNOWN : gateAnswer;
    // n.v.t. → de basisvoorwaarde geldt niet.
    gateTriggered = ans !== NA && cfg.gateTriggerAnswers.includes(ans);
  }

  const base = {
    id: pillar.id,
    dimensions: dims,
    applicableCount: applicable,
    unknownCount: unknown,
    gate: gate ? { questionId: gate.q.id, dimensionId: gate.d.id, answer: gateAnswer, triggered: gateTriggered } : null,
  };

  if (applicable === 0) return { ...base, status: 'disabled', score: null, color: null, capped: false };

  const score = scored.length
    ? Math.round(scored.reduce((s, d) => s + d.score, 0) / scored.length)
    : null;
  const unknownShare = unknown / applicable;
  const grey = score === null || compare(unknownShare, cfg.pillarGrey.comparison, cfg.pillarGrey.share);

  // Besluit Iris 16-11-2026: de basisvoorwaarde begrenst de kleur van de pijler niet meer.
  // De kleur volgt de score; de basisvoorwaarde krijgt een sterretje en staat bovenaan bij "waar je begint".
  const color = grey ? 'grey' : colorFor(score, cfg);
  return { ...base, status: grey ? 'grey' : 'scored', score, color, capped: false };
}

// ---------- AI Act-signalen ----------

export function aiActSignals(model, context, derived) {
  const out = [];
  const areaSignals = new Set(
    (model.context.find((c) => c.id === 'applicationAreas')?.options || [])
      .filter((o) => o.aiActSignal && derived.areas.includes(o.id))
      .map((o) => o.aiActSignal),
  );
  for (const s of model.aiActSignals) {
    const w = s.appliesWhen;
    let applies = false;
    if (w === 'always') applies = true;
    else if (w === 'usesAI') applies = derived.usesAI !== false; // onbekend → tonen
    else if (w.startsWith('applicationAreas:')) applies = derived.areas.includes(w.split(':')[1]);
    else if (w.includes('=')) applies = context[w.split('=')[0]] === w.split('=')[1];
    if (areaSignals.has(s.id)) applies = true; // aangevinkt toepassingsgebied met hetzelfde signaal
    if (applies) out.push(s);
  }
  return out;
}

// ---------- eerste stap ----------

function findDim(model, dimId) {
  for (const p of model.pillars) for (const d of p.dimensions) if (d.id === dimId) return { p, d };
  return null;
}

// Zwakste vraag binnen een dimensie: laagste bekend antwoord; bij gelijkspel de eerste.
export function weakestQuestion(dimModel, dimResult) {
  let best = null;
  for (const item of dimResult.items) {
    if (!isLevel(item.answer)) continue;
    if (!best || item.answer < best.answer) best = item;
  }
  if (!best) return null;
  const q = dimModel.questions.find((x) => x.id === best.id);
  return { question: q, answer: best.answer, nextAnchor: best.answer < 3 ? q.anchors[best.answer + 1] : null };
}

export function firstStep(model, result, priority) {
  const order = model.pillars.map((p) => p.id);
  const byPriority = (a, b) =>
    (a === priority ? -1 : 0) - (b === priority ? -1 : 0) || order.indexOf(a) - order.indexOf(b);

  const flags = result.redFlags;
  // 1. rode vlag bij eigenaarschap (P1) of menselijk toezicht (P6)
  const prio = result.cfg.firstStepPriorityPillars;
  const f1 = flags.filter((f) => prio.includes(f.pillarId)).sort((a, b) => prio.indexOf(a.pillarId) - prio.indexOf(b.pillarId))[0];
  if (f1) return { rule: 1, type: 'redFlag', ...f1 };
  // 2. een andere rode vlag (de prioriteitspijler eerst)
  const f2 = [...flags].sort((a, b) => byPriority(a.pillarId, b.pillarId))[0];
  if (f2) return { rule: 2, type: 'redFlag', ...f2 };
  // 3. een grijze pijler: eerst in beeld brengen
  const grey = result.pillars.filter((p) => p.status === 'grey').map((p) => p.id).sort(byPriority)[0];
  if (grey) return { rule: 3, type: 'greyPillar', pillarId: grey };
  // 4. laagste dimensie binnen de prioriteitspijler; 5. laagste dimensie overall
  const lowest = (dims) =>
    dims.filter((d) => d.status === 'scored').reduce((min, d) => (!min || d.score < min.score ? d : min), null);
  const pp = result.pillars.find((p) => p.id === priority);
  const l4 = pp ? lowest(pp.dimensions) : null;
  const l = l4 || lowest(result.pillars.flatMap((p) => p.dimensions));
  if (l) {
    const { p, d } = findDim(model, l.id);
    return { rule: l4 ? 4 : 5, type: 'lowestDimension', pillarId: p.id, dimensionId: d.id, score: l.score, weakest: weakestQuestion(d, l) };
  }
  return { rule: null, type: 'none' };
}

// ---------- prioriteiten (top 3) ----------

// Het niveau van een dimensie: het laagste bekende antwoord (in v0.4 heeft elke dimensie één vraag).
export function dimLevel(dimResult) {
  const known = dimResult.items.map((i) => i.answer).filter(isLevel);
  return known.length ? Math.min(...known) : null;
}

// Waar begin je? Eerst de rode vlaggen (basisvoorwaarden), dan de laagste dimensie in je prioriteitspijler,
// dan de laagste dimensies in de andere pijlers. Dimensies op niveau 3 en grijze dimensies doen niet mee.
export function priorities(model, result, priority, max = 3) {
  const order = model.pillars.map((p) => p.id);
  const byPriority = (a, b) =>
    (a === priority ? -1 : 0) - (b === priority ? -1 : 0) || order.indexOf(a) - order.indexOf(b);
  const prio = result.cfg.firstStepPriorityPillars;
  const out = [];
  const seen = new Set();
  const push = (item) => {
    if (out.length >= max || seen.has(item.dimensionId)) return;
    seen.add(item.dimensionId);
    out.push(item);
  };
  const dimOf = (id) => result.pillars.flatMap((p) => p.dimensions).find((d) => d.id === id);

  const first = result.redFlags.filter((f) => prio.includes(f.pillarId)).sort((a, b) => prio.indexOf(a.pillarId) - prio.indexOf(b.pillarId));
  const rest = result.redFlags.filter((f) => !prio.includes(f.pillarId)).sort((a, b) => byPriority(a.pillarId, b.pillarId));
  for (const f of [...first, ...rest]) {
    const level = dimLevel(dimOf(f.dimensionId));
    push({ reason: 'flag', pillarId: f.pillarId, dimensionId: f.dimensionId, questionId: f.questionId, level: level ?? UNKNOWN });
  }

  const candidates = [];
  model.pillars.forEach((p, pi) => {
    p.dimensions.forEach((d, di) => {
      const dr = result.pillars[pi].dimensions[di];
      const level = dimLevel(dr);
      if (dr.status !== 'scored' || level === null || level >= 3) return;
      candidates.push({ pillarId: p.id, dimensionId: d.id, questionId: d.questions[0].id, level, score: dr.score });
    });
  });
  const lowest = (list) => [...list].sort((a, b) => a.score - b.score || order.indexOf(a.pillarId) - order.indexOf(b.pillarId));
  const own = lowest(candidates.filter((c) => c.pillarId === priority))[0];
  if (own) push({ reason: 'priorityPillar', ...own });
  for (const c of lowest(candidates)) push({ reason: 'lowest', ...c });
  return out;
}

// ---------- totaal ----------

export function computeResult(model, cfg, state) {
  const context = state.context || {};
  const answers = state.answers || {};
  const derived = deriveContext(cfg, context);
  const pillars = model.pillars.map((p) => scorePillar(p, answers, context, derived, cfg));
  const redFlags = pillars
    .filter((p) => p.gate?.triggered)
    .map((p) => ({ pillarId: p.id, dimensionId: p.gate.dimensionId, questionId: p.gate.questionId, answer: p.gate.answer ?? UNKNOWN }));
  const result = {
    version: model.version,
    derived,
    priority: state.priority || null,
    pillars,
    redFlags,
    aiActSignals: aiActSignals(model, context, derived),
    aiActIntro: model.aiActIntro || null,
    cfg,
  };
  result.firstStep = firstStep(model, result, state.priority);
  result.priorities = priorities(model, result, state.priority);
  return result; // bewust zonder totaalscore
}

// Voortgang: beantwoorde toepasbare vragen (auto-n.v.t. telt als beantwoord).
export function progress(model, cfg, state) {
  const derived = deriveContext(cfg, state.context || {});
  const all = allQuestions(model);
  const done = all.filter(({ q }) => effectiveAnswer(q, state.answers || {}, state.context || {}, derived) !== undefined);
  return { done: done.length, total: all.length };
}

export function pillarComplete(pillar, state, cfg) {
  const derived = deriveContext(cfg, state.context || {});
  return pillar.dimensions.every((d) =>
    d.questions.every((q) => effectiveAnswer(q, state.answers || {}, state.context || {}, derived) !== undefined),
  );
}
