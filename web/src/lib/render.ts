import type { DeckPlan, FontPair, SlidePlan, StyleMetrics, Theme } from "./types";

type AnyPptx = any;

interface RenderCtx {
  theme: Theme;
  fonts: FontPair;
  style: StyleMetrics;
}

export async function renderPptx(
  plan: DeckPlan,
  ctx: {
    theme: Theme;
    fonts: FontPair;
    style: StyleMetrics;
    language: "zh-CN" | "en-US";
  },
): Promise<Blob | Buffer> {
  const mod: any = await import("pptxgenjs");
  const PptxGenJS = mod.default ?? mod;
  const pres: AnyPptx = new PptxGenJS();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Slide Recipes";
  pres.title = plan.title;

  const { theme, fonts, style } = ctx;

  plan.slides.forEach((slide, idx) => {
    renderSlide(pres, slide, idx, { theme, fonts, style });
  });

  // Check if running in browser vs node
  const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
  if (isBrowser) {
    const blob = await pres.write({ outputType: "blob" });
    return blob as Blob;
  }

  const result = await pres.write({ outputType: "nodebuffer" });
  return Buffer.isBuffer(result) ? result : Buffer.from(result as ArrayBuffer);
}

function renderSlide(pres: AnyPptx, slide: SlidePlan, idx: number, ctx: RenderCtx): void {
  const pageNum = idx + 1;
  const s: AnyPptx = pres.addSlide();
  s.background = { color: ctx.theme.bg };

  switch (slide.type) {
    case "cover":
      renderCover(pres, s, slide, ctx);
      break;

    case "toc":
    case "agenda":
      renderAgenda(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "section":
      renderSection(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "executiveSummary":
      renderExecutiveSummary(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "kpiDashboard":
      renderKpiDashboard(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "processFlow":
      renderProcessFlow(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "funnel":
      renderFunnel(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "gantt":
      renderGantt(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "comparison":
      renderComparison(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "swot":
      renderSwot(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "quadrant":
      renderQuadrant(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "team":
      renderTeam(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "pricing":
      renderPricing(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "testimonial":
      renderTestimonial(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "milestoneTimeline":
      renderMilestoneTimeline(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "featureGrid":
      renderFeatureGrid(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "statCallout":
      renderStatCallout(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "architectureStack":
      renderArchitectureStack(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "marketSize":
      renderMarketSize(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "faq":
      renderFaq(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;

    case "closing":
    case "summary":
      renderClosing(pres, s, slide, ctx);
      break;

    case "content":
    default:
      renderContent(pres, s, slide, ctx);
      addBadge(pres, s, pageNum, ctx);
      break;
  }
}

// ----------------- Base Helper -----------------

function renderHeader(pres: AnyPptx, s: AnyPptx, kicker: string, title: string, ctx: RenderCtx) {
  const { theme, fonts } = ctx;
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.04, fill: { color: theme.accent } });
  if (kicker) {
    s.addText(kicker, {
      x: 0.55, y: 0.38, w: 8.9, h: 0.24,
      fontSize: 10, fontFace: fonts.body, color: theme.accent, bold: true,
    });
  }
  s.addText(title, {
    x: 0.55, y: 0.75, w: 8.9, h: 0.75,
    fontSize: 26, fontFace: fonts.header, color: theme.primary, bold: true, valign: "middle",
  });
  s.addShape(pres.shapes.LINE, { x: 0.55, y: 1.55, w: 8.9, h: 0, line: { color: theme.secondary, width: 0.5 } });
}

function renderSource(s: AnyPptx, note: string | undefined, ctx: RenderCtx) {
  if (!note) return;
  s.addText(note, {
    x: 0.55, y: 4.9, w: 8.2, h: 0.25,
    fontSize: 9, fontFace: ctx.fonts.body, color: ctx.theme.secondary,
  });
}

// ----------------- Page Renderers -----------------

function renderCover(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  const m = style.pageMargin;
  const left = m + 0.6;

  s.addShape(pres.shapes.RECTANGLE, { x: m, y: 1.6, w: 0.12, h: 1.8, fill: { color: theme.accent } });

  s.addText(slide.title, {
    x: left, y: 1.6, w: 10 - left - m, h: 1.8,
    fontSize: 48, fontFace: fonts.header, color: theme.primary,
    bold: true, align: "left", valign: "middle",
  });

  const subtitle = slide.bullets?.[0] || slide.note || "";
  if (subtitle) {
    s.addText(subtitle, {
      x: left, y: 3.55, w: 10 - left - m, h: 0.6,
      fontSize: 20, fontFace: fonts.body, color: theme.secondary,
    });
  }
}

function renderAgenda(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "AGENDA", slide.title || "汇报议程", ctx);
  const items = slide.items || slide.bullets?.map((b) => ({ title: b, body: "" })) || [];
  const count = Math.max(items.length, 1);
  const stepY = 3.0 / count;

  items.slice(0, 4).forEach((item, i) => {
    const y = 1.8 + i * stepY;
    s.addText(String(i + 1).padStart(2, "0"), {
      x: 0.55, y, w: 0.6, h: 0.4,
      fontSize: 18, fontFace: fonts.header, color: theme.accent, bold: true,
    });
    s.addText(item.title || "", {
      x: 1.4, y, w: 3.2, h: 0.4,
      fontSize: 18, fontFace: fonts.header, color: theme.primary, bold: true,
    });
    if (item.body) {
      s.addText(item.body, {
        x: 4.8, y, w: 4.5, h: 0.45,
        fontSize: 14, fontFace: fonts.body, color: theme.secondary,
      });
    }
    s.addShape(pres.shapes.LINE, { x: 1.4, y: y + 0.48, w: 7.9, h: 0, line: { color: theme.secondary, width: 0.3 } });
  });
}

function renderSection(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  const m = style.pageMargin;
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.35, h: 5.625, fill: { color: theme.accent } });

  const num = String(slide.title.match(/^\d+/)?.[0] ?? "01");
  s.addText(num, {
    x: m + 0.4, y: 1.0, w: 9 - m, h: 2.0,
    fontSize: 90, fontFace: fonts.header, color: theme.accent, bold: true,
  });

  s.addText(slide.title, {
    x: m + 0.4, y: 3.1, w: 9 - m, h: 0.8,
    fontSize: 32, fontFace: fonts.header, color: theme.primary, bold: true,
  });

  const intro = slide.bullets?.join("  ") || slide.note;
  if (intro) {
    s.addText(intro, {
      x: m + 0.4, y: 4.0, w: 9 - m, h: 0.8,
      fontSize: 16, fontFace: fonts.body, color: theme.secondary,
    });
  }
}

function renderExecutiveSummary(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "EXECUTIVE SUMMARY", slide.title || "执行摘要", ctx);

  s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y: 1.85, w: 3.4, h: 2.8, fill: { color: theme.primary } });
  s.addText("核心决策", {
    x: 0.8, y: 2.05, w: 2.9, h: 0.3,
    fontSize: 11, fontFace: fonts.body, color: theme.accent, bold: true,
  });
  s.addText(slide.decision || "明确行动目标与实施优先级", {
    x: 0.8, y: 2.5, w: 2.9, h: 1.8,
    fontSize: 20, fontFace: fonts.header, color: "FFFFFF", bold: true,
  });

  const evidence = slide.evidence || slide.bullets || [];
  evidence.slice(0, 3).forEach((item, i) => {
    const y = 1.9 + i * 0.9;
    s.addText(String(i + 1).padStart(2, "0"), {
      x: 4.3, y, w: 0.5, h: 0.3,
      fontSize: 14, fontFace: fonts.header, color: theme.accent, bold: true,
    });
    s.addText(item, {
      x: 4.9, y, w: 4.5, h: 0.65,
      fontSize: 15, fontFace: fonts.body, color: theme.primary,
    });
    s.addShape(pres.shapes.LINE, { x: 4.9, y: y + 0.72, w: 4.5, h: 0, line: { color: theme.secondary, width: 0.4 } });
  });

  renderSource(s, slide.nextStep, ctx);
}

function renderKpiDashboard(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "KPI DASHBOARD", slide.title, ctx);
  const items = slide.items || [];
  const count = Math.max(items.length, 1);
  const cardW = 8.9 / count;

  items.slice(0, 4).forEach((item, i) => {
    const x = 0.55 + i * cardW;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.85, w: cardW - 0.25, h: 2.8,
      fill: { color: "FFFFFF" }, line: { color: theme.secondary, width: 0.5 },
    });
    s.addText(item.label || "", {
      x: x + 0.15, y: 2.05, w: cardW - 0.55, h: 0.3,
      fontSize: 13, fontFace: fonts.body, color: theme.secondary,
    });
    s.addText(String(item.value || ""), {
      x: x + 0.15, y: 2.5, w: cardW - 0.55, h: 0.8,
      fontSize: 32, fontFace: fonts.header, color: theme.accent, bold: true,
    });
    if (item.change) {
      s.addText(item.change, {
        x: x + 0.15, y: 3.4, w: cardW - 0.55, h: 0.4,
        fontSize: 14, fontFace: fonts.body, color: theme.primary, bold: true,
      });
    }
    if (item.context) {
      s.addText(item.context, {
        x: x + 0.15, y: 3.85, w: cardW - 0.55, h: 0.5,
        fontSize: 11, fontFace: fonts.body, color: theme.secondary,
      });
    }
  });

  renderSource(s, slide.note, ctx);
}

function renderProcessFlow(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "PROCESS FLOW", slide.title, ctx);
  const steps = slide.steps || [];
  const count = Math.max(steps.length, 1);
  const colW = 8.9 / count;

  steps.slice(0, 4).forEach((step, i) => {
    const x = 0.55 + i * colW;
    s.addText(String(i + 1).padStart(2, "0"), {
      x, y: 1.85, w: 0.8, h: 0.6,
      fontSize: 34, fontFace: fonts.header, color: theme.accent, bold: true,
    });
    if (i < steps.length - 1) {
      s.addText("→", {
        x: x + colW - 0.45, y: 1.95, w: 0.4, h: 0.4,
        fontSize: 18, fontFace: fonts.header, color: theme.accent,
      });
    }
    s.addShape(pres.shapes.LINE, { x, y: 2.6, w: colW - 0.3, h: 0, line: { color: theme.secondary, width: 0.5 } });
    s.addText(step.title, {
      x, y: 2.8, w: colW - 0.3, h: 0.5,
      fontSize: 18, fontFace: fonts.header, color: theme.primary, bold: true,
    });
    s.addText(step.body, {
      x, y: 3.4, w: colW - 0.3, h: 1.2,
      fontSize: 13, fontFace: fonts.body, color: theme.secondary,
    });
  });

  renderSource(s, slide.note, ctx);
}

function renderFunnel(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "CONVERSION FUNNEL", slide.title, ctx);
  const stages = slide.stages || [];
  const baseVal = stages[0]?.value || 1;

  stages.slice(0, 5).forEach((stage, i) => {
    const y = 1.9 + i * 0.55;
    const barW = Math.max((stage.value / baseVal) * 4.6, 0);
    s.addText(stage.label, {
      x: 0.55, y, w: 2.2, h: 0.35,
      fontSize: 14, fontFace: fonts.body, color: theme.primary, bold: true,
    });
    if (barW > 0) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 3.0 + (4.6 - barW) / 2, y, w: barW, h: 0.35,
        fill: { color: theme.accent },
      });
    }
    s.addText(stage.value.toLocaleString("en-US"), {
      x: 7.8, y, w: 1.6, h: 0.35,
      fontSize: 14, fontFace: fonts.body, color: theme.primary, bold: true, align: "right",
    });
  });

  renderSource(s, slide.note, ctx);
}

function renderGantt(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "DELIVERY SCHEDULE", slide.title, ctx);
  const periods = slide.periods || [];
  const tasks = slide.tasks || [];
  const pCount = Math.max(periods.length, 1);
  const colW = 6.2 / pCount;

  periods.forEach((p, i) => {
    s.addText(p, {
      x: 3.25 + i * colW, y: 1.85, w: colW, h: 0.3,
      fontSize: 11, fontFace: fonts.body, color: theme.secondary, align: "center",
    });
  });

  tasks.slice(0, 5).forEach((task, i) => {
    const y = 2.3 + i * 0.45;
    s.addText(task.label, {
      x: 0.55, y, w: 2.5, h: 0.3,
      fontSize: 13, fontFace: fonts.body, color: theme.primary, bold: true,
    });
    s.addShape(pres.shapes.LINE, { x: 3.25, y: y + 0.35, w: 6.2, h: 0, line: { color: theme.secondary, width: 0.3 } });
    const barW = Math.max((task.end - task.start + 1) * colW - 0.08, 0.2);
    s.addShape(pres.shapes.RECTANGLE, {
      x: 3.25 + task.start * colW, y: y + 0.04, w: barW, h: 0.24,
      fill: { color: theme.accent },
    });
  });

  renderSource(s, slide.note, ctx);
}

function renderComparison(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "COMPARISON", slide.title, ctx);
  const cols = slide.columns || ["方案 A", "方案 B"];
  const rows = slide.rows || [];

  s.addShape(pres.shapes.RECTANGLE, { x: 3.4, y: 1.8, w: 6.0, h: 0.45, fill: { color: theme.primary } });
  cols.forEach((c, i) => {
    s.addText(c, {
      x: 3.5 + i * 3.0, y: 1.85, w: 2.8, h: 0.35,
      fontSize: 14, fontFace: fonts.header, color: "FFFFFF", bold: true,
    });
  });

  rows.slice(0, 4).forEach((row, i) => {
    const y = 2.45 + i * 0.5;
    s.addText(row.label, {
      x: 0.55, y, w: 2.6, h: 0.35,
      fontSize: 13, fontFace: fonts.body, color: theme.secondary,
    });
    (row.values || []).forEach((val, j) => {
      s.addText(val, {
        x: 3.5 + j * 3.0, y, w: 2.8, h: 0.35,
        fontSize: 14, fontFace: fonts.body, color: theme.primary, bold: j === 1,
      });
    });
    s.addShape(pres.shapes.LINE, { x: 0.55, y: y + 0.42, w: 8.9, h: 0, line: { color: theme.secondary, width: 0.3 } });
  });

  if (slide.verdict) {
    s.addText(slide.verdict, {
      x: 0.55, y: 4.65, w: 8.9, h: 0.3,
      fontSize: 13, fontFace: fonts.body, color: theme.accent, bold: true,
    });
  }
}

function renderSwot(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "SWOT ANALYSIS", slide.title, ctx);
  const groups = [
    { title: "S / 优势 (Strengths)", items: slide.strengths || [] },
    { title: "W / 劣势 (Weaknesses)", items: slide.weaknesses || [] },
    { title: "O / 机会 (Opportunities)", items: slide.opportunities || [] },
    { title: "T / 威胁 (Threats)", items: slide.threats || [] },
  ];

  groups.forEach((g, i) => {
    const x = 0.55 + (i % 2) * 4.6;
    const y = 1.85 + Math.floor(i / 2) * 1.45;
    s.addText(g.title, {
      x, y, w: 4.2, h: 0.35,
      fontSize: 16, fontFace: fonts.header, color: theme.accent, bold: true,
    });
    s.addShape(pres.shapes.LINE, { x, y: y + 0.4, w: 4.2, h: 0, line: { color: theme.secondary, width: 0.4 } });
    const content = g.items.map((t) => `• ${t}`).join("\n");
    s.addText(content, {
      x, y: y + 0.5, w: 4.2, h: 0.75,
      fontSize: 13, fontFace: fonts.body, color: theme.primary,
    });
  });
}

