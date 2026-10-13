"use client";

import type { DeckPlan, SlidePlan } from "@/lib/types";

interface Props {
  plan: DeckPlan | null;
  isLoading: boolean;
  error: string;
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  cover: { label: "封面", color: "text-amber-400" },
  toc: { label: "目录", color: "text-blue-400" },
  agenda: { label: "议程", color: "text-blue-400" },
  section: { label: "章节", color: "text-indigo-400" },
  executiveSummary: { label: "执行摘要", color: "text-emerald-400" },
  kpiDashboard: { label: "KPI指标", color: "text-emerald-400" },
  processFlow: { label: "实施流程", color: "text-cyan-400" },
  funnel: { label: "转化漏斗", color: "text-rose-400" },
  gantt: { label: "甘特计划", color: "text-purple-400" },
  comparison: { label: "方案对比", color: "text-orange-400" },
  swot: { label: "SWOT分析", color: "text-amber-400" },
  quadrant: { label: "优先级矩阵", color: "text-sky-400" },
  team: { label: "团队阵容", color: "text-teal-400" },
  pricing: { label: "方案报价", color: "text-emerald-400" },
  testimonial: { label: "客户证言", color: "text-violet-400" },
  metrics: { label: "指标图表", color: "text-cyan-400" },
  caseStudy: { label: "客户案例", color: "text-blue-400" },
  scope: { label: "交付范围", color: "text-indigo-400" },
  content: { label: "核心要点", color: "text-zinc-400" },
  summary: { label: "总结", color: "text-amber-400" },
  closing: { label: "收尾行动", color: "text-amber-400" },
};

function renderSlideDetails(s: SlidePlan) {
  if (s.decision) {
    return <div className="mt-1 text-xs text-emerald-300 font-medium truncate">决策: {s.decision}</div>;
  }
  if (s.items && Array.isArray(s.items)) {
    return (
      <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-zinc-400">
        {s.items.slice(0, 4).map((it: any, j: number) => (
          <span key={j} className="rounded bg-zinc-800/60 px-1.5 py-0.5 border border-zinc-700/40">
            {it.label || it.title || JSON.stringify(it)} {it.value ? `: ${it.value}` : ""}
          </span>
        ))}
      </div>
    );
  }
  if (s.steps && Array.isArray(s.steps)) {
    return (
      <div className="mt-1 text-xs text-zinc-400 truncate">
        流程: {s.steps.map((st) => st.title).join(" → ")}
      </div>
    );
  }
  if (s.stages && Array.isArray(s.stages)) {
    return (
      <div className="mt-1 text-xs text-zinc-400 truncate">
        阶段: {s.stages.map((st) => `${st.label}(${st.value})`).join(" → ")}
      </div>
    );
  }
  if (s.tasks && Array.isArray(s.tasks)) {
    return (
      <div className="mt-1 text-xs text-zinc-400 truncate">
        任务: {s.tasks.map((t) => t.label).join(", ")}
      </div>
    );
  }
  if (s.columns && s.rows) {
    return (
      <div className="mt-1 text-xs text-zinc-400 truncate">
        对比: {s.columns.join(" vs ")} ({s.rows.length} 维度)
      </div>
    );
  }
  if (s.bullets && s.bullets.length > 0) {
    return (
      <ul className="mt-1 flex flex-col gap-0.5 text-xs text-zinc-400">
        {s.bullets.slice(0, 3).map((b, j) => (
          <li key={j} className="truncate">
            · {b}
          </li>
        ))}
      </ul>
    );
  }
  if (s.action) {
    return <div className="mt-1 text-xs text-amber-300 truncate">行动: {s.action}</div>;
  }
  return null;
}

export default function PreviewPanel({ plan, isLoading, error }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="mono-label">DECK PLAN / 大纲预览</span>
        {plan && (
          <span className="mono-label text-ink-dim">
            {plan.slides.length} slides
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-line bg-elev p-4">
        {isLoading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-ink-mute">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-gold" />
            <span className="mono-label">GENERATING…</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {!isLoading && !error && !plan && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-ink-mute">
            <div className="mono-label">EMPTY</div>
            <p className="max-w-xs text-sm">
              填写左侧配置,点击生成。大纲与最终 .pptx 将在此预览。
            </p>
          </div>
        )}

        {!isLoading && !error && plan && (
          <ol className="flex flex-col gap-2">
            {plan.slides.map((s, i) => {
              const meta = TYPE_META[s.type] ?? TYPE_META.content;
              return (
                <li
                  key={i}
                  className="rounded-md border border-line bg-canvas/40 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="mono-label w-6">{String(i + 1).padStart(2, "0")}</span>
                    <span className={`mono-label ${meta.color}`}>{meta.label}</span>
                    {s.layout && (
                      <span className="mono-label text-ink-mute">· {s.layout}</span>
                    )}
                    <span className="ml-auto truncate text-sm font-medium text-ink">
                      {s.title || "—"}
                    </span>
                  </div>
                  <div className="ml-8">{renderSlideDetails(s)}</div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
