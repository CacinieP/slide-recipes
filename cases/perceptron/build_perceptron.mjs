// build_perceptron.mjs — 感知机问题深度解析（暗色创意 / Catppuccin Mocha 系）
// 中文学术汇报 PPT，原生可编辑图表（PptxGenJS）。由 themed-cn-pptx skill 生成。
// 运行：npm i pptxgenjs@4 && node build_perceptron.mjs
import pptxgen from "pptxgenjs";

const SW = 10, SH = 5.625;
const F_HEAD = "Microsoft YaHei", F_BODY = "Microsoft YaHei", F_MONO = "Consolas";

// ── 暗色创意调色板（浅主色用深字；深底承载正文）─────────────────
const C = {
  dominant: "89B4FA", dominantDeep: "74C7EC",
  secondary: "F5C2E7", secondarySoft: "CBA6F7",
  darkBg: "1E1E2E", darkBgDeep: "11111B",
  lightBg: "2A2A3C", lightBgAlt: "252536",
  white: "FFFFFF", ink: "11111B",
  textOnDark: "CDD6F4", textOnLight: "CDD6F4",
  muted: "8C92AE", line: "45475A",
  // 角色别名（暗色主题）
  pageBg: "1E1E2E", card: "2A2A3C", cardAlt: "252536",
  body: "CDD6F4", onAccent: "11111B",
  // XOR / 状态分类色（暗底用亮色）
  red: "F38BA8", blue: "89B4FA", ok: "A6E3A1", no: "F38BA8",
  grid: "3A3A50",
};
const SHADOW = () => ({ type: "outer", color: "000000", opacity: 0.35, blur: 8, offset: 2, angle: 90 });
const SOFT   = () => ({ type: "outer", color: "000000", opacity: 0.25, blur: 5, offset: 1, angle: 90 });

// ── CJK 预换行（与 render-qa 的 fitsBox 同源估算）────────────────
function charWide(cp) { return cp >= 0x2e80 || (cp >= 0x2010 && cp <= 0x2027); }
function estWidthPts(str, fontSize, bold) {
  const adv = bold ? 1.04 : 1.0; let w = 0;
  for (const ch of String(str)) { w += (charWide(ch.codePointAt(0)) ? 0.95 : 0.55) * fontSize * adv; }
  return w;
}
function wrapCJK(text, fontSize, boxWidthIn, opts = {}) {
  const { bold = false, factor = 0.9 } = opts;
  const maxPt = boxWidthIn * 72 * factor;
  const NO_LINE_START = /[。，、；：？！）》」』”’％…—]/;
  const out = [];
  for (const seg of String(text).split("\n")) {
    let line = "";
    for (const ch of seg) {
      const test = line + ch;
      if (estWidthPts(test, fontSize, bold) > maxPt && line) {
        if (NO_LINE_START.test(ch)) { line += ch; continue; }
        out.push(line); line = ch;
      } else line = test;
    }
    out.push(line);
  }
  return out.join("\n");
}

const pres = new pptxgen();
pres.defineLayout({ name: "STD", width: SW, height: SH });
pres.layout = "STD";
pres.author = "themed-cn-pptx";
pres.title = "感知机问题深度解析";
const SHp = pres.ShapeType;
const TOTAL = 15;

// ── 装饰三件套 ────────────────────────────────────────────────
function stripe(s) {
  s.addShape(SHp.rect, { x: 0, y: 0, w: SW, h: 0.075, fill: { color: C.dominant }, line: { color: C.dominant, width: 0 } });
  s.addShape(SHp.rect, { x: 0, y: 0.075, w: SW, h: 0.022, fill: { color: C.secondary }, line: { color: C.secondary, width: 0 } });
  s.addShape(SHp.rect, { x: 0, y: SH - 0.035, w: SW, h: 0.035, fill: { color: C.dominant }, line: { color: C.dominant, width: 0 } });
}
function sectionTitle(s, kicker, title) {
  s.addShape(SHp.rect, { x: 0.55, y: 0.46, w: 0.16, h: 0.16, fill: { color: C.secondary }, line: { color: C.secondary, width: 0 } });
  s.addText(kicker, { x: 0.8, y: 0.4, w: 7.5, h: 0.28, fontSize: 11.5, bold: true, color: C.dominantDeep, fontFace: F_BODY, charSpacing: 4, margin: 0 });
  s.addText(title, { x: 0.55, y: 0.72, w: 9, h: 0.62, fontSize: 27, bold: true, color: C.white, fontFace: F_HEAD, margin: 0 });
  s.addShape(SHp.rect, { x: 0.57, y: 1.4, w: 0.95, h: 0.045, fill: { color: C.dominant }, line: { color: C.dominant, width: 0 } });
  s.addShape(SHp.rect, { x: 1.55, y: 1.4, w: 0.3, h: 0.045, fill: { color: C.secondary }, line: { color: C.secondary, width: 0 } });
}
function footer(s, n) {
  s.addText("感知机问题 · 线性不可分的真相", { x: 0.55, y: SH - 0.34, w: 6, h: 0.24, fontSize: 8.5, color: C.muted, fontFace: F_BODY, margin: 0 });
  s.addText(`${n} / ${TOTAL}`, { x: SW - 1.3, y: SH - 0.34, w: 0.75, h: 0.24, fontSize: 8.5, color: C.muted, fontFace: F_BODY, align: "right", margin: 0 });
}
function bg(s, color) { s.background = { color }; }