function renderQuadrant(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "PRIORITY MATRIX", slide.title, ctx);
  const x0 = 1.4, y0 = 2.0, w = 4.6, h = 2.4;

  s.addShape(pres.shapes.LINE, { x: x0, y: y0 + h, w, h: 0, line: { color: theme.primary, width: 1.5 } });
  s.addShape(pres.shapes.LINE, { x: x0, y: y0, w: 0, h, line: { color: theme.primary, width: 1.5 } });
  s.addShape(pres.shapes.LINE, { x: x0, y: y0 + h / 2, w, h: 0, line: { color: theme.secondary, width: 0.5 } });
  s.addShape(pres.shapes.LINE, { x: x0 + w / 2, y: y0, w: 0, h, line: { color: theme.secondary, width: 0.5 } });

  s.addText(slide.yLabel || "价值", { x: 0.55, y: 1.7, w: 3.5, h: 0.25, fontSize: 11, fontFace: fonts.body, color: theme.secondary });
  s.addText(slide.xLabel || "可行性", { x: 2.5, y: 4.5, w: 3.5, h: 0.25, fontSize: 11, fontFace: fonts.body, color: theme.secondary, align: "right" });

  const points = slide.points || [];
  points.slice(0, 5).forEach((p, i) => {
    const cx = x0 + 0.2 + p.x * (w - 0.4);
    const cy = y0 + 0.2 + (1 - p.y) * (h - 0.4);
    s.addShape(pres.shapes.OVAL, { x: cx - 0.12, y: cy - 0.12, w: 0.24, h: 0.24, fill: { color: theme.accent } });
    s.addText(String(i + 1), {
      x: cx - 0.12, y: cy - 0.12, w: 0.24, h: 0.24,
      fontSize: 8, fontFace: fonts.header, color: "FFFFFF", bold: true, align: "center", valign: "middle",
    });
    s.addText(`${i + 1}. ${p.label}`, {
      x: 6.4, y: 2.0 + i * 0.48, w: 3.0, h: 0.35,
      fontSize: 13, fontFace: fonts.body, color: theme.primary,
    });
  });

  renderSource(s, slide.note, ctx);
}

