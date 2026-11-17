"use client";

import type { DeckPlan, SlidePlan, SlideType, Theme } from "@/lib/types";
import { IconAlert, IconFileText, IconArrowRight } from "./icons";

interface Props {
  plan: DeckPlan | null;
  isLoading: boolean;
  error: string;
  /** Active slide theme — thumbnails render with the real selected palette. */
  theme?: Theme;
  onLoadSample?: () => void;
}

// Exhaustive over SlideType: adding a new page type without a preview label
// fails type-checking. Hues stay readable on paper and are always paired with
// a text label (never color-only meaning).
const TYPE_META: Record<SlideType, { label: string; color: string }> = {
  cover: { label: "封面", color: "var(--verm)" },
  toc: { label: "目录", color: "var(--teal)" },
  agenda: { label: "议程", color: "var(--teal)" },
  section: { label: "章节", color: "var(--plum)" },
  executiveSummary: { label: "执行摘要", color: "var(--success)" },
  kpiDashboard: { label: "KPI 指标", color: "var(--success)" },
  processFlow: { label: "实施流程", color: "var(--teal)" },
  funnel: { label: "转化漏斗", color: "var(--verm)" },
  gantt: { label: "甘特计划", color: "var(--plum)" },
  comparison: { label: "方案对比", color: "var(--warning)" },
  swot: { label: "SWOT 分析", color: "var(--warning)" },
  quadrant: { label: "优先级矩阵", color: "var(--ultra)" },
  team: { label: "团队阵容", color: "var(--teal)" },
  pricing: { label: "方案报价", color: "var(--success)" },
  testimonial: { label: "客户证言", color: "var(--plum)" },
  metrics: { label: "指标图表", color: "var(--teal)" },
  caseStudy: { label: "客户案例", color: "var(--ultra)" },
  scope: { label: "交付范围", color: "var(--plum)" },
  milestoneTimeline: { label: "里程碑", color: "var(--plum)" },
  featureGrid: { label: "特性栅格", color: "var(--ultra)" },
  statCallout: { label: "指标信号", color: "var(--verm)" },
  architectureStack: { label: "架构堆叠", color: "var(--ultra)" },
  marketSize: { label: "市场规模", color: "var(--teal)" },
  faq: { label: "常见问题", color: "var(--warning)" },
  content: { label: "核心要点", color: "var(--ink-mute)" },
  summary: { label: "总结", color: "var(--verm)" },
  closing: { label: "收尾行动", color: "var(--verm)" },
};

/**
 * A 16:9 proof thumbnail drawn from the actual slide theme, so palette and
 * style changes are visible immediately. Abstract layout hints per type
 * family — not a full renderer, just enough to recognize the page shape.
 */
