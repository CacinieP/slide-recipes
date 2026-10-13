import { resolveBusinessPalette } from '../lib/business-palette.js';
import { createBusinessElements } from './business-elements.mjs';
import { estimateTextWidth } from '../lib/cjk-text.js';

/** Original presentation systems informed by public references; no vendor assets. */
export const commercialRecipes = {
  'investor-signal': {
    label: '投资人简报', ink: '123936', paper: 'F5F1E8', muted: '52635B', accent: '28664D',
    highlight: 'D8F0A3', line: 'C6CDC2', dark: '123936', light: 'F5F1E8', motif: 'orbit',
    useFor: '融资、增长复盘、经营汇报', referenceIds: ['pinterest-signal'],
  },
  'editorial-proposal': {
    label: '编辑式品牌提案', ink: '242629', paper: 'FAF9F6', muted: '5E6268', accent: '214CC4',
    highlight: 'DDE7FF', line: 'D5D8DD', dark: '183387', light: 'FAF9F6', motif: 'grid',
    useFor: '品牌策略、设计提案、作品案例', referenceIds: ['envato-andr', 'slidesgo-consulting'],
  },
  'studio-monochrome': {
    label: '黑白创意工作室', ink: '191919', paper: 'F5F5F2', muted: '626262', accent: '262626',
    highlight: 'E1E1D9', line: 'CBCBC7', dark: '191919', light: 'F5F5F2', motif: 'type',
    useFor: '创意机构、作品集、服务提案', referenceIds: ['pinterest-bold'],
  },
};