function renderTeam(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "TEAM", slide.title, ctx);
  const people = slide.people || [];
  const colW = 8.9 / Math.max(people.length, 1);

  people.slice(0, 3).forEach((p, i) => {
    const x = 0.55 + i * colW;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.9, w: 1.0, h: 1.0, fill: { color: theme.primary } });
    s.addText(p.initials || p.name.slice(0, 2), {
      x, y: 1.9, w: 1.0, h: 1.0,
      fontSize: 18, fontFace: fonts.header, color: "FFFFFF", bold: true, align: "center", valign: "middle",
    });
    s.addText(p.name, {
      x, y: 3.1, w: colW - 0.3, h: 0.4,
      fontSize: 20, fontFace: fonts.header, color: theme.primary, bold: true,
    });
    s.addText(p.role, {
      x, y: 3.55, w: colW - 0.3, h: 0.3,
      fontSize: 13, fontFace: fonts.body, color: theme.accent, bold: true,
    });
    s.addText(p.bio, {
      x, y: 3.95, w: colW - 0.3, h: 0.7,
      fontSize: 11, fontFace: fonts.body, color: theme.secondary,
    });
  });
}

function renderPricing(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "PRICING PLANS", slide.title, ctx);
  const plans = slide.plans || [];
  const colW = 8.9 / Math.max(plans.length, 1);

  plans.slice(0, 3).forEach((p, i) => {
    const x = 0.55 + i * colW;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.85, w: colW - 0.3, h: 2.8,
      fill: { color: "FFFFFF" }, line: { color: p.recommended ? theme.accent : theme.secondary, width: p.recommended ? 1.5 : 0.5 },
    });
    if (p.recommended) {
      s.addText("RECOMMENDED", {
        x: x + 0.15, y: 1.95, w: colW - 0.6, h: 0.2,
        fontSize: 9, fontFace: fonts.body, color: theme.accent, bold: true,
      });
    }
    s.addText(p.name, {
      x: x + 0.15, y: 2.2, w: colW - 0.6, h: 0.4,
      fontSize: 20, fontFace: fonts.header, color: theme.primary, bold: true,
    });
    s.addText(p.price, {
      x: x + 0.15, y: 2.7, w: colW - 0.6, h: 0.5,
      fontSize: 26, fontFace: fonts.header, color: theme.accent, bold: true,
    });
    s.addShape(pres.shapes.LINE, { x: x + 0.15, y: 3.3, w: colW - 0.6, h: 0, line: { color: theme.secondary, width: 0.3 } });
    const feats = (p.features || []).map((f) => `• ${f}`).join("\n");
    s.addText(feats, {
      x: x + 0.15, y: 3.45, w: colW - 0.6, h: 1.0,
      fontSize: 11, fontFace: fonts.body, color: theme.primary,
    });
  });

  renderSource(s, slide.note, ctx);
}