// ── 图表原语 ──────────────────────────────────────────────────
function roomFrame(s, x, y, L) {
  s.addShape(SHp.rect, { x, y, w: L, h: L, fill: { color: C.card }, line: { color: C.line, width: 1.25 } });
  s.addShape(SHp.rect, { x: x + L / 2 - 0.006, y: y + 0.09, w: 0.012, h: L - 0.18, fill: { color: C.grid }, line: { color: C.grid, width: 0 } });
  s.addShape(SHp.rect, { x: x + 0.09, y: y + L / 2 - 0.006, w: L - 0.18, h: 0.012, fill: { color: C.grid }, line: { color: C.grid, width: 0 } });
}
function corners(x, y, L) { const i = L * 0.2; return { TL: [x + i, y + i], TR: [x + L - i, y + i], BL: [x + i, y + L - i], BR: [x + L - i, y + L - i] }; }
function dot(s, cx, cy, color, d = 0.33) { s.addShape(SHp.ellipse, { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: { color }, line: { color: C.darkBg, width: 2 } }); }
function tag(s, cx, cy, text, color) { s.addText(text, { x: cx - 0.28, y: cy - 0.02, w: 0.56, h: 0.22, fontSize: 9.5, bold: true, color, fontFace: F_BODY, align: "center", margin: 0 }); }
function segV(s, x, y, h, color) { s.addShape(SHp.rect, { x: x - 0.014, y, w: 0.028, h, fill: { color }, line: { color, width: 0 } }); }
function segH(s, x, y, w, color) { s.addShape(SHp.rect, { x, y: y - 0.014, w, h: 0.028, fill: { color }, line: { color, width: 0 } }); }
function diag(s, x, y, w, h, color, dash, flipV) { s.addShape(SHp.line, { x, y, w, h, line: { color, width: 2.2, dashType: dash || "solid" }, ...(flipV ? { flipV: true } : {}) }); }
function card(s, x, y, w, h, fill = C.card) { s.addShape(SHp.roundRect, { x, y, w, h, rectRadius: 0.07, fill: { color: fill }, line: { color: C.line, width: 1 }, shadow: SOFT() }); }
function node(s, cx, cy, r, fill, label, tcolor = C.onAccent, sub) {
  s.addShape(SHp.ellipse, { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, fill: { color: fill }, line: { color: C.darkBg, width: 2 }, shadow: SOFT() });
  const runs = [{ text: label, options: { bold: true, fontSize: 12, color: tcolor, breakLine: !!sub } }];
  if (sub) runs.push({ text: sub, options: { fontSize: 8.5, color: tcolor } });
  s.addText(runs, { x: cx - 0.6, y: cy - 0.28, w: 1.2, h: 0.56, align: "center", valign: "middle", fontFace: F_BODY, margin: 0 });
}

// ════════════════════════════ SLIDES ════════════════════════════

// ── 1. 封面 ──
(() => {
  const s = pres.addSlide(); bg(s, C.darkBg);
  s.addShape(SHp.ellipse, { x: 6.1, y: -2.3, w: 6.5, h: 6.5, fill: { color: C.dominant, transparency: 82 }, line: { color: C.dominant, width: 0 } });
  s.addShape(SHp.ellipse, { x: 7.4, y: 2.6, w: 4.6, h: 4.6, fill: { color: C.secondary, transparency: 86 }, line: { color: C.secondary, width: 0 } });
  s.addShape(SHp.rect, { x: 0, y: 0, w: SW, h: 0.09, fill: { color: C.dominant }, line: { width: 0 } });
  s.addShape(SHp.rect, { x: 0, y: 0.09, w: SW, h: 0.028, fill: { color: C.secondary }, line: { width: 0 } });
  s.addShape(SHp.roundRect, { x: 0.72, y: 0.98, w: 2.35, h: 0.4, rectRadius: 0.2, fill: { color: C.card }, line: { color: C.dominant, width: 1 } });
  s.addText("深度学习 · 经典议题", { x: 0.72, y: 0.98, w: 2.35, h: 0.4, fontSize: 11, bold: true, color: C.dominant, fontFace: F_BODY, align: "center", valign: "middle", charSpacing: 2, margin: 0 });
  s.addText([{ text: "感知机问题", options: { breakLine: true } }, { text: "线性不可分的真相", options: {} }],
    { x: 0.7, y: 1.62, w: 8.7, h: 2.0, fontSize: 44, bold: true, color: C.white, fontFace: F_HEAD, lineSpacingMultiple: 1.08, margin: 0 });
  s.addShape(SHp.rect, { x: 0.74, y: 3.62, w: 2.1, h: 0.07, fill: { color: C.secondary }, line: { width: 0 } });
  s.addText("从单层感知机为何解不了 XOR，到隐藏层如何改写空间", { x: 0.72, y: 3.86, w: 8.4, h: 0.5, fontSize: 15, color: C.textOnDark, fontFace: F_BODY, margin: 0 });
  s.addText([{ text: "Minsky & Papert (1969)  ·  神经网络的第一次寒冬与复兴", options: { color: C.muted } }],
    { x: 0.72, y: 4.75, w: 8.6, h: 0.4, fontSize: 12, fontFace: F_BODY, margin: 0 });
})();

