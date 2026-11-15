// Spinnenweb als eigen SVG: alle actieve dimensies, gegroepeerd per pijler in de pijlerkleur.
// Bewust rustig: korte labels, geen statussymbolen. De status (stoplicht) staat in het pijleroverzicht
// en in de kaarten; hier gaat het om het profiel. Elk punt toont het niveau (0 tot 3), dus kleur draagt niets alleen.
const levelOf = (score) => Math.round((score / 100) * 3);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function radarSVG(model, result, { size = 640, animate = true, labels = 'name' } = {}) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.33;
  const axes = [];
  model.pillars.forEach((p, pi) => {
    const pr = result.pillars[pi];
    p.dimensions.forEach((d, di) => {
      const dr = pr.dimensions[di];
      if (dr.status === 'disabled') return;
      axes.push({ p, d, dr, pi });
    });
  });
  const n = axes.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
  const f = (x) => x.toFixed(1);
  const col = (pi) => `var(--p${pi + 1})`;

  const padX = labels === 'id' ? 34 : 120;
  const padY = labels === 'id' ? 30 : 44;
  let s = `<svg class="radar${animate ? ' radar--animate' : ''}" viewBox="${-padX} ${-padY} ${size + 2 * padX} ${size + 2 * padY}" role="img" aria-labelledby="radar-title radar-desc" xmlns="http://www.w3.org/2000/svg">`;
  s += `<title id="radar-title">Profiel op ${n} dimensies</title>`;
  s += `<desc id="radar-desc">${esc(
    axes.map((a) => `${a.d.name}: ${a.dr.status === 'grey' ? 'nog niet in beeld' : `niveau ${levelOf(a.dr.score)}`}`).join('; '),
  )}</desc>`;

  // Pijlervlakken en -banden in de pijlerkleur
  let start = 0;
  const pills = [];
  model.pillars.forEach((p, pi) => {
    const count = axes.filter((a) => a.pi === pi).length;
    if (!count) return;
    const a0 = ang(start - 0.5);
    const a1 = ang(start + count - 0.5);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const Rs = R * 1.06;
    s += `<path class="radar__sector" style="fill:${col(pi)}" d="M${cx},${cy} L${f(cx + Math.cos(a0) * Rs)},${f(cy + Math.sin(a0) * Rs)} A${Rs},${Rs} 0 ${large} 1 ${f(cx + Math.cos(a1) * Rs)},${f(cy + Math.sin(a1) * Rs)} Z"/>`;
    const Rb = R * 1.06;
    const g = 0.025;
    const b0 = a0 + g;
    const b1 = a1 - g;
    s += `<path class="radar__band" style="stroke:${col(pi)}" d="M${f(cx + Math.cos(b0) * Rb)},${f(cy + Math.sin(b0) * Rb)} A${Rb},${Rb} 0 ${b1 - b0 > Math.PI ? 1 : 0} 1 ${f(cx + Math.cos(b1) * Rb)},${f(cy + Math.sin(b1) * Rb)}"/>`;
    pills.push({ mid: (a0 + a1) / 2, text: `${pi + 1}`, Rb, pi });
    start += count;
  });

  // Ringen: de niveaus 1, 2 en 3
  for (const [v, cls] of [[100 / 3, 'ring--t'], [200 / 3, 'ring--t'], [100, 'ring--max']]) {
    const pts = axes.map((_, i) => pt(i, (R * v) / 100).map(f).join(',')).join(' ');
    s += `<polygon class="radar__ring ${cls}" points="${pts}"/>`;
  }
  axes.forEach((a, i) => {
    const [x, y] = pt(i, R);
    s += `<line class="radar__axis" x1="${cx}" y1="${cy}" x2="${f(x)}" y2="${f(y)}"/>`;
  });

  // Vorm: alleen gescoorde dimensies
  const scored = axes.map((a, i) => ({ a, i })).filter((o) => o.a.dr.status === 'scored');
  if (scored.length >= 2) {
    const pts = scored.map(({ a, i }) => pt(i, (R * Math.max(a.dr.score, 3)) / 100).map(f).join(',')).join(' ');
    s += `<polygon class="radar__shape" points="${pts}" style="transform-origin:${cx}px ${cy}px"/>`;
  }

  // Punten en labels
  axes.forEach((a, i) => {
    const grey = a.dr.status === 'grey';
    const [x, y] = grey ? pt(i, R * 0.06) : pt(i, (R * Math.max(a.dr.score, 3)) / 100);
    const r = size * 0.012;
    s += grey
      ? `<g class="radar__dot radar__dot--grey" style="--i:${i}"><circle cx="${f(x)}" cy="${f(y)}" r="${r}"/></g>`
      : `<g class="radar__dot" style="--i:${i}"><rect x="${f(x - r)}" y="${f(y - r)}" width="${f(2 * r)}" height="${f(2 * r)}" style="fill:${col(a.pi)}" transform="rotate(45 ${f(x)} ${f(y)})"/></g>`;
    const c = Math.cos(ang(i));
    const vertical = Math.abs(c) < 0.1;
    // Labels bij boven- en onderkant iets verder naar buiten, zodat ze niet tegen elkaar of de pijlernummers lopen.
    const [lx, ly] = pt(i, R * (vertical ? 1.24 : 1.17 + 0.1 * (1 - Math.abs(c)) ** 2));
    const anchor = vertical ? 'middle' : c > 0 ? 'start' : 'end';
    const name = labels === 'id' ? a.d.id.replace('D', '') : a.d.label || a.d.name;
    const val = grey ? '?' : levelOf(a.dr.score);
    s += `<text class="radar__label${grey ? ' radar__label--grey' : ''}${labels === 'id' ? ' radar__label--id' : ''}" x="${f(lx)}" y="${f(ly)}" text-anchor="${anchor}" dominant-baseline="middle">${esc(name)} <tspan class="radar__val" style="fill:${grey ? 'var(--grey)' : col(a.pi)}">${val}</tspan></text>`;
  });
  for (const b of pills) {
    const x = cx + Math.cos(b.mid) * b.Rb;
    const y = cy + Math.sin(b.mid) * b.Rb;
    s += `<g class="radar__pill"><rect x="${f(x - 12)}" y="${f(y - 12)}" width="24" height="24" style="fill:var(--p${b.pi + 1})"/><text x="${f(x)}" y="${f(y)}" text-anchor="middle" dominant-baseline="central">P${b.text}</text></g>`;
  }
  s += '</svg>';
  return s;
}