function renderTestimonial(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "TESTIMONIAL", slide.title, ctx);
  s.addText("“", {
    x: 0.55, y: 1.85, w: 0.8, h: 0.8,
    fontSize: 54, fontFace: fonts.header, color: theme.accent, bold: true,
  });
  s.addText(slide.quote || "", {
    x: 1.6, y: 2.0, w: 7.6, h: 1.6,
    fontSize: 24, fontFace: fonts.header, color: theme.primary, bold: true,
  });
  s.addText(slide.author || "", {
    x: 1.6, y: 3.8, w: 7.6, h: 0.35,
    fontSize: 16, fontFace: fonts.body, color: theme.accent, bold: true,
  });
  s.addText(slide.role || "", {
    x: 1.6, y: 4.2, w: 7.6, h: 0.3,
    fontSize: 12, fontFace: fonts.body, color: theme.secondary,
  });
  renderSource(s, slide.source, ctx);
}

function renderContent(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  const m = style.pageMargin;
  renderHeader(pres, s, "INSIGHT", slide.title, ctx);

  let currentY = 1.85;
  if (slide.lead) {
    s.addText(slide.lead, {
      x: m, y: currentY, w: 10 - 2 * m, h: 0.5,
      fontSize: 20, fontFace: fonts.header, color: theme.accent, bold: true,
    });
    currentY += 0.65;
  }

  const bullets = slide.bullets || [];
  if (bullets.length > 0) {
    const bodyH = 4.8 - currentY;
    const n = Math.max(bullets.length, 1);
    bullets.slice(0, 5).forEach((b, i) => {
      s.addText(b, {
        x: m, y: currentY + (i * bodyH) / n, w: 10 - 2 * m, h: bodyH / n,
        fontSize: 15, fontFace: fonts.body, color: theme.primary,
        align: "left", valign: "top", bullet: true,
      });
    });
  } else if (slide.body) {
    s.addText(slide.body, {
      x: m, y: currentY, w: 10 - 2 * m, h: 2.4,
      fontSize: 15, fontFace: fonts.body, color: theme.primary,
    });
  }

  renderSource(s, slide.source || slide.note, ctx);
}

