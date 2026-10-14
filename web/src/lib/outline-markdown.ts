import type { DeckPlan } from "./types";

export const OUTLINE_FIELD_LABELS: Record<string, string> = {
  subtitle: "副标题", kicker: "栏目", body: "正文", lead: "导语", bullets: "要点",
  action: "下一步", contact: "联系方式", source: "来源", note: "备注",
  decision: "核心决策", evidence: "依据", nextStep: "下一步", summary: "摘要",
  items: "内容", steps: "步骤", rows: "对比项", columns: "对比列", values: "数据",
  label: "名称", value: "数值", change: "变化", context: "背景", title: "标题",
  stages: "阶段", periods: "时间段", tasks: "任务", start: "开始", end: "结束",
  strengths: "优势", weaknesses: "劣势", opportunities: "机会", threats: "威胁",
  points: "坐标项", xLabel: "横轴", yLabel: "纵轴", people: "团队", name: "名称",
  role: "角色", bio: "介绍", plans: "方案", price: "价格", period: "周期",
  features: "功能", verdict: "结论", milestones: "里程碑", date: "日期",
  status: "状态", desc: "说明", badge: "标记", stat: "关键数据", takeaway: "结论",
  details: "详细内容", layers: "层级", number: "编号",
};

function inline(text: string): string {
  return text.replace(/([\\`*_{}\[\]<>#|])/g, "\\$1");
}

function linesFor(value: unknown, indent = ""): string[] {
  if (value === undefined || value === null || value === "") return [];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).split(/\r?\n/).map(line => `${indent}- ${inline(line)}`);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => typeof item === "object" && item !== null
      ? [`${indent}- ${index + 1}.`, ...linesFor(item, `${indent}  `)] : linesFor(item, indent));
  }
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => {
      const content = linesFor(item, `${indent}  `);
      return content.length ? [`${indent}- **${inline(OUTLINE_FIELD_LABELS[key] || key)}**`, ...content] : [];
    });
  }
  return [];
}

/** Export the exact accepted plan used for PPTX rendering, without a second model call. */
export function deckPlanToMarkdown(plan: DeckPlan): string {
  const sections = [`# ${inline(plan.title).replace(/\r?\n/g, " ")}`];
  plan.slides.forEach((slide, index) => {
    const { title, type, ...content } = slide;
    sections.push(`## ${index + 1}. ${inline(title).replace(/\r?\n/g, " ")}`,
      `版式：${inline(type)}`, linesFor(content).join("\n"));
  });
  return sections.filter(Boolean).join("\n\n") + "\n";
}
