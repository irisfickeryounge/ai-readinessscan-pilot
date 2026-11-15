// Antwoorden blijven in de browser (localStorage) tot iemand zelf een rapport aanvraagt.
import { STORAGE_KEY, SCAN_VERSION } from './config.js';

const empty = () => ({ version: SCAN_VERSION, context: {}, priority: null, answers: {}, startedAt: null, request: null });

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const s = JSON.parse(raw);
    return s.version === SCAN_VERSION ? { ...empty(), ...s } : empty();
  } catch {
    return empty();
  }
}

export function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* privévenster of geblokkeerde opslag: de scan werkt dan zonder bewaren */
  }
}

export function reset() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return empty();
}

export function hasProgress(state) {
  return Object.keys(state.context).length > 0 || Object.keys(state.answers).length > 0;
}
