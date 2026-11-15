// Pilotmodus: een besloten, voorlopige versie van de scan voor de eerste gesprekken.
// - De deelnemer dient de scan in en ziet daarna een samenvatting, niet de uitwerking per dimensie.
// - Er is geen server en geen database: "Indienen" zet een mail aan Iris klaar met een antwoordcode.
//   Staat er een `endpoint`, dan gaan de antwoorden daar eerst automatisch heen en is de mail het vangnet.
// - Iris leest de antwoordcode lokaal in (inlezen.html) en ziet dan het volledige rapport.
// De pilot-build (tools/build-pilot.mjs) schrijft dit bestand opnieuw met enabled: true.
export const PILOT = {
  enabled: true,
  to: "irisfickeryounge@gmail.com", // e-mailadres van Iris voor de ingediende antwoorden
  endpoint: "https://script.google.com/macros/s/AKfycby3K3jv88JRqy9HzFgto8AA42U3MrDTYFyPDQ4zfN7KwLoTu5DHrM_CbWZkiJlGwRhu/exec", // optioneel: adres van een ontvanger (bijvoorbeeld Apps Script in het eigen Google-account)
};

// Lokaal testen van de pilot: open de scan met ?pilot achter het adres.
export function isPilot() {
  if (PILOT.enabled) return true;
  try {
    if (new URLSearchParams(location.search).has('pilot')) sessionStorage.setItem('gvi-pilot', '1');
    return sessionStorage.getItem('gvi-pilot') === '1';
  } catch {
    return new URLSearchParams(location.search).has('pilot');
  }
}

const PREFIX = 'gvi04.';
const b64url = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

// Antwoordcode: alles wat nodig is om het rapport opnieuw op te bouwen, in één regel tekst.
export function encodeState(state) {
  const r = state.request || {};
  // De punt aan het eind markeert het einde van de code, ook als een mailprogramma de regel afbreekt.
  return `${PREFIX}${b64url(JSON.stringify({
    v: state.version, c: state.context, p: state.priority, a: state.answers,
    n: r.name || '', o: r.org || '', t: r.submittedAt || null,
  }))}.`;
}

// Haalt de antwoordcode uit losse tekst. Verdraagt afgebroken regels en de ">" van een doorgestuurde mail.
export function extractCode(text) {
  const flat = String(text || '').replace(/[\s>]+/g, '');
  const m = flat.match(/gvi04\.([A-Za-z0-9_-]+)\./) || flat.match(/gvi04\.([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

// Leest een antwoordcode uit losse tekst, bijvoorbeeld een hele geplakte mail. Geeft null als er geen geldige code in staat.
export function decodeState(text) {
  const code = extractCode(text);
  if (!code) return null;
  try {
    const d = JSON.parse(unb64url(code));
    if (!d || typeof d.a !== 'object' || typeof d.c !== 'object') return null;
    return {
      version: d.v, context: d.c, priority: d.p, answers: d.a, startedAt: d.t,
      request: { name: d.n, org: d.o, submittedAt: d.t, verifiedAt: d.t, verified: true },
    };
  } catch {
    return null;
  }
}

export function mailBody(state) {
  const r = state.request || {};
  return [
    'Beste Iris,', '',
    'Hierbij mijn antwoorden op de AI-readinessscan.', '',
    `Naam: ${r.name || ''}`,
    `Organisatie: ${r.org || ''}`, '',
    'Antwoordcode (graag laten staan):',
    encodeState(state), '',
  ].join('\n');
}

export function mailtoHref(state) {
  const r = state.request || {};
  const subject = `AI-readinessscan ingevuld · ${r.org || r.name || ''}`.trim();
  return `mailto:${PILOT.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody(state))}`;
}

// Probeert de antwoorden automatisch af te leveren. Geeft alleen true als de ontvanger de ontvangst bevestigt.
// In elk ander geval (geen ontvanger, geen verbinding, geen bevestiging) volgt het vangnet: de mail.
export async function deliver(state) {
  if (!PILOT.endpoint) return false;
  try {
    const r = state.request || {};
    // Zonder eigen Content-Type-kop gaat het bericht als platte tekst: zo is er geen voorafgaand controleverzoek nodig.
    const res = await fetch(PILOT.endpoint, {
      method: 'POST',
      body: JSON.stringify({ name: r.name || '', org: r.org || '', submittedAt: r.submittedAt, code: encodeState(state) }),
    });
    return res.ok && (await res.text()).trim() === 'ok';
  } catch {
    return false;
  }
}
