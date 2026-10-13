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
  milestoneTimeline: { label: "里程碑", color: "text-purple-400" },
  featureGrid: { label: "特性栅格", color: "text-blue-400" },
  statCallout: { label: "指标信号", color: "text-amber-400" },
  architectureStack: { label: "架构堆叠", color: "text-indigo-400" },
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
  if (s.milestones && Array.isArray(s.milestones)) {
    return (
      <div className="mt-1 text-xs text-purple-300 truncate">
        里程碑: {s.milestones.map((m) => `${m.date} ${m.title}`).join(" → ")}
      </div>
    );
  }
  if (s.features && Array.isArray(s.features)) {
    return (
      <div className="mt-1 text-xs text-blue-300 truncate">
        特性: {s.features.map((f) => f.title).join(", ")}
      </div>
    );
  }
  if (s.stat) {
    return (
      <div className="mt-1 text-xs text-amber-300 truncate">
        指标: <span className="font-bold">{s.stat}</span> {s.takeaway ? `— ${s.takeaway}` : ""}
      </div>
    );
  }
  if (s.layers && Array.isArray(s.layers)) {
    return (
      <div className="mt-1 text-xs text-indigo-300 truncate">
        层级: {s.layers.map((l) => l.name).join(" / ")}
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
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
              <div className="font-semibold text-red-200 mb-1">❌ 生成中断</div>
              <div>{error}</div>
            </div>

            {(error.includes("CORS") || error.includes("Failed to fetch")) && (
              <div className="rounded-lg border border-amber-500/40 bg-canvas/90 p-4 text-xs text-ink shadow-lg">
                <div className="flex items-center gap-2 mb-2 font-semibold text-amber-300">
                  <span>💡 为什么会出现跨域错误？如何解决？</span>
                </div>
                <p className="text-ink-dim leading-relaxed mb-3">
                  国内大模型服务商（如 ModelBest、阶跃星辰、智谱 GLM、Kimi 等）的官方服务端暂未配置允许浏览器直接调用的 <code className="text-gold font-mono">Access-Control-Allow-Origin: *</code> 跨域头。在纯静态网页（如 GitHub Pages）中通过浏览器直连时，会被浏览器的安全同源策略拦截。
                </p>

                <div className="space-y-2.5 text-ink-dim border-t border-line pt-3">
                  <div className="rounded border border-line bg-elev/60 p-2.5">
                    <div className="font-medium text-azure mb-1">
                      ✅ 方案一（最推荐 · 10秒解决）：安装 Chrome 跨域插件直连
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      在浏览器扩展商店安装并启用
                      <a
                        href="https://chromewebstore.google.com/search/allow%20cors"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-azure underline font-medium mx-1"
                      >
                        「Allow CORS: Access-Control-Allow-Origin」
                      </a>
                      或「CORS Unblock」插件。开启后浏览器将直接畅通请求 ModelBest 等各大平台，API Key 仅留在本地，安全保密。
                    </div>
                  </div>

                  <div className="rounded border border-line bg-elev/60 p-2.5">
                    <div className="font-medium text-emerald-400 mb-1">
                      📄 方案二（免 API · 纯前端直出）：使用「自定义大纲」模式
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      直接在左侧将创作模式切换为「自定义大纲与内容 (JSON)」，无需任何外部模型与网络调用，浏览器即可纯本地秒级渲染高质量商业 PPT 并直接下载！
                    </div>
                  </div>

                  <div className="rounded border border-line bg-elev/60 p-2.5">
                    <div className="font-medium text-amber-400 mb-1">
                      🌐 方案三（自建反代）：使用 Cloudflare Worker 代理
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      配置一个轻量的 Cloudflare Worker 自动追加 CORS 响应头，随后将 Base URL 改为你的 Worker 地址即可。
                    </div>
                  </div>
                </div>
              </div>
            )}
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