// ── 2. 汇报脉络 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "AGENDA", "汇报脉络");
  const items = [
    ["01", "问题背景", "1969 年的否定性结论与第一次寒冬"],
    ["02", "核心观点", "决策边界只能是直线，激活函数只负责拍板"],
    ["03", "通俗比喻", "房间隔断：直墙工匠 vs 空间建筑师"],
    ["04", "数学与对比", "两层组合为何让边界弯曲"],
    ["05", "历史与启示", "技术限制不等于理论限制"],
    ["06", "结论要点", "先改造空间，再用直线划分"],
  ];
  const cw = 4.5, ch = 0.82, x0 = 0.55, y0 = 1.75, gx = 0.25, gy = 0.22;
  items.forEach((it, i) => {
    const cx = x0 + (i % 2) * (cw + gx), cy = y0 + Math.floor(i / 2) * (ch + gy);
    card(s, cx, cy, cw, ch);
    s.addShape(SHp.rect, { x: cx, y: cy, w: 0.07, h: ch, fill: { color: i % 2 ? C.secondary : C.dominant }, line: { width: 0 } });
    s.addText(it[0], { x: cx + 0.22, y: cy + 0.14, w: 0.7, h: 0.55, fontSize: 22, bold: true, color: C.dominant, fontFace: F_HEAD, valign: "middle", margin: 0 });
    s.addText(it[1], { x: cx + 0.98, y: cy + 0.13, w: 3.4, h: 0.32, fontSize: 14.5, bold: true, color: C.white, fontFace: F_HEAD, margin: 0 });
    s.addText(it[2], { x: cx + 0.98, y: cy + 0.44, w: 3.45, h: 0.3, fontSize: 10.5, color: C.muted, fontFace: F_BODY, margin: 0 });
  });
  footer(s, 2);
})();

// ── 3. 问题背景 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "BACKGROUND", "问题背景：一颗延迟引爆的炸弹");
  const ty = 2.05;
  segH(s, 1.0, ty, 8.0, C.line);
  const tl = [
    [1.2, C.dominant, "1958", "Rosenblatt 提出感知机，掀起连接主义第一波热潮"],
    [3.8, C.no, "1969", "Minsky & Papert《感知机》证明单层感知机无法解决 XOR 问题"],
    [6.3, C.muted, "1969–1986", "神经网络研究进入第一次寒冬，持续约 17 年"],
    [8.8, C.secondary, "1986", "反向传播算法成熟，领域重新焕发生机"],
  ];
  tl.forEach(([cx, col, yr, tx]) => {
    s.addShape(SHp.ellipse, { x: cx - 0.09, y: ty - 0.09, w: 0.18, h: 0.18, fill: { color: col }, line: { color: C.pageBg, width: 2 } });
    s.addText(yr, { x: cx - 1.1, y: ty - 0.62, w: 2.2, h: 0.3, fontSize: 13, bold: true, color: col, fontFace: F_HEAD, align: "center", margin: 0 });
    s.addText(wrapCJK(tx, 10.5, 2.3, { factor: 0.98 }), { x: cx - 1.15, y: ty + 0.28, w: 2.3, h: 1.4, fontSize: 10.5, color: C.muted, fontFace: F_BODY, align: "center", lineSpacingMultiple: 1.12, margin: 0 });
  });
  card(s, 0.55, 4.35, 8.9, 0.95, C.cardAlt);
  s.addShape(SHp.rect, { x: 0.55, y: 4.35, w: 0.09, h: 0.95, fill: { color: C.dominant }, line: { width: 0 } });
  s.addText([{ text: "本次汇报：", options: { bold: true, color: C.white } }, { text: "深入单层感知机的局限，看多层神经网络如何突破这一限制。", options: { color: C.body } }],
    { x: 0.85, y: 4.35, w: 8.4, h: 0.95, fontSize: 13.5, fontFace: F_BODY, valign: "middle", margin: 0 });
  footer(s, 3);
})();

// ── 4. 核心观点 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "CORE THESIS", "核心观点");
  card(s, 0.55, 1.7, 8.9, 1.15);
  s.addShape(SHp.rect, { x: 0.55, y: 1.7, w: 0.1, h: 1.15, fill: { color: C.secondary }, line: { width: 0 } });
  s.addText(wrapCJK("单层感知机的本质限制在于：它的决策边界只能是直线或超平面。激活函数只在决策之后“拍板”，并不参与边界形状的塑造。", 14.5, 8.35, { factor: 0.98 }),
    { x: 0.85, y: 1.7, w: 8.35, h: 1.15, fontSize: 14.5, color: C.body, fontFace: F_BODY, valign: "middle", lineSpacingMultiple: 1.18, margin: 0 });
  const pillars = [
    ["边界即直线", "无论 sigmoid、ReLU 还是阶跃，决策边界始终是一条直线", C.dominant],
    ["激活在末位", "激活函数只判断 z 是否 ≥ 0，是“拍板”而非“塑形”", C.secondary],
    ["隐藏层破局", "隐藏层在决策之前做非线性变换，改写空间几何结构", C.secondarySoft],
  ];
  const pw = 2.85, px0 = 0.55, py = 3.15, gap = 0.175;
  pillars.forEach((p, i) => {
    const px = px0 + i * (pw + gap);
    card(s, px, py, pw, 1.95);
    s.addShape(SHp.ellipse, { x: px + pw / 2 - 0.28, y: py + 0.22, w: 0.56, h: 0.56, fill: { color: p[2] }, line: { color: C.darkBg, width: 2 } });
    s.addText(String(i + 1), { x: px + pw / 2 - 0.28, y: py + 0.22, w: 0.56, h: 0.56, fontSize: 20, bold: true, color: C.onAccent, fontFace: F_HEAD, align: "center", valign: "middle", margin: 0 });
    s.addText(p[0], { x: px + 0.1, y: py + 0.92, w: pw - 0.2, h: 0.35, fontSize: 15, bold: true, color: C.white, fontFace: F_HEAD, align: "center", margin: 0 });
    s.addText(wrapCJK(p[1], 10.5, pw - 0.44), { x: px + 0.22, y: py + 1.3, w: pw - 0.44, h: 0.6, fontSize: 10.5, color: C.muted, fontFace: F_BODY, align: "center", lineSpacingMultiple: 1.12, margin: 0 });
  });
  footer(s, 4);
})();