function renderMilestoneTimeline(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "MILESTONES & ROADMAP", slide.title, ctx);

  const milestones = slide.milestones || [];
  if (milestones.length === 0) {
    renderContent(pres, s, slide, ctx);
    return;
  }

  const w = 8.9 / milestones.length;
  s.addShape(pres.shapes.LINE, { x: 0.55, y: 2.7, w: 8.9, h: 0, line: { color: theme.secondary, width: 1 } });

  milestones.forEach((m, i) => {
    const x = 0.55 + i * w;
    s.addText(m.date, {
      x, y: 1.9, w: w - 0.25, h: 0.35,
      fontSize: 13, fontFace: fonts.header, color: theme.accent, bold: true,
    });

    const fillColor = m.status === "done" ? theme.accent : (m.status === "doing" ? theme.light : theme.bg);
    const borderColor = m.status === "done" ? theme.accent : theme.secondary;

    s.addShape(pres.shapes.OVAL, {
      x: x + 0.05, y: 2.58, w: 0.24, h: 0.24,
      fill: { color: fillColor }, line: { color: borderColor, width: 1.5 },
    });

    s.addText(m.title, {
      x, y: 3.1, w: w - 0.25, h: 0.5,
      fontSize: 16, fontFace: fonts.header, color: theme.primary, bold: true,
    });

    if (m.body) {
      s.addText(m.body, {
        x, y: 3.65, w: w - 0.25, h: 1.0,
        fontSize: 12, fontFace: fonts.body, color: theme.secondary,
      });
    }
  });

  renderSource(s, slide.note || slide.source, ctx);
}

