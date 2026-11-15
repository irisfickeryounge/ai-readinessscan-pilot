// Pijleridentiteit: kleur, hoekig icoon en korte dimensielabels. Weergave, geen inhoud:
// de officiële namen blijven in scan-model.v0.4.json.

// Hoekige, gevulde iconen (viewBox 24×24, alleen rechte lijnen).
const ICONS = {
  P1: 'M4 2h3v20H4z M7 3l14 5-14 5z', // vlag: richting
  P2: 'M7 2l3 3-3 3-3-3z M17 2l3 3-3 3-3-3z M2 21l2-10h6l2 10z M12 21l2-10h6l2 10z', // twee mensen
  P3: 'M2 22v-6h6v-6h6V4h8v18z', // trap: leren
  P4: 'M2 22h5v-8H2z M9.5 22h5V9h-5z M17 22h5V2h-5z', // staven: waarde
  P5: 'M2 2h8v8H2z M14 2h8v8h-8z M2 14h8v8H2z M18 13l5 5-5 5-5-5z', // blokken met agent
  P6: 'M12 1l10 4v8l-10 10L2 13V5z', // schild: governance
};

export function pillarIcon(pid, { size = 24, cls = 'picon' } = {}) {
  return `<svg class="${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false"><path d="${ICONS[pid]}" fill="currentColor"/></svg>`;
}

// Korte labels voor het wiel en de overzichten staan sinds v0.4 in het model (veld "label" per dimensie).
export const shortLabel = (d) => d.label || d.name;