// ── 5. XOR 问题 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "THE XOR PROBLEM", "用一个正方形房间来理解 XOR");
  const L = 2.95, px = 0.7, py = 1.7;
  roomFrame(s, px, py, L);
  const c = corners(px, py, L);
  s.addText("(0,0)", { x: px - 0.02, y: py + L - 0.02, w: 1.0, h: 0.28, fontSize: 10, color: C.muted, fontFace: F_MONO, margin: 0 });
  s.addText("(1,1)", { x: px + L - 0.72, y: py - 0.32, w: 0.8, h: 0.28, fontSize: 10, color: C.muted, fontFace: F_MONO, align: "right", margin: 0 });
  dot(s, c.TL[0], c.TL[1], C.red); tag(s, c.TL[0], c.TL[1] - 0.36, "红 ·1", C.red);
  dot(s, c.BR[0], c.BR[1], C.red); tag(s, c.BR[0], c.BR[1] + 0.14, "红 ·1", C.red);
  dot(s, c.BL[0], c.BL[1], C.blue); tag(s, c.BL[0] + 0.42, c.BL[1], "蓝 ·0", C.blue);
  dot(s, c.TR[0], c.TR[1], C.blue); tag(s, c.TR[0], c.TR[1] - 0.36, "蓝 ·0", C.blue);
  s.addText("任务：用一面墙，把红点与蓝点完全分开", { x: px - 0.15, y: py + L + 0.26, w: L + 0.7, h: 0.28, fontSize: 10.5, bold: true, color: C.dominant, fontFace: F_BODY, align: "center", margin: 0 });
  s.addText("XOR 真值表", { x: 4.55, y: 1.72, w: 4.9, h: 0.3, fontSize: 13, bold: true, color: C.white, fontFace: F_HEAD, margin: 0 });
  const rows = [
    [{ text: "x₁", options: { bold: true, color: C.onAccent, fill: { color: C.dominant } } }, { text: "x₂", options: { bold: true, color: C.onAccent, fill: { color: C.dominant } } }, { text: "x₁ XOR x₂", options: { bold: true, color: C.onAccent, fill: { color: C.dominant } } }],
    ["0", "0", { text: "0", options: { bold: true, color: C.blue } }],
    ["0", "1", { text: "1", options: { bold: true, color: C.red } }],
    ["1", "0", { text: "1", options: { bold: true, color: C.red } }],
    ["1", "1", { text: "0", options: { bold: true, color: C.blue } }],
  ].map(r => r.map(cell => typeof cell === "string" ? { text: cell, options: { color: C.body } } : cell));
  s.addTable(rows, { x: 4.55, y: 2.1, w: 4.85, colW: [1.1, 1.1, 2.65], rowH: 0.46, fontFace: F_MONO, fontSize: 13, align: "center", valign: "middle", border: { type: "solid", color: C.line, pt: 1 }, fill: { color: C.card } });
  card(s, 4.55, 4.55, 4.85, 0.75, C.cardAlt);
  s.addText([{ text: "输入相异输出 1、相同输出 0", options: { bold: true, color: C.white, breakLine: true } }, { text: "两个类别交错分布，天生无法用一条直线分开。", options: { color: C.muted, fontSize: 10.5 } }],
    { x: 4.8, y: 4.55, w: 4.4, h: 0.75, fontSize: 12.5, fontFace: F_BODY, valign: "middle", lineSpacingMultiple: 1.15, margin: 0 });
  footer(s, 5);
})();

// ── 6. 单层感知机 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "SINGLE LAYER", "单层感知机：只会砌直墙的工匠");
  const L = 2.92, px = 0.7, py = 1.72;
  roomFrame(s, px, py, L);
  const c = corners(px, py, L);
  segV(s, px + L / 2, py + 0.15, L - 0.3, C.muted);
  segH(s, px + 0.15, py + L / 2, L - 0.3, C.muted);
  diag(s, px + 0.2, py + 0.2, L - 0.4, L - 0.4, C.muted, "dash");
  diag(s, px + 0.2, py + 0.2, L - 0.4, L - 0.4, C.muted, "dash", true);
  dot(s, c.TL[0], c.TL[1], C.red); dot(s, c.BR[0], c.BR[1], C.red);
  dot(s, c.BL[0], c.BL[1], C.blue); dot(s, c.TR[0], c.TR[1], C.blue);
  s.addText("竖墙 / 横墙 / 斜墙，任何角度都失败", { x: px - 0.1, y: py + L + 0.26, w: L + 0.7, h: 0.28, fontSize: 10.5, bold: true, color: C.no, fontFace: F_BODY, align: "center", margin: 0 });
  const rx = 4.55;
  s.addText([{ text: "✗ ", options: { color: C.no, bold: true } }, { text: "总有一侧的同类点落在墙的同旁", options: { color: C.body } }],
    { x: rx, y: 1.78, w: 4.9, h: 0.4, fontSize: 14, fontFace: F_BODY, margin: 0 });
  const reasons = [
    "决策由线性函数 w·x + b 给出",
    "激活函数只在最后问一句“z ≥ 0 吗”",
    "它没有改变墙的形状 —— 墙永远是直的",
    "sigmoid / ReLU / 阶跃都救不了这条线",
  ];
  reasons.forEach((r, i) => {
    const yy = 2.35 + i * 0.62;
    card(s, rx, yy, 4.85, 0.52);
    s.addShape(SHp.ellipse, { x: rx + 0.18, y: yy + 0.17, w: 0.18, h: 0.18, fill: { color: C.dominant }, line: { width: 0 } });
    s.addText(r, { x: rx + 0.5, y: yy, w: 4.25, h: 0.52, fontSize: 12, color: C.body, fontFace: F_BODY, valign: "middle", margin: 0 });
  });
  footer(s, 6);
})();