function renderFeatureGrid(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "CORE CAPABILITIES", slide.title, ctx);

  const features = slide.features || [];
  if (features.length === 0) {
    renderContent(pres, s, slide, ctx);
    return;
  }

  const cols = features.length <= 4 ? 2 : 3;
  const rows = Math.ceil(features.length / cols);
  const w = 8.9 / cols;
  const h = 2.8 / rows;

  features.forEach((f, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 0.55 + col * w;
    const y = 1.88 + row * (h + 0.15);

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: w - 0.25, h,
      fill: { color: theme.bg }, line: { color: theme.secondary, width: 0.8 }, rectRadius: 0.05,
    });
    s.addShape(pres.shapes.LINE, {
      x, y, w: w - 0.25, h: 0,
      line: { color: theme.accent, width: 2.5 },
    });

    const badge = f.badge || String(i + 1).padStart(2, "0");
    s.addText(badge, {
      x: x + 0.15, y: y + 0.15, w: w - 0.55, h: 0.25,
      fontSize: 11, fontFace: fonts.header, color: theme.accent, bold: true,
    });
    s.addText(f.title, {
      x: x + 0.15, y: y + 0.45, w: w - 0.55, h: 0.4,
      fontSize: 15, fontFace: fonts.header, color: theme.primary, bold: true,
    });
    s.addText(f.desc || f.body || "", {
      x: x + 0.15, y: y + 0.9, w: w - 0.55, h: Math.max(0.3, h - 1.0),
      fontSize: 12, fontFace: fonts.body, color: theme.secondary,
    });
  });

  renderSource(s, slide.note || slide.source, ctx);
}

