// Alle drempels en beslisregels van de scan op één plek.
// De standaardwaarden komen uit scan-model.v0.4.json (blok "scoring").
// Na de pilots: pas hier OVERRIDES aan, of de JSON zelf. Niets elders in de code bevat drempels.

export const SCAN_VERSION = '0.4';
export const STORAGE_KEY = 'gvi-ai-readinessscan-v0.4';

// Lokale aanvullingen die niet letterlijk in de JSON staan. Ter bevestiging door Iris (zie HANDOFF.md).
export const LOCAL_RULES = {
  // Wie geldt als zzp/solo? De JSON noemt orgType=zzp. "Alleen ik" bij omvang is inhoudelijk hetzelfde.
  soloWhen: [{ id: 'orgType', equals: 'zzp' }, { id: 'size', equals: '1' }],
  // Rode vlaggen met voorrang in de eerste stap (regel 1 van firstStepOrder).
  firstStepPriorityPillars: ['P1', 'P6'],
  // Codes voor bevestigingscode (simulatie).
  code: { length: 6, ttlMinutes: 15, maxAttempts: 5 },
};

export const OVERRIDES = {
  // Voorbeeld: thresholds: { red: 40, green: 70 },
};

export function buildConfig(model, overrides = OVERRIDES) {
  const s = model.scoring;
  const cfg = {
    thresholds: {
      red: s.thresholds.red.max_exclusive, // score < red → rood
      green: s.thresholds.green.min, // score >= green → groen; daartussen oranje
    },
    dimensionGrey: { share: s.dimensionGreyIfUnknownShare, comparison: s.dimensionGreyComparison },
    pillarGrey: { share: s.pillarGreyIfUnknownShare, comparison: s.pillarGreyComparison },
    dimensionDisabledIfAllNA: s.dimensionDisabledIfAllNA,
    gateTriggerAnswers: s.gateTriggerAnswers,
    noTotalScore: s.noTotalScore,
    ...LOCAL_RULES,
  };
  return deepMerge(cfg, overrides);
}

function deepMerge(base, extra) {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(base[k] || {}, v) : v;
  }
  return out;
}