// ── 7. 多层神经网络 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "MULTI LAYER", "多层网络：会“空间魔法”的建筑师");
  s.addText("思路反转：不在原始房间砌墙，而是先改造房间。", { x: 0.55, y: 1.62, w: 8.9, h: 0.32, fontSize: 13.5, bold: true, color: C.dominant, fontFace: F_BODY, margin: 0 });
  const baseX = 0.9, colGap = 1.85, r = 0.34;
  const yIn1 = 3.0, yIn2 = 3.9, yH1 = 2.7, yH2 = 3.6, yOut = 3.45;
  const inX = baseX, hX = baseX + colGap, oX = baseX + colGap * 2;
  const wire = (x1, y1, x2, y2) => s.addShape(SHp.line, { x: x1, y: Math.min(y1, y2), w: x2 - x1, h: Math.abs(y2 - y1), line: { color: C.line, width: 1.4 }, ...(y1 < y2 ? { flipV: true } : {}) });
  [[yIn1, yH1], [yIn1, yH2], [yIn2, yH1], [yIn2, yH2]].forEach(([a, b]) => wire(inX + r, a, hX - r, b));
  [[yH1, yOut], [yH2, yOut]].forEach(([a, b]) => wire(hX + r, a, oX - r, b));
  node(s, inX, yIn1, r, C.dominant, "x₁");
  node(s, inX, yIn2, r, C.dominant, "x₂");
  node(s, hX, yH1, r + 0.04, C.secondarySoft, "OR", C.onAccent, "镜子 1");
  node(s, hX, yH2, r + 0.04, C.secondarySoft, "NAND", C.onAccent, "镜子 2");
  node(s, oX, yOut, r, C.dominantDeep, "y");
  s.addText("输入层", { x: inX - 0.5, y: 4.52, w: 1.0, h: 0.24, fontSize: 9.5, color: C.muted, fontFace: F_BODY, align: "center", margin: 0 });
  s.addText("隐藏层", { x: hX - 0.5, y: 4.52, w: 1.0, h: 0.24, fontSize: 9.5, color: C.muted, fontFace: F_BODY, align: "center", margin: 0 });
  s.addText("输出层", { x: oX - 0.5, y: 4.52, w: 1.0, h: 0.24, fontSize: 9.5, color: C.muted, fontFace: F_BODY, align: "center", margin: 0 });
  const rx = 5.1;
  const notes = [
    ["每个隐藏神经元是一面“镜子”", "对房间做非线性变形，把点搬到一个新位置", C.dominant],
    ["神经元 1 模拟 OR 门", "把房间“压扁”，让某些区域先亮起来", C.secondary],
    ["神经元 2 模拟 NAND 门", "把房间“反转”，让另一些区域亮起来", C.secondary],
    ["输出层只做一次 AND", "在变形后的新空间里，一条直墙就够用了", C.secondarySoft],
  ];
  notes.forEach((n, i) => {
    const yy = 2.05 + i * 0.72;
    card(s, rx, yy, 4.35, 0.62);
    s.addShape(SHp.rect, { x: rx, y: yy, w: 0.06, h: 0.62, fill: { color: n[2] }, line: { width: 0 } });
    s.addText([{ text: n[0] + "  ", options: { bold: true, color: C.white, breakLine: true } }, { text: n[1], options: { color: C.muted, fontSize: 10 } }],
      { x: rx + 0.22, y: yy, w: 4.05, h: 0.62, fontSize: 12, fontFace: F_BODY, valign: "middle", lineSpacingMultiple: 1.05, margin: 0 });
  });
  footer(s, 7);
})();