function renderStatCallout(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "IMPACT SIGNAL", slide.title, ctx);

  // 左侧深色大数字卡片
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.55, y: 1.88, w: 3.6, h: 2.7,
    fill: { color: theme.primary }, rectRadius: 0.08,
  });
  s.addText(slide.stat || "", {
    x: 0.8, y: 2.15, w: 3.1, h: 1.1,
    fontSize: 52, fontFace: fonts.header, color: theme.light, bold: true,
  });
  s.addText(slide.bullets?.[0] || slide.takeaway || "", {
    x: 0.8, y: 3.4, w: 3.1, h: 0.9,
    fontSize: 14, fontFace: fonts.body, color: "FFFFFF", bold: true,
  });

  // 右侧核心结论与细节
  s.addText(slide.takeaway || slide.lead || "", {
    x: 4.55, y: 1.9, w: 4.9, h: 0.8,
    fontSize: 22, fontFace: fonts.header, color: theme.primary, bold: true,
  });
  s.addShape(pres.shapes.LINE, {
    x: 4.55, y: 2.85, w: 4.9, h: 0,
    line: { color: theme.secondary, width: 0.5 },
  });

  const details = slide.details || slide.bullets?.slice(1) || [];
  if (details.length > 0) {
    s.addText(details.map((d) => "• " + d).join("\n\n"), {
      x: 4.55, y: 3.05, w: 4.9, h: 1.5,
      fontSize: 13, fontFace: fonts.body, color: theme.secondary,
    });
  }

  renderSource(s, slide.note || slide.source, ctx);
}

function renderArchitectureStack(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  renderHeader(pres, s, "SYSTEM ARCHITECTURE", slide.title, ctx);

  const layers = slide.layers || [];
  if (layers.length === 0) {
    renderContent(pres, s, slide, ctx);
    return;
  }

  const h = 2.8 / layers.length;
  layers.forEach((l, i) => {
    const y = 1.88 + i * (h + 0.08);

    // 左侧层级标题 (深色卡片)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.55, y, w: 2.2, h,
      fill: { color: theme.primary }, rectRadius: 0.04,
    });
    s.addText(l.name, {
      x: 0.7, y: y + h * 0.25, w: 1.9, h: h * 0.5,
      fontSize: 14, fontFace: fonts.header, color: "FFFFFF", bold: true,
    });

    // 右侧子组件背景容器
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 2.85, y, w: 6.6, h,
      fill: { color: theme.bg }, line: { color: theme.secondary, width: 0.8 }, rectRadius: 0.04,
    });

    const items = l.items || [];
    const itemW = 6.4 / Math.max(items.length, 1);
    items.forEach((it, j) => {
      const ix = 2.95 + j * itemW;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: ix, y: y + 0.1, w: itemW - 0.12, h: h - 0.2,
        fill: { color: theme.light }, rectRadius: 0.04,
      });
      s.addText(it, {
        x: ix + 0.05, y: y + 0.15, w: itemW - 0.22, h: h - 0.3,
        fontSize: 11, fontFace: fonts.body, color: theme.primary, bold: true,
        align: "center", valign: "middle",
      });
    });
  });

  renderSource(s, slide.note || slide.source, ctx);
}

