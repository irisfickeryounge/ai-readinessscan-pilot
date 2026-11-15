// Werkende SIMULATIE van code + mail. Verstuurt niets. Live verzending vraagt een apart besluit van Iris.
import { LOCAL_RULES } from './config.js';
import { MAIL, AGENDA_URL } from './copy.js';

let pending = null; // { code, email, expires, attempts }

export function requestCode(email) {
  const { length, ttlMinutes } = LOCAL_RULES.code;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const code = String(buf[0] % 10 ** length).padStart(length, '0');
  pending = { code, email, expires: Date.now() + ttlMinutes * 60000, attempts: 0 };
  console.info(`[GVI-scan simulatie] Bevestigingscode voor ${email}: ${code}`);
  return { code }; // alleen voor het testpaneel
}

export function verifyCode(input) {
  const { maxAttempts } = LOCAL_RULES.code;
  if (!pending || Date.now() > pending.expires || pending.attempts >= maxAttempts) return { ok: false, expired: true };
  if (String(input).trim() === pending.code) {
    pending = null;
    return { ok: true };
  }
  pending.attempts += 1;
  const left = maxAttempts - pending.attempts;
  return left > 0 ? { ok: false, left } : { ok: false, expired: true };
}

export function composeMail({ name, email, firstStepText }) {
  return { to: email, subject: MAIL.subject, body: MAIL.body({ name, firstStepText, agendaUrl: AGENDA_URL }), attachment: 'GVI-AI-readinessrapport.pdf' };
}

export const isSimulationHost = () =>
  ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname) || new URLSearchParams(location.search).has('test');