// ── 8. 空间变换 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "SPACE TRANSFORM", "核心机制：先改造空间，再直线划分");
  const L = 2.7, py = 1.85;
  const lx = 0.65;
  roomFrame(s, lx, py, L);
  const lc = corners(lx, py, L);
  dot(s, lc.TL[0], lc.TL[1], C.red); dot(s, lc.BR[0], lc.BR[1], C.red);
  dot(s, lc.BL[0], lc.BL[1], C.blue); dot(s, lc.TR[0], lc.TR[1], C.blue);
  segV(s, lx + L / 2, py + 0.12, L - 0.24, C.no);
  diag(s, lx + 0.18, py + 0.18, L - 0.36, L - 0.36, C.no, "dash");
  s.addText("原始空间", { x: lx, y: py - 0.34, w: L, h: 0.26, fontSize: 12, bold: true, color: C.white, fontFace: F_HEAD, align: "center", margin: 0 });
  s.addText("直线不可分 ✗", { x: lx, y: py + L + 0.12, w: L, h: 0.3, fontSize: 11.5, bold: true, color: C.no, fontFace: F_BODY, align: "center", margin: 0 });
  const ay = py + L / 2;
  s.addShape(SHp.rightArrow, { x: 3.5, y: ay - 0.22, w: 0.95, h: 0.44, fill: { color: C.secondary }, line: { width: 0 } });
  s.addText([{ text: "隐藏层", options: { breakLine: true } }, { text: "非线性变换", options: {} }], { x: 3.3, y: ay - 0.85, w: 1.35, h: 0.5, fontSize: 9.5, bold: true, color: C.dominant, fontFace: F_BODY, align: "center", margin: 0 });
  const rxp = 4.75;
  roomFrame(s, rxp, py, L);
  const inset = 0.42;
  const P = (gx, gy) => [rxp + inset + gx * (L - 2 * inset), py + L - inset - gy * (L - 2 * inset)];
  const b1 = P(0, 1), b2 = P(1, 0), r1 = P(1, 1), r2 = P(0.88, 0.88);
  dot(s, b1[0], b1[1], C.blue); dot(s, b2[0], b2[1], C.blue);
  dot(s, r1[0], r1[1], C.red); dot(s, r2[0], r2[1], C.red);
  const p0 = P(0.42, 1.0), p1 = P(1.0, 0.42);
  diag(s, Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]), Math.abs(p1[0] - p0[0]), Math.abs(p1[1] - p0[1]), C.ok, "solid", p1[1] > p0[1]);
  s.addText("特征空间 (OR, NAND)", { x: rxp, y: py - 0.34, w: L, h: 0.26, fontSize: 12, bold: true, color: C.white, fontFace: F_HEAD, align: "center", margin: 0 });
  s.addText("一条直线即可分开 ✓", { x: rxp, y: py + L + 0.12, w: L, h: 0.3, fontSize: 11.5, bold: true, color: C.ok, fontFace: F_BODY, align: "center", margin: 0 });
  card(s, 8.0, py + 0.15, 1.5, L - 0.3, C.cardAlt);
  s.addText([{ text: "同一条“直线”", options: { bold: true, color: C.dominant, breakLine: true } }, { text: "\n", options: { fontSize: 4 } }, { text: wrapCJK("在原始空间做不到，在变换后的空间轻松做到。", 10.5, 1.26), options: { color: C.body, fontSize: 10.5 } }],
    { x: 8.12, y: py + 0.3, w: 1.26, h: L - 0.55, fontSize: 11.5, fontFace: F_BODY, valign: "top", lineSpacingMultiple: 1.15, margin: 0 });
  footer(s, 8);
})();

// ── 9. 数学语言 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "THE MATH", "用数学语言看这条边界");
  card(s, 0.55, 1.72, 8.9, 1.32);
  s.addShape(SHp.rect, { x: 0.55, y: 1.72, w: 0.1, h: 1.32, fill: { color: C.no }, line: { width: 0 } });
  s.addText("单层感知机", { x: 0.85, y: 1.86, w: 3, h: 0.3, fontSize: 12.5, bold: true, color: C.no, fontFace: F_HEAD, margin: 0 });
  s.addText("w₁x₁ + w₂x₂ + b = 0", { x: 0.85, y: 2.18, w: 5.4, h: 0.62, fontSize: 26, bold: true, color: C.white, fontFace: F_MONO, valign: "middle", margin: 0 });
  s.addText("决策边界恒为一条直线；\n换任何激活函数都不会改变它。", { x: 6.4, y: 2.05, w: 2.95, h: 0.9, fontSize: 11.5, color: C.muted, fontFace: F_BODY, valign: "middle", lineSpacingMultiple: 1.2, margin: 0 });
  card(s, 0.55, 3.28, 8.9, 1.82);
  s.addShape(SHp.rect, { x: 0.55, y: 3.28, w: 0.1, h: 1.82, fill: { color: C.ok }, line: { width: 0 } });
  s.addText("多层神经网络", { x: 0.85, y: 3.42, w: 3, h: 0.3, fontSize: 12.5, bold: true, color: C.ok, fontFace: F_HEAD, margin: 0 });
  s.addText([
    { text: "隐藏层变换   ", options: { color: C.muted, fontSize: 11 } },
    { text: "h = σ(W₁x + b₁)", options: { color: C.body, bold: true, fontSize: 18, fontFace: F_MONO, breakLine: true } },
    { text: "输出层划分   ", options: { color: C.muted, fontSize: 11 } },
    { text: "y = σ(W₂·σ(W₁x + b₁) + b₂)", options: { color: C.dominant, bold: true, fontSize: 18, fontFace: F_MONO } },
  ], { x: 0.85, y: 3.78, w: 6.0, h: 1.2, fontFace: F_BODY, lineSpacingMultiple: 1.5, valign: "middle", margin: 0 });
  s.addText(wrapCJK("σ 非线性 ⇒ 复合函数非线性 ⇒ 边界可为曲线、曲面、任意复杂形状。", 11, 2.6), { x: 6.75, y: 3.62, w: 2.6, h: 1.4, fontSize: 11, color: C.muted, fontFace: F_BODY, valign: "middle", lineSpacingMultiple: 1.25, margin: 0 });
  footer(s, 9);
})();

// ── 10. 对比分析 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "COMPARISON", "单层 vs 多层：五维对比");
  const H = { options: { bold: true, color: C.onAccent, fill: { color: C.dominant }, fontSize: 13 } };
  const Dim = { options: { bold: true, color: C.white, fill: { color: C.cardAlt }, fontSize: 12, align: "left" } };
  const cell = (t, col) => ({ text: t, options: { color: col || C.body, fontSize: 11.5, align: "left" } });
  const rows = [
    [{ text: "维度", options: { bold: true, color: C.onAccent, fill: { color: C.dominantDeep }, fontSize: 13, align: "left" } }, { text: "单层感知机", options: { ...H, align: "left" } }, { text: "多层神经网络", options: { ...H, align: "left" } }],
    [{ text: "决策边界", options: Dim.options }, cell("只能是直线"), cell("可以是曲线 / 曲面", C.ok)],
    [{ text: "激活函数作用", options: Dim.options }, cell("只在最后“拍板”"), cell("参与空间变换", C.ok)],
    [{ text: "能否解 XOR", options: Dim.options }, cell("不能", C.no), cell("能", C.ok)],
    [{ text: "核心限制", options: Dim.options }, cell("只能线性划分", C.no), cell("需要有效的训练算法")],
    [{ text: "解决方案", options: Dim.options }, cell("无 —— 这是理论限制", C.no), cell("增加隐藏层 + 反向传播", C.ok)],
  ];
  s.addTable(rows, { x: 0.55, y: 1.75, w: 8.9, colW: [1.9, 3.4, 3.6], rowH: 0.62, fontFace: F_BODY, align: "left", valign: "middle", border: { type: "solid", color: C.line, pt: 1 }, fill: { color: C.card }, margin: 0.08 });
  footer(s, 10);
})();