function renderMarketSize(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  renderHeader(pres, s, "MARKET OPPORTUNITY", slide.title, ctx);
  const tiers = slide.tiers || [
    { name: "TAM 全球潜在市场", value: "$45B", desc: "总潜在市场空间" },
    { name: "SAM 可服务市场", value: "$12B", desc: "可服务核心市场份额" },
    { name: "SOM 目标可渗透市场", value: "$2.5B", desc: "前三年可直接渗透份额" },
  ];
  const w = 8.9 / tiers.length;
  tiers.forEach((tier, i) => {
    const x = 0.55 + i * w;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.88, w: w - 0.25, h: 2.7,
      fill: { color: i === 0 ? theme.bg : "FFFFFF" },
      line: { color: i === 0 ? theme.accent : theme.secondary, width: 1 },
      rectRadius: style.radiusMd,
    });
    s.addText(tier.name, {
      x: x + 0.15, y: 2.05, w: w - 0.55, h: 0.35,
      fontSize: 15, fontFace: fonts.header, color: theme.secondary, bold: true,
    });
    s.addText(tier.value, {
      x: x + 0.15, y: 2.5, w: w - 0.55, h: 0.8,
      fontSize: 32, fontFace: fonts.header, color: theme.accent, bold: true,
    });
    s.addText(tier.desc || tier.body || "", {
      x: x + 0.15, y: 3.4, w: w - 0.55, h: 1.0,
      fontSize: 12, fontFace: fonts.body, color: theme.primary,
    });
  });
  renderSource(s, slide.note || slide.source, ctx);
}

function renderFaq(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  renderHeader(pres, s, "FREQUENTLY ASKED QUESTIONS", slide.title, ctx);
  const qs = slide.questions || [];
  const h = 2.6 / Math.max(qs.length, 1);
  qs.forEach((q, i) => {
    const y = 1.88 + i * (h + 0.08);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.55, y, w: 8.9, h,
      fill: { color: "FFFFFF" },
      line: { color: theme.secondary, width: 0.5 },
      rectRadius: style.radiusSm,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.55, y, w: 0.08, h,
      fill: { color: theme.accent },
    });
    s.addText(`Q: ${q.question}`, {
      x: 0.75, y: y + 0.08, w: 8.5, h: 0.3,
      fontSize: 14, fontFace: fonts.header, color: theme.primary, bold: true,
    });
    s.addText(`A: ${q.answer}`, {
      x: 0.75, y: y + 0.38, w: 8.5, h: h - 0.44,
      fontSize: 12, fontFace: fonts.body, color: theme.secondary,
    });
  });
  renderSource(s, slide.note || slide.source, ctx);
}

function renderClosing(pres: AnyPptx, s: AnyPptx, slide: SlidePlan, ctx: RenderCtx): void {
  const { theme, fonts } = ctx;
  s.background = { color: theme.primary };
  s.addText(slide.title || "Thank You", {
    x: 0.8, y: 1.2, w: 8.4, h: 1.5,
    fontSize: 44, fontFace: fonts.header, color: "FFFFFF", bold: true,
  });
  s.addText(slide.action || slide.bullets?.[0] || "下一步推进与沟通", {
    x: 0.8, y: 3.2, w: 8.4, h: 0.8,
    fontSize: 20, fontFace: fonts.body, color: theme.light,
  });
  if (slide.contact) {
    s.addText(slide.contact, {
      x: 0.8, y: 4.4, w: 8.4, h: 0.35,
      fontSize: 12, fontFace: fonts.body, color: theme.accent,
    });
  }
}

function addBadge(pres: AnyPptx, s: AnyPptx, pageNum: number, ctx: RenderCtx): void {
  const { theme, fonts, style } = ctx;
  if (style.badge === "pill") {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 9.1, y: 5.15, w: 0.6, h: 0.35,
      fill: { color: theme.accent }, rectRadius: 0.15,
    });
    s.addText(String(pageNum).padStart(2, "0"), {
      x: 9.1, y: 5.15, w: 0.6, h: 0.35,
      fontSize: 11, fontFace: fonts.body, color: "FFFFFF",
      bold: true, align: "center", valign: "middle",
    });
  } else {
    s.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
    s.addText(String(pageNum), {
      x: 9.3, y: 5.1, w: 0.4, h: 0.4,
      fontSize: 12, fontFace: fonts.body, color: "FFFFFF",
      bold: true, align: "center", valign: "middle",
    });
  }
}
