import type { GenerateOptions, DeckPlan, SlidePlan, SlideType } from "./types";

/**
 * Build a strong system+user prompt that injects the complete slide recipes
 * design system (including executive summaries, KPIs, funnels, Gantts, SWOT, comparison)
 * and forces a strict JSON deck plan.
 */
export function buildPrompt(opts: GenerateOptions): { system: string; user: string } {
  const count = clampSlideCount(opts.slideCount);

  const system = [
    "You are a principal presentation architect and consulting partner.",
    "You produce ONLY a JSON deck plan — no prose, no markdown fences, no explanation.",
    "",
    "OUTPUT SCHEMA (strict JSON):",
    '{ "title": string, "slides": [ { "type": string, "title": string, ...typeSpecificFields } ] }',
    "",
    "SUPPORTED SLIDE TYPES:",
    "1. cover: { title, subtitle?, kicker? } — Deck opening.",
    "2. agenda: { title, items: [{ title, body }] } — 2-4 agenda points.",
    "3. section: { title, number, summary? } — Part divider with large number.",
    "4. executiveSummary: { title, decision: string, evidence: string[2..3], nextStep?: string } — Decision & proof.",
    "5. kpiDashboard: { title, items: [{ label, value, change, context }][3..4], note: string } — Key metrics.",
    "6. processFlow: { title, steps: [{ title, body }][3..4], note?: string } — Step-by-step workflow.",
    "7. funnel: { title, stages: [{ label, value: number }][3..5], note: string } — Conversion funnel (values non-increasing).",
    "8. gantt: { title, periods: string[4..8], tasks: [{ label, start: int, end: int }][3..5], note?: string } — Timeline.",
    "9. comparison: { title, columns: [string, string], rows: [{ label, values: [string, string] }][2..4], verdict?: string } — 2-way comparison.",
    "10. swot: { title, strengths: string[1..2], weaknesses: string[1..2], opportunities: string[1..2], threats: string[1..2] } — Strategic SWOT.",
    "11. quadrant: { title, xLabel, yLabel, points: [{ label, x: 0..1, y: 0..1 }][1..5], note: string } — 2x2 priority matrix.",
    "12. team: { title, people: [{ name, role, bio }][2..3], note?: string } — Team profiles.",
    "13. pricing: { title, plans: [{ name, price, period, features: string[2..3], recommended?: bool }][2..3], note: string } — Tiered pricing.",
    "14. content: { title, lead?: string, body?: string, bullets?: string[], source?: string } — Detailed insights/cards.",
    "15. milestoneTimeline: { title, milestones: [{ date: string, title: string, body?: string, status?: 'done'|'doing'|'todo' }][3..5], note?: string } — Project/product roadmap.",
    "16. featureGrid: { title, features: [{ title: string, desc?: string, badge?: string }][4..6], note?: string } — 2x2 or 3x2 capability card grid.",
    "17. statCallout: { title, stat: string, label: string, takeaway: string, details?: string[], note?: string } — Giant statistic with executive takeaway.",
    "18. architectureStack: { title, layers: [{ name: string, items: string[] }][3..4], note?: string } — System or business tiered architecture.",
    "19. closing: { title, action: string, contact?: string } — Call-to-action closing.",
    "",
    "STRUCTURAL REQUIREMENTS:",
    `- Total slides: exactly ${count}.`,
    "- slides[0].type MUST be 'cover'.",
    "- slides[last].type MUST be 'closing'.",
    "- If count >= 6, slide 2 should be 'agenda' or 'executiveSummary'.",
    "- Pick suitable rich business layouts (kpiDashboard, funnel, gantt, processFlow, comparison, swot, quadrant) whenever relevant to the topic instead of boring bullet lists.",
    "- NEVER use generic placeholder text; provide realistic, specific numbers, units, and clear takeaways.",
    "- All text in the requested language; titles must state clear conclusions.",
  ].join("\n");

  const user = [
    `主题 / Topic: ${opts.topic}`,
    `受众 / Audience: ${opts.audience || "业务决策者 / business decision makers"}`,
    `语气 / Tone: ${opts.tone || "专业严谨 / professional and authoritative"}`,
    `语言 / Language: ${opts.language}`,
    `页数 / Slide count: ${count}`,
    `含代码片段 / Include code: ${opts.includeCode ? "yes" : "no"}`,
    `含图表建议 / Include charts: ${opts.includeChart ? "yes" : "no"}`,
    "",
    "Return the JSON deck plan now.",
  ].join("\n");

  return { system, user };
}

export function clampSlideCount(value: number): number {
  if (Number.isNaN(value)) return 8;
  return Math.min(20, Math.max(3, Math.floor(value)));
}

/**
 * Validate + normalize a raw parsed LLM JSON object into a DeckPlan.
 */
export function validatePlan(raw: unknown, count: number): {
  plan: DeckPlan | null;
  error?: string;
} {
  if (!raw || typeof raw !== "object") return { plan: null, error: "LLM did not return a JSON object." };
  const obj = raw as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title : "Untitled";
  const slidesRaw = Array.isArray(obj.slides) ? obj.slides : null;
  if (!slidesRaw) return { plan: null, error: "Missing 'slides' array." };

  const validTypes = new Set([
    "cover", "toc", "section", "content", "summary", "agenda", "closing",
    "executiveSummary", "kpiDashboard", "funnel", "gantt", "processFlow",
    "quadrant", "swot", "team", "pricing", "testimonial", "metrics",
    "comparison", "caseStudy", "scope",
    "milestoneTimeline", "featureGrid", "statCallout", "architectureStack"
  ]);

  const slides: SlidePlan[] = slidesRaw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => {
      const typeStr = typeof s.type === "string" ? s.type : "content";
      const type = (validTypes.has(typeStr) ? typeStr : "content") as SlideType;
      const t = typeof s.title === "string" ? s.title : "";
      const b = Array.isArray(s.bullets)
        ? s.bullets.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
        : [];
      return {
        ...s,
        type,
        title: t,
        bullets: b.length > 0 ? b : undefined,
      } as SlidePlan;
    })
    .filter((s) => s.title || (s.bullets && s.bullets.length > 0) || s.decision);

  if (slides.length === 0) return { plan: null, error: "No usable slides in plan." };

  return { plan: { title, slides } };
}