// ── 11. 历史意义 ──
(() => {
  const s = pres.addSlide(); bg(s, C.darkBgDeep); stripe(s);
  sectionTitle(s, "HISTORICAL IMPACT", "一颗“炸弹”与十七年寒冬");
  const blocks = [
    ["深远冲击", "1969 年的否定性结论像一颗炸弹，让大量研究者放弃神经网络，转而投向其他方向。", C.dominant],
    ["讽刺之处", "解决方案其实早已存在 —— 多层网络概念并不新颖，只是当时无人能有效训练它。", C.secondary],
    ["三重枷锁", "缺乏有效训练算法 + 计算机算力不足 + 权威结论压制，让希望被延后了十七年。", C.secondarySoft],
  ];
  const cw = 2.85, px0 = 0.55, py = 1.85, gap = 0.175;
  blocks.forEach((b, i) => {
    const px = px0 + i * (cw + gap);
    card(s, px, py, cw, 2.5, C.card);
    s.addShape(SHp.rect, { x: px, y: py, w: cw, h: 0.06, fill: { color: b[2] }, line: { width: 0 } });
    s.addText(String(i + 1).padStart(2, "0"), { x: px + 0.22, y: py + 0.25, w: 1.2, h: 0.6, fontSize: 30, bold: true, color: b[2], fontFace: F_HEAD, margin: 0 });
    s.addText(b[0], { x: px + 0.24, y: py + 0.95, w: cw - 0.48, h: 0.36, fontSize: 15, bold: true, color: C.white, fontFace: F_HEAD, margin: 0 });
    s.addText(wrapCJK(b[1], 11, cw - 0.48), { x: px + 0.24, y: py + 1.35, w: cw - 0.48, h: 1.05, fontSize: 11, color: C.muted, fontFace: F_BODY, lineSpacingMultiple: 1.2, margin: 0 });
  });
  footer(s, 11);
})();

// ── 12. 深刻启示 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "LESSONS", "三点深刻启示");
  const rows = [
    ["技术限制 ≠ 理论限制", "解不了往往只是“当时做不到”，问题本身也许早有出路。", C.dominant],
    ["算法至关重要", "没有有效的训练算法，再漂亮的理论突破也落不了地。", C.secondary],
    ["警惕权威叙事", "Minsky 的权威影响了整个领域 —— 保持独立思考，别被定论劝退。", C.secondarySoft],
  ];
  rows.forEach((r, i) => {
    const yy = 1.85 + i * 1.08;
    card(s, 0.55, yy, 8.9, 0.92);
    s.addShape(SHp.ellipse, { x: 0.85, y: yy + 0.21, w: 0.5, h: 0.5, fill: { color: r[2] }, line: { color: C.darkBg, width: 2 } });
    s.addText(String(i + 1), { x: 0.85, y: yy + 0.21, w: 0.5, h: 0.5, fontSize: 20, bold: true, color: C.onAccent, fontFace: F_HEAD, align: "center", valign: "middle", margin: 0 });
    s.addText(r[0], { x: 1.55, y: yy + 0.14, w: 7.7, h: 0.36, fontSize: 16, bold: true, color: C.white, fontFace: F_HEAD, margin: 0 });
    s.addText(r[1], { x: 1.55, y: yy + 0.5, w: 7.7, h: 0.36, fontSize: 11.5, color: C.muted, fontFace: F_BODY, margin: 0 });
  });
  footer(s, 12);
})();

// ── 13. 核心结论 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "CONCLUSION", "核心结论");
  card(s, 0.55, 1.7, 4.35, 2.5);
  s.addShape(SHp.rect, { x: 0.55, y: 1.7, w: 4.35, h: 0.5, fill: { color: C.no }, line: { width: 0 } });
  s.addText("单层感知机", { x: 0.75, y: 1.7, w: 4, h: 0.5, fontSize: 14, bold: true, color: C.onAccent, fontFace: F_HEAD, valign: "middle", margin: 0 });
  s.addText(wrapCJK("本质限制在于决策边界永远是直线；激活函数不参与空间变换，无法解决非线性问题。", 12.5, 3.9), { x: 0.8, y: 2.35, w: 3.9, h: 1.7, fontSize: 12.5, color: C.body, fontFace: F_BODY, lineSpacingMultiple: 1.28, margin: 0 });
  card(s, 5.1, 1.7, 4.35, 2.5);
  s.addShape(SHp.rect, { x: 5.1, y: 1.7, w: 4.35, h: 0.5, fill: { color: C.ok }, line: { width: 0 } });
  s.addText("多层神经网络", { x: 5.3, y: 1.7, w: 4, h: 0.5, fontSize: 14, bold: true, color: C.onAccent, fontFace: F_HEAD, valign: "middle", margin: 0 });
  s.addText(wrapCJK("突破在于隐藏层做非线性空间变换，把非线性问题转化为线性问题，在新空间中用直线即可解决。", 12.5, 3.9), { x: 5.35, y: 2.35, w: 3.9, h: 1.7, fontSize: 12.5, color: C.body, fontFace: F_BODY, lineSpacingMultiple: 1.28, margin: 0 });
  card(s, 0.55, 4.32, 8.9, 0.95, C.cardAlt);
  s.addShape(SHp.rect, { x: 0.55, y: 4.32, w: 0.09, h: 0.95, fill: { color: C.dominant }, line: { width: 0 } });
  s.addText([{ text: "一句话思想：", options: { bold: true, color: C.white } }, { text: "先改造空间，再在新空间中用直线划分。", options: { color: C.body } }],
    { x: 0.85, y: 4.32, w: 8.4, h: 0.95, fontSize: 14.5, fontFace: F_BODY, valign: "middle", margin: 0 });
  footer(s, 13);
})();