/** All content is caller-supplied. No global theme changes to unrelated decks. */
export function createCommercialRecipe(pres, id, { fontFace = 'Microsoft YaHei', label = '', mode = 'presentation', palette = {} } = {}) {
  const originalTheme = commercialRecipes[id];
  if (!originalTheme) throw new Error(`Unknown commercial recipe: ${id}`);
  const t = resolveBusinessPalette(originalTheme, palette);
  if (!['presentation', 'document'].includes(mode)) throw new Error('mode must be presentation or document');
  pres.defineLayout({ name: 'COMMERCIAL_WIDE', width: 10, height: 5.625 });
  pres.layout = 'COMMERCIAL_WIDE';
  pres.theme = { headFontFace: fontFace, bodyFontFace: fontFace, lang: 'zh-CN' };
  const bodySize = mode === 'document' ? 13 : 16;
  const rect = (s, x, y, w, h, fill, extra = {}) => s.addShape(pres.ShapeType.rect,
    { x, y, w, h, fill: { color: fill }, line: { color: fill, transparency: 100 }, ...extra });
  const rule = (s, x, y, w, color = t.line) => rect(s, x, y, w, .008, color);
  function text(s, value, x, y, w, h, size = bodySize, color = t.ink, bold = false, extra = {}) {
    const lines = [];
    for (const paragraph of String(value ?? '').split('\n')) {
      let line = '';
      // Latin words stay intact; CJK breaks by glyph, closing punctuation stays with the preceding glyph.
      const tokens = paragraph.match(/[A-Za-z0-9@._/+%-]+|[^A-Za-z0-9@._/+%-]/gu) || [''];
      for (const token of tokens) {
        if (estimateTextWidth(token, { fontSize: size, bold }) > w * 72 * .94) throw new Error('Unbreakable text exceeds slot');
        if (line && estimateTextWidth(line + token, { fontSize: size, bold }) > w * 72 * .94) {
          if ('，。！？；：、）》」』'.includes(token)) {
            const chars = [...line]; const last = chars.pop(); lines.push(chars.join('')); line = last + token;
          } else { lines.push(line.trimEnd()); line = token.trimStart(); }
        } else line += token;
      }
      lines.push(line);
    }
    if (lines.length * size * 1.16 > h * 72) throw new Error(`Text exceeds ${id} slot: shorten or split the slide`);
    s.addText(lines.join('\n'), { x, y, w, h, fontFace, fontSize: size, color, bold, margin: 0, valign: 'mid', ...extra });
  }
  function base({ title, kicker = '', dark = false, page, footer = label } = {}) {
    const s = pres.addSlide(); s.background = { color: dark ? t.dark : t.paper };
    const fg = dark ? t.light : t.ink;
    if (kicker) text(s, kicker, .55, .38, 8.9, .24, 10, dark ? t.highlight : t.accent, true);
    if (title) text(s, title, .55, .82, 8.9, .76, 29, fg, true);
    rule(s, .55, 5.08, 8.9, dark ? '708077' : t.line);
    text(s, footer, .55, 5.22, 8.05, .18, 8, dark ? t.light : t.muted);
    if (page !== undefined) text(s, String(page).padStart(2, '0'), 9, 5.17, .45, .28, 10, fg, false, { align: 'right' });
    return s;
  }
  function motif(s, x, y, w, h, dark = false) {
    const fill = dark ? t.highlight : t.accent;
    if (t.motif === 'orbit') {
      [0,1,2].forEach(i => s.addShape(pres.ShapeType.ellipse, {
        x: x + i * .28, y: y + i * .28, w: w - i * .56, h: h - i * .56,
        fill: { color: fill, transparency: 100 }, line: { color: fill, width: 1.2 } }));
      s.addShape(pres.ShapeType.ellipse, { x: x + w * .66, y: y + h * .15, w: .48, h: .48,
        fill: { color: fill }, line: { color: fill, transparency: 100 } });
    } else if (t.motif === 'grid') {
      rect(s, x, y, w * .62, h * .57, fill);
      rect(s, x + w * .68, y, w * .32, h, fill);
      rect(s, x, y + h * .63, w * .27, h * .37, fill);
      rect(s, x + w * .33, y + h * .63, w * .29, h * .37, dark ? t.light : t.highlight);
    } else {
      for (let i = 0; i < 7; i++) rect(s, x + i * w / 8, y + (i % 2) * .3, w / 14, h - .3, fill);
    }
  }
  function image(s, path, x, y, w, h) {
    if (path) s.addImage({ path, x, y, w, h, sizing: { type: 'cover', w, h } });
    else motif(s, x + .3, y + .2, w - .6, h - .4);
  }
  function count(items, min, max, name) {
    if (!Array.isArray(items) || items.length < min || items.length > max) throw new Error(`${name} requires ${min}–${max} items`);
  }
  return {
    ...createBusinessElements({ pres, t, base, text, rect, rule, image, count }),
    theme: t,
    cover({ title, subtitle = '', kicker = '', image: path, page, footer }) {
      const s = base({ dark: id !== 'editorial-proposal', page, footer });
      if (id === 'editorial-proposal') {
        text(s, kicker, .55, .5, 5, .3, 11, t.accent, true);
        text(s, title, .55, 1.25, 5.2, 1.9, 40, t.ink, true);
        text(s, subtitle, .55, 3.72, 4.9, .85, 17, t.muted);
        image(s, path, 6, .65, 3.45, 3.98);
      } else if (id === 'investor-signal') {
        text(s, kicker, .55, .5, 8.9, .3, 11, t.highlight, true);
        text(s, title, .55, 1.5, 5.65, 1.8, 39, t.light, true);
        text(s, subtitle, .55, 3.92, 5.4, .65, 16, t.light);
        if (path) image(s, path, 6.6, 1.1, 2.85, 3.4); else motif(s, 6.5, 1.45, 2.8, 2.8, true);
      } else {
        text(s, kicker, .55, .5, 8.9, .28, 10, t.light, true);
        text(s, title, .55, 1.33, 8.9, 1.95, 47, t.light, true);
        text(s, subtitle, .55, 3.9, 5.8, .7, 17, t.light);
        motif(s, 7.6, 3.65, 1.8, 1.0, true);
      }
      return s;
    },
    section({ number, title, summary = '', page }) {
      const s = base({ dark: true, page });
      text(s, number, .55, .8, 2.6, 1.35, 72, t.highlight, true);
      text(s, title, 3.65, 1.35, 5.8, 1.5, 34, t.light, true);
      text(s, summary, 3.65, 3.25, 5.6, 1.1, 18, t.light);
      return s;
    },
    agenda({ title, items, page, kicker = 'CONTENTS' }) {
      count(items, 2, 4, 'Agenda'); const s = base({ title, kicker, page });
      items.forEach((item, i) => {
        const y = 1.85 + i * .72;
        text(s, String(i+1).padStart(2, '0'), .55, y, .7, .4, 16, t.accent, true);
        text(s, item.title, 1.6, y, 3.25, .42, 20, t.ink, true);
        text(s, item.body, 5.25, y, 4.2, .46, bodySize, t.muted);
        rule(s, 1.6, y + .59, 7.85);
      }); return s;
    },
    metrics({ title, stats, categories, values, seriesName, source, page }) {
      count(stats, 1, 3, 'Metrics'); count(categories, 2, 6, 'Chart');
      if (!Array.isArray(values) || values.length !== categories.length || values.some(v => !Number.isFinite(v) || v < 0)) throw new Error('Chart requires matching non-negative finite values');
      if (!source) throw new Error('Metrics needs source, date and unit context');
      const s = base({ title, kicker: 'PERFORMANCE', page });
      stats.forEach((stat, i) => {
        const y = 1.87 + i * .93;
        text(s, stat.value, .55, y, 2.9, .58, 32, t.accent, true);
        text(s, stat.label, .55, y + .6, 2.9, .24, 11, t.muted);
      });
      s.addChart(pres.ChartType.bar, [{ name: seriesName || 'Value', labels: categories, values }], {
        x: 3.7, y: 1.87, w: 5.7, h: 2.6, catAxisLabelFontFace: fontFace, valAxisLabelFontFace: fontFace,
        catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, chartColors: [t.accent],
        showLegend: false, showTitle: false, showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: t.ink,
        showCatName: false, showBorder: false, valAxisMinVal: 0,
        showMarker: false, showValAxisTitle: false,
        catAxisLineShow: false, valAxisLineShow: false, valGridLine: { color: t.line, width: .4 },
        showShadow: false,
      });
      text(s, source, 3.7, 4.66, 5.7, .22, 9, t.muted); return s;
    },
    comparison({ title, columns, rows, verdict = '', page }) {
      count(columns, 2, 2, 'Comparison columns'); count(rows, 2, 4, 'Comparison rows');
      const s = base({ title, kicker: 'DECISION', page });
      rect(s, 3.35, 1.82, 6.1, .48, t.ink);
      columns.forEach((c,i) => text(s, c, 3.52 + i * 3.04, 1.87, 2.7, .3, 14, t.light, true));
      rows.forEach((r,i) => {
        const y = 2.47 + i * .49;
        if (!Array.isArray(r.values) || r.values.length !== 2) throw new Error('Each comparison row needs two values');
        text(s, r.label, .55, y, 2.5, .33, 13, t.muted);
        r.values.forEach((v,j) => text(s, v, 3.52 + j * 3.04, y, 2.7, .33, 14, t.ink, j === 1));
        rule(s, .55, y + .41, 8.9);
      });
      text(s, verdict, .55, 4.64, 8.9, .29, 12, t.accent, true); return s;
    },
    caseStudy({ title, image: path, client, problem, approach, outcome, source = '', page }) {
      const s = base({ title, kicker: 'CASE STUDY', page });
      image(s, path, .55, 1.88, 4.4, 2.85);
      text(s, client, 5.4, 1.85, 4.05, .37, 18, t.accent, true);
      [ ['挑战', problem], ['方法', approach], ['结果', outcome] ].forEach(([key,value],i) => {
        const y = 2.48 + i * .75;
        text(s, key, 5.4, y, .6, .27, 11, t.muted, true);
        text(s, value, 6.15, y - .04, 3.3, .56, bodySize);
      });
      text(s, source, .55, 4.82, 8.9, .16, 8, t.muted); return s;
    },
    scope({ title, items, note = '', page }) {
      count(items, 2, 3, 'Scope'); const s = base({ title, kicker: 'SCOPE & INVESTMENT', page });
      const width = 8.9 / items.length;
      items.forEach((item,i) => {
        const x = .55 + i * width;
        text(s, String(i+1).padStart(2,'0'), x, 1.9, width - .3, .3, 12, t.accent, true);
        text(s, item.title, x, 2.45, width - .3, .56, 23, t.ink, true);
        text(s, item.body, x, 3.2, width - .3, .88, bodySize, t.muted);
        rule(s, x, 4.33, width - .3);
        text(s, item.price, x, 4.5, width - .3, .32, 15, t.accent, true);
      });
      // Commercial exclusions and pricing assumptions are part of the footer, not hidden.
      text(s, note, .55, .07, 8.9, .17, 8, t.muted); return s;
    },
    closing({ title, action, contact = '', page }) {
      const s = base({ dark: true, page });
      text(s, title, .55, 1.08, 8.9, 1.65, 43, t.light, true);
      text(s, action, .55, 3.28, 7.6, .83, 19, t.light);
      text(s, contact, .55, 4.54, 8.9, .25, 11, t.highlight); return s;
    },
  };
}