function SlideThumb({ slide, theme }: { slide: SlidePlan; theme: Theme }) {
  const c = (hex: string) => `#${hex}`;
  const bar = (color: string, w: string, h = 3) => (
    <div style={{ background: c(color), width: w, height: h, borderRadius: 1 }} />
  );
  const t = slide.type;

  let body: React.ReactNode;
  if (t === "cover" || t === "closing" || t === "section") {
    body = (
      <div className="flex h-full flex-col items-center justify-center gap-[3px] px-2">
        {bar(theme.accent, "26%", 2)}
        {bar(theme.primary, "72%", 4)}
        {bar(theme.secondary, "46%", 2)}
      </div>
    );
  } else if (t === "kpiDashboard" || t === "featureGrid" || t === "pricing" || t === "team") {
    body = (
      <div className="flex h-full flex-col justify-center gap-[3px] px-1.5">
        {bar(theme.primary, "52%", 3)}
        <div className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 rounded-[2px] py-[5px]" style={{ background: c(theme.light), border: `0.5px solid ${c(theme.secondary)}33` }}>
              <div className="mx-auto" style={{ width: "60%" }}>{bar(i === 0 ? theme.accent : theme.primary, "100%", 2)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (t === "processFlow" || t === "milestoneTimeline" || t === "gantt") {
    body = (
      <div className="flex h-full flex-col justify-center gap-[4px] px-1.5">
        {bar(theme.primary, "48%", 3)}
        <div className="flex items-center gap-[2px]">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-1 items-center gap-[2px]">
              <div className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: c(i === 0 ? theme.accent : theme.secondary) }} />
              <div className="h-[2px] flex-1" style={{ background: c(theme.secondary), opacity: 0.55 }} />
            </div>
          ))}
        </div>
        {bar(theme.secondary, "70%", 2)}
      </div>
    );
  } else if (t === "comparison" || t === "swot" || t === "quadrant") {
    body = (
      <div className="flex h-full flex-col justify-center gap-[3px] px-1.5">
        {bar(theme.primary, "44%", 3)}
        <div className="flex gap-[3px]">
          <div className="flex-1 rounded-[2px] py-[6px]" style={{ background: c(theme.light) }}>
            <div className="mx-auto w-3/4">{bar(theme.primary, "100%", 2)}</div>
          </div>
          <div className="flex-1 rounded-[2px] py-[6px]" style={{ background: c(theme.accent), opacity: 0.85 }}>
            <div className="mx-auto w-3/4">{bar(theme.bg, "100%", 2)}</div>
          </div>
        </div>
      </div>
    );
  } else if (t === "funnel" || t === "marketSize") {
    body = (
      <div className="flex h-full flex-col items-center justify-center gap-[2px]">
        {bar(theme.primary, "40%", 3)}
        {bar(theme.accent, "62%", 4)}
        {bar(theme.secondary, "44%", 4)}
        {bar(theme.secondary, "28%", 4)}
      </div>
    );
  } else if (t === "statCallout" || t === "metrics") {
    body = (
      <div className="flex h-full items-center gap-1.5 px-1.5">
        <div style={{ background: c(theme.accent), width: "34%", height: 14, borderRadius: 2 }} />
        <div className="flex flex-1 flex-col gap-[3px]">
          {bar(theme.primary, "88%", 3)}
          {bar(theme.secondary, "64%", 2)}
          {bar(theme.secondary, "72%", 2)}
        </div>
      </div>
    );
  } else if (t === "architectureStack") {
    body = (
      <div className="flex h-full flex-col justify-center gap-[2px] px-2">
        {[theme.primary, theme.accent, theme.secondary].map((col, i) => (
          <div key={i} className="rounded-[2px] py-[3px]" style={{ background: c(col), opacity: i === 2 ? 0.6 : 0.9 }}>
            <div className="mx-auto w-1/2">{bar(theme.bg, "100%", 1.5)}</div>
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <div className="flex h-full flex-col justify-center gap-[3px] px-1.5">
        {bar(theme.primary, "56%", 3)}
        {bar(theme.secondary, "86%", 2)}
        {bar(theme.secondary, "74%", 2)}
        {bar(theme.accent, "30%", 2)}
      </div>
    );
  }

  return (
    <div
      className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md border border-line shadow-xs"
      style={{ background: c(theme.bg) }}
      aria-hidden="true"
    >
      {body}
      <div className="absolute bottom-[3px] right-[4px] h-[4px] w-[4px] rounded-full" style={{ background: c(theme.accent) }} />
    </div>
  );
}

function renderSlideDetails(s: SlidePlan) {
  if (s.decision) {
    return <div className="mt-1 truncate text-xs font-medium text-success">决策: {s.decision}</div>;
  }
  if (s.items && Array.isArray(s.items)) {
    return (
      <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-ink-dim">
        {s.items.slice(0, 4).map((it: { label?: string; title?: string; value?: string | number }, j: number) => (
          <span key={j} className="rounded-md border border-line bg-base px-1.5 py-0.5">
            {it.label || it.title || JSON.stringify(it)} {it.value ? `· ${it.value}` : ""}
          </span>
        ))}
      </div>
    );
  }
  if (s.steps && Array.isArray(s.steps)) {
    return <div className="mt-1 truncate text-xs text-ink-mute">流程: {s.steps.map((st) => st.title).join(" → ")}</div>;
  }
  if (s.stages && Array.isArray(s.stages)) {
    return <div className="mt-1 truncate text-xs text-ink-mute">阶段: {s.stages.map((st) => `${st.label}(${st.value})`).join(" → ")}</div>;
  }
  if (s.tasks && Array.isArray(s.tasks)) {
    return <div className="mt-1 truncate text-xs text-ink-mute">任务: {s.tasks.map((t) => t.label).join(", ")}</div>;
  }
  if (s.columns && s.rows) {
    return <div className="mt-1 truncate text-xs text-ink-mute">对比: {s.columns.join(" vs ")}（{s.rows.length} 维度）</div>;
  }
  if (s.milestones && Array.isArray(s.milestones)) {
    return <div className="mt-1 truncate text-xs text-ink-mute">里程碑: {s.milestones.map((m) => `${m.date} ${m.title}`).join(" → ")}</div>;
  }
  if (s.features && Array.isArray(s.features)) {
    return <div className="mt-1 truncate text-xs text-ink-mute">特性: {s.features.map((f) => f.title).join(", ")}</div>;
  }
  if (s.stat) {
    return (
      <div className="mt-1 truncate text-xs text-ink-dim">
        指标: <span className="font-display text-sm font-bold text-verm">{s.stat}</span> {s.takeaway ? `— ${s.takeaway}` : ""}
      </div>
    );
  }
  if (s.layers && Array.isArray(s.layers)) {
    return <div className="mt-1 truncate text-xs text-ink-mute">层级: {s.layers.map((l) => l.name).join(" / ")}</div>;
  }
  if (s.bullets && s.bullets.length > 0) {
    return (
      <ul className="mt-1 flex flex-col gap-0.5 text-xs text-ink-mute">
        {s.bullets.slice(0, 3).map((b, j) => (
          <li key={j} className="truncate">· {b}</li>
        ))}
      </ul>
    );
  }
  if (s.action) {
    return <div className="mt-1 truncate text-xs font-medium text-verm">行动: {s.action}</div>;
  }
  return null;
}

export default function PreviewPanel({ plan, isLoading, error, theme, onLoadSample }: Props) {
  return (
    <div className="card flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="section-no" aria-hidden="true">※</span>
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">大纲预览</h2>
        </div>
        {plan && (
          <span className="text-[11px] text-ink-mute">
            <span className="font-mono">{plan.slides.length}</span> 页 · 缩略图随当前色板实时更新
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-line bg-base p-3">
        {isLoading && (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-ink-mute">
            <span className="spin inline-block h-6 w-6 rounded-full border-2 border-line border-t-gold" aria-hidden="true" />
            <span className="text-xs tracking-wide">正在生成大纲并渲染 PPTX…</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-3 text-xs text-ink">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-danger">
                <IconAlert size={13} />
                生成中断
              </div>
              <div className="leading-relaxed text-ink-dim">{error}</div>
            </div>

            {(error.includes("CORS") || error.includes("无法连接")) && (
              <div className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-xs leading-relaxed text-ink-dim">
                连接失败可能来自网络、端点、代理配置或供应商的跨域策略。代理模式请检查部署日志和允许列表；直连模式需要供应商允许浏览器跨域请求。也可切换至自定义大纲模式，在浏览器生成 PPTX。
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && !plan && (
          <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="font-display text-3xl italic leading-tight text-ink">先看一份成品。</span>
            <p className="max-w-sm text-xs leading-relaxed text-ink-mute">
              无需 API Key：载入示例大纲即可预览版式与色板，自由编辑后导出真正的可编辑 PPTX。
              也可以在左侧配置模型，从你的主题生成。
            </p>
            {onLoadSample && (
              <button
                type="button"
                onClick={onLoadSample}
                className="press mt-1 inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--ultra-deep)]"
              >
                <IconFileText size={14} />
                载入示例大纲
                <IconArrowRight size={13} />
              </button>
            )}
            <span className="text-[10px] text-ink-mute">示例内容为虚构数据，仅用于演示版式</span>
          </div>
        )}

        {!isLoading && !error && plan && (
          <ol className="flex flex-col gap-2">
            {plan.slides.map((s, i) => {
              const meta = TYPE_META[s.type] ?? TYPE_META.content;
              return (
                <li
                  key={i}
                  className="rise flex gap-3 rounded-lg border border-line bg-elev p-2.5 shadow-xs"
                  style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                >
                  {theme && <SlideThumb slide={s} theme={theme} />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs italic text-ink-mute">{String(i + 1).padStart(2, "0")}</span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-ink-dim">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
                        {meta.label}
                      </span>
                      {s.layout && <span className="text-[10px] text-ink-mute">· {s.layout}</span>}
                    </div>
                    <div className="mt-0.5 truncate text-sm font-medium text-ink">{s.title || "—"}</div>
                    {renderSlideDetails(s)}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}