// ── 14. 总结要点 ──
(() => {
  const s = pres.addSlide(); bg(s, C.pageBg); stripe(s);
  sectionTitle(s, "TAKEAWAYS", "四个要点，一图带走");
  const pts = [
    ["线性可分", "单层只能线性划分，边界是直线，解不了 XOR。", C.dominant],
    ["隐藏层", "多层网络靠隐藏层做非线性变换，突破限制。", C.secondary],
    ["改空间思想", "核心是先把空间改写，再用一条直线划分。", C.dominantDeep],
    ["历史教训", "技术限制 ≠ 理论限制，解法也许早已存在。", C.secondarySoft],
  ];
  const cw = 4.35, ch = 1.6, gx = 0.2, gy = 0.2, x0 = 0.55, y0 = 1.72;
  pts.forEach((p, i) => {
    const px = x0 + (i % 2) * (cw + gx), py = y0 + Math.floor(i / 2) * (ch + gy);
    card(s, px, py, cw, ch);
    s.addShape(SHp.rect, { x: px, y: py, w: 0.09, h: ch, fill: { color: p[2] }, line: { width: 0 } });
    s.addText("0" + (i + 1), { x: px + 0.28, y: py + 0.18, w: 1.0, h: 0.4, fontSize: 15, bold: true, color: p[2], fontFace: F_HEAD, margin: 0 });
    s.addText(p[0], { x: px + 0.28, y: py + 0.6, w: cw - 0.5, h: 0.34, fontSize: 15.5, bold: true, color: C.white, fontFace: F_HEAD, margin: 0 });
    s.addText(p[1], { x: px + 0.28, y: py + 0.98, w: cw - 0.55, h: 0.6, fontSize: 11, color: C.muted, fontFace: F_BODY, lineSpacingMultiple: 1.15, margin: 0 });
  });
  footer(s, 14);
})();

// ── 15. 参考文献 + 收尾 ──
(() => {
  const s = pres.addSlide(); bg(s, C.darkBgDeep);
  s.addShape(SHp.ellipse, { x: 6.6, y: 2.8, w: 5.5, h: 5.5, fill: { color: C.dominant, transparency: 86 }, line: { width: 0 } });
  s.addShape(SHp.rect, { x: 0, y: 0, w: SW, h: 0.09, fill: { color: C.dominant }, line: { width: 0 } });
  s.addShape(SHp.rect, { x: 0, y: 0.09, w: SW, h: 0.028, fill: { color: C.secondary }, line: { width: 0 } });
  s.addText("REFERENCES", { x: 0.72, y: 0.7, w: 6, h: 0.3, fontSize: 12, bold: true, color: C.dominant, fontFace: F_BODY, charSpacing: 4, margin: 0 });
  s.addText("参考文献", { x: 0.7, y: 1.0, w: 7, h: 0.6, fontSize: 28, bold: true, color: C.white, fontFace: F_HEAD, margin: 0 });
  s.addShape(SHp.rect, { x: 0.72, y: 1.72, w: 1.1, h: 0.05, fill: { color: C.secondary }, line: { width: 0 } });
  const refs = [
    ["Minsky, M. & Papert, S. (1969)", "《Perceptrons: An Introduction to Computational Geometry》 感知机：计算几何导论"],
    ["Rumelhart, Hinton & Williams (1986)", "《Learning Representations by Back-propagating Errors》 Nature 23 (5191)"],
    ["Goodfellow, Bengio & Courville (2016)", "《Deep Learning》 深度学习，MIT Press"],
  ];
  refs.forEach((r, i) => {
    const yy = 1.95 + i * 0.92;
    s.addShape(SHp.roundRect, { x: 0.72, y: yy, w: 8.55, h: 0.78, rectRadius: 0.06, fill: { color: C.card }, line: { color: C.dominant, width: 1 } });
    s.addText(String(i + 1).padStart(2, "0"), { x: 0.9, y: yy, w: 0.6, h: 0.78, fontSize: 18, bold: true, color: C.dominant, fontFace: F_HEAD, valign: "middle", margin: 0 });
    s.addText([{ text: r[0], options: { bold: true, color: C.white, breakLine: true } }, { text: r[1], options: { color: C.muted, fontSize: 10.5 } }],
      { x: 1.62, y: yy, w: 7.5, h: 0.78, fontSize: 12.5, fontFace: F_BODY, valign: "middle", lineSpacingMultiple: 1.1, margin: 0 });
  });
  s.addText("技术限制不等于理论限制 —— 谢谢。", { x: 0.72, y: 4.72, w: 8.5, h: 0.36, fontSize: 13, italic: true, color: C.muted, fontFace: F_BODY, margin: 0 });
  footer(s, 15);
})();

const OUT = "perceptron-deepdive.pptx";
await pres.writeFile({ fileName: OUT });
console.log("WROTE", OUT, "slides=", TOTAL);
