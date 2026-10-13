import { estimateTextWidth } from '../lib/cjk-text.js';
/** Content-driven recipes. Canvas: 10 × 5.625 in; no network or hidden demo copy. */
export const recipes = {
  'research-report': { label: '研究报告', paper: 'F5F7FA', ink: '172B4D', muted: '46566D', accent: '165DAD', surface: 'E7EDF5', layout: 'evidence' },
  'product-story': { label: '产品展示', paper: 'F2F8F5', ink: '153B30', muted: '426155', accent: '176B52', surface: 'DFEEE5', layout: 'showcase' },
  'magazine-story': { label: '杂志叙事', paper: 'FFF9F1', ink: '302323', muted: '6C5149', accent: 'AA3528', surface: 'F3E8D9', layout: 'statement' },
  'roadmap-brief': { label: '路线图', paper: 'FFFFFF', ink: '242A35', muted: '515C70', accent: '5147A3', surface: 'EFEDF8', layout: 'timeline' },
};
export function createRecipe(pres, id, { fontFace = 'Microsoft YaHei', label = '' } = {}) {
  const t = recipes[id];
  if (!t) throw new Error(`Unknown recipe: ${id}`);
  pres.defineLayout({ name: 'RECIPE_WIDE', width: 10, height: 5.625 });
  pres.layout = 'RECIPE_WIDE';
  pres.theme = { headFontFace: fontFace, bodyFontFace: fontFace, lang: 'zh-CN' };
  const text = (s, value, x, y, w, h, size = 16, color = t.ink, bold = false) => {
    const lines = [];
    for (const paragraph of String(value ?? '').split('\n')) {
      let line = '';
      for (const ch of paragraph) {
        if (line && estimateTextWidth(line + ch, { fontSize: size, bold }) > w * 72 * .9) {
          // Keep closing punctuation with its preceding glyph.
          if ('，。！？；：、）》」』'.includes(ch)) {
            const chars = [...line]; const last = chars.pop(); lines.push(chars.join('')); line = last + ch;
          } else { lines.push(line); line = ch; }
        } else line += ch;
      }
      lines.push(line);
    }
    if (lines.length * size * 1.15 > h * 72) throw new Error('Text exceeds recipe slot; shorten content or split the slide');
    s.addText(lines.join('\n'), { x, y, w, h, fontSize: size, fontFace, color, bold, margin: 0, valign: 'mid' });
  };
  const rect = (s, x, y, w, h, color) => s.addShape(pres.ShapeType.rect, { x, y, w, h, fill: { color }, line: { color, transparency: 100 } });
  function frame(title, page) {
    const s = pres.addSlide(); s.background = { color: t.paper };
    rect(s, .55, .45, .06, .58, t.accent);
    text(s, title, .8, .4, 8.6, .8, 28, t.ink, true);
    text(s, label, .6, 5.12, 7.7, .22, 9, t.muted);
    text(s, String(page).padStart(2, '0'), 8.6, 5.04, .8, .35, 11, t.muted);
    return s;
  }
  function picture(s, image, x, y, w, h) {
    if (image) s.addImage({ path: image, x, y, w, h, sizing: { type: 'cover', w, h } });
    else rect(s, x, y, w, h, t.surface);
  }
  return {
    theme: t,
    /** Cover: editable title on a clear left field, optional photograph on right. */
    cover({ title, subtitle = '', image }) {
      const s = pres.addSlide(); s.background = { color: t.paper };
      picture(s, image, 6.25, 0, 3.75, 5.625);
      rect(s, .6, 1.1, .65, .055, t.accent);
      text(s, title, .6, 1.45, 5.2, 2.1, 36, t.ink, true);
      text(s, subtitle, .6, 3.9, 5.1, .7, 16, t.muted);
      return s;
    },
    /** Body slots vary by the selected recipe, all content supplied by caller. */
    content({ title, page = 2, lead = '', body = '', image, source = '', items = [] }) {
      const s = frame(title, page);
      if (t.layout === 'evidence') {
        picture(s, image, .6, 1.55, 5.4, 3.05);
        text(s, lead, 6.3, 1.55, 3.1, .95, 23, t.accent, true);
        text(s, body, 6.3, 2.7, 3.1, 1.65, 16);
        text(s, source, .6, 4.72, 8.8, .22, 9, t.muted);
      } else if (t.layout === 'showcase') {
        text(s, lead, .6, 1.65, 3.5, 1.15, 25, t.accent, true);
        text(s, body, .6, 3, 3.5, 1.6, 16);
        picture(s, image, 4.5, 1.55, 4.9, 3.3);
      } else if (t.layout === 'statement') {
        text(s, lead, .6, 1.65, 6.1, 1.7, 30, t.accent, true);
        text(s, body, .6, 3.65, 6.1, 1.1, 17);
        picture(s, image, 7.1, 1.55, 2.3, 3.3);
      } else {
        if (items.length < 2 || items.length > 4) throw new Error('Timeline needs 2–4 milestones; split longer roadmaps into slides');
        const step = 8.8 / items.length;
        rect(s, .8, 2.28, 8.2, .025, t.accent);
        items.forEach((item, i) => {
          const x = .6 + i * step;
          text(s, item.date, x, 1.55, step - .25, .4, 15, t.accent, true);
          rect(s, x + .08, 2.17, .22, .22, t.accent);
          text(s, item.title, x, 2.65, step - .25, .75, 19, t.ink, true);
          text(s, item.body, x, 3.55, step - .25, 1.05, 14, t.muted);
        });
      }
      return s;
    },
  };
}
