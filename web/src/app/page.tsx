"use client";

import { useState, useEffect, useRef } from "react";
import { PALETTES, resolveTheme } from "@/lib/palettes";
import { SLIDE_TYPES } from "@/lib/types";
import ConfigPanel from "@/components/ConfigPanel";
import OutlineEditor from "@/components/OutlineEditor";
import PreviewPanel from "@/components/PreviewPanel";
import DownloadCard from "@/components/DownloadCard";
import { requestLlmPlan, renderDeckPlanToBlob, DEFAULT_REQUEST_MODE, DEFAULT_PROXY_URL } from "@/lib/client-generator";
import { loadPersistedModelConfig, persistModelConfig } from "@/lib/model-config-storage";
import { parseCustomOutlineJson } from "@/lib/prompt";
import { deckPlanToMarkdown } from "@/lib/outline-markdown";
import { SAMPLE_PLAN } from "@/lib/sample-plan";
import { useSpotlight, useMagnetic } from "@/lib/motion";
import AmbientBackground from "@/components/AmbientBackground";
import { IconArrowRight, IconShuffle, IconLock, IconStop, IconFileText } from "@/components/icons";
import type { DeckPlan, FontPairId, ModelConfig, StyleRecipe, InputMode, OccasionId, Theme } from "@/lib/types";

interface Result {
  blobUrl: string;
  fileName: string;
  sizeKb: number;
  plan: DeckPlan;
  outlineUrl: string;
  outlineFileName: string;
}

const EXAMPLES = [
  "企业级数据智能中台建设规划",
  "AI 驱动的年度战略汇报",
  "向高中生解释什么是量子计算",
  "公司季度复盘:关键指标与下一步",
  "Rust 在跨平台 AI 推理中的实践",
];

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  baseUrl: "https://api.modelbest.cn/v1",
  model: "MiniCPM-V-4.7-35B-A3B",
  apiKey: "",
  mode: DEFAULT_REQUEST_MODE,
  proxyUrl: DEFAULT_PROXY_URL,
};

export default function Home() {
  const [occasion, setOccasion] = useState<OccasionId>("01-business-report");
  const [topic, setTopic] = useState(EXAMPLES[0]);
  const [audience, setAudience] = useState("产品团队与管理层");
  const [tone, setTone] = useState("专业、清晰、简洁");
  const [slideCount, setSlideCount] = useState(6);
  const [language, setLanguage] = useState<"zh-CN" | "en-US">("zh-CN");
  const [paletteId, setPaletteId] = useState("consulting-navy");
  const [customTheme, setCustomTheme] = useState<Theme | undefined>(undefined);
  const [fontPair, setFontPair] = useState<FontPairId>("georgia-calibri");
  const [styleRecipe, setStyleRecipe] = useState<StyleRecipe>("soft");
  const [includeCode, setIncludeCode] = useState(false);
  const [includeChart, setIncludeChart] = useState(true);

  // 模型配置三要素 (仅非敏感字段持久化；Key 只留内存)
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG);

  // 自定义大纲模式
  const [inputMode, setInputMode] = useState<InputMode>("topic");
  const [sourceText, setSourceText] = useState("");
  const [customOutlineJson, setCustomOutlineJson] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<DeckPlan | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [currentHost, setCurrentHost] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Mount-only sync from a browser API; no cascading render loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentHost(window.location.hostname);
    }
  }, []);

  useEffect(() => () => {
    if (result) { URL.revokeObjectURL(result.blobUrl); URL.revokeObjectURL(result.outlineUrl); }
  }, [result]);

  // 读取历史配置（仅非敏感字段；API Key 只留在内存，绝不落盘）
  useEffect(() => {
    const saved = loadPersistedModelConfig();
    // Mount-only hydration from localStorage; runs once, no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModelConfig((prev) => ({ ...prev, ...saved }));
  }, []);

  // 更新配置并持久化非敏感字段到本地浏览器
  const updateModelConfig = (cfg: ModelConfig) => {
    setModelConfig(cfg);
    persistModelConfig(cfg);
  };

  type ConfigState = {
    topic: string;
    audience: string;
    tone: string;
    slideCount: number;
    language: "zh-CN" | "en-US";
    paletteId: string;
    fontPair: FontPairId;
    styleRecipe: StyleRecipe;
    includeCode: boolean;
    includeChart: boolean;
    modelConfig: ModelConfig;
    customOutlineJson: string;
    inputMode: InputMode;
    sourceText: string;
    occasion?: OccasionId;
    customTheme?: Theme;
  };

  const set = (patch: Partial<ConfigState>) => {
    if (patch.topic !== undefined) setTopic(patch.topic);
    if (patch.audience !== undefined) setAudience(patch.audience);
    if (patch.tone !== undefined) setTone(patch.tone);
    if (patch.slideCount !== undefined) setSlideCount(patch.slideCount);
    if (patch.language !== undefined) setLanguage(patch.language);
    if (patch.paletteId !== undefined) setPaletteId(patch.paletteId);
    if (patch.customTheme !== undefined) setCustomTheme(patch.customTheme);
    if (patch.fontPair !== undefined) setFontPair(patch.fontPair);
    if (patch.styleRecipe !== undefined) setStyleRecipe(patch.styleRecipe);
    if (patch.includeCode !== undefined) setIncludeCode(patch.includeCode);
    if (patch.includeChart !== undefined) setIncludeChart(patch.includeChart);
    if (patch.modelConfig !== undefined) updateModelConfig(patch.modelConfig);
    if (patch.customOutlineJson !== undefined) setCustomOutlineJson(patch.customOutlineJson);
    if (patch.inputMode !== undefined) setInputMode(patch.inputMode);
    if (patch.sourceText !== undefined) setSourceText(patch.sourceText);
    if (patch.occasion !== undefined) setOccasion(patch.occasion);
  };

  async function handleGenerate() {
    setError("");
    setIsLoading(true);
    setPlan(null);
    setResult(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let finalPlan: DeckPlan;

      if (inputMode === "json") {
        // 自定义大纲模式: 解析 + 与 AI 路径同源的校验/自愈
        finalPlan = parseCustomOutlineJson(customOutlineJson);
      } else {
        // AI 规划模式: 使用所选请求方式调用模型
        if (inputMode === "topic" && !topic.trim()) {
          throw new Error("请输入演示文稿主题。");
        }
        finalPlan = await requestLlmPlan(
          {
            topic: inputMode === "text" ? "根据所提供文案整理演示文稿" : topic,
            sourceText: inputMode === "text" ? sourceText : undefined,
            audience,
            tone,
            slideCount,
            language,
            paletteId,
            fontPair,
            styleRecipe,
            includeCode,
            includeChart,
            occasion,
          },
          { ...modelConfig, signal: controller.signal },
        );
      }

      setPlan(finalPlan);

      await exportPlan(finalPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试。");
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  }

  async function exportPlan(finalPlan: DeckPlan) {
    if (!finalPlan.title.trim() || finalPlan.slides.some(slide => !slide.title.trim())) {
      throw new Error("请填写演示文稿标题和每页标题后再导出。");
    }
    const markdown = deckPlanToMarkdown(finalPlan);
    const genResult = await renderDeckPlanToBlob(finalPlan, { paletteId, customTheme, fontPair, styleRecipe, language });
    setResult({
      blobUrl: genResult.blobUrl, fileName: genResult.fileName, sizeKb: genResult.sizeKb, plan: finalPlan,
      outlineUrl: URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" })),
      outlineFileName: genResult.fileName.replace(/\.pptx$/i, ".md"),
    });
  }

  function handlePlanChange(next: DeckPlan) {
    setPlan(next);
    setResult(null);
    setError("");
  }

  async function handleExportEdited() {
    if (!plan || isLoading) return;
    setError("");
    setIsLoading(true);
    setResult(null);
    try { await exportPlan(plan); }
    catch (err) { setError(err instanceof Error ? err.message : "导出失败，请检查大纲。"); }
    finally { setIsLoading(false); }
  }

  function handleReset() {
    setResult(null);
    setPlan(null);
    setError("");
  }

  // 无需 API Key 的完整体验路径：载入示例大纲 → 编辑 → 导出真实 PPTX
  function handleLoadSample() {
    setError("");
    setResult(null);
    setPlan(SAMPLE_PLAN);
  }

  const canGenerate = Boolean(
    inputMode === "topic" ? topic.trim() : inputMode === "text" ? sourceText.trim() : customOutlineJson.trim(),
  );

  // Ctrl/Cmd+Enter 快捷生成；用 ref 避免每次按键重绑监听器
  const shortcutRef = useRef({ isLoading, canGenerate, handleGenerate });
  shortcutRef.current = { isLoading, canGenerate, handleGenerate };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = shortcutRef.current;
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !s.isLoading && s.canGenerate) {
        e.preventDefault();
        s.handleGenerate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const previewTheme = customTheme || resolveTheme(paletteId);
  const onChinaNode = currentHost.includes("linguistwantstech.online");
  const onGlobalNode = currentHost.includes("vercel.app");
  const configSpotlight = useSpotlight<HTMLElement>();
  const ctaMagnetic = useMagnetic<HTMLButtonElement>(4);

  return (
    <div className="min-h-screen lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
      <AmbientBackground />
      {/* Header */}
      <header className="sticky top-0 z-20 shrink-0 border-b border-line bg-canvas/85 backdrop-blur-md">
        {isLoading && <div className="progress-ribbon" aria-hidden="true" />}
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-canvas shadow-xs">
              <span className="font-display text-lg italic leading-none">S</span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <h1 className="wordmark font-display text-lg tracking-tight">
                Slide Recipes
              </h1>
              <span className="hidden sm:inline-block h-3.5 w-px bg-line-strong" aria-hidden="true" />
              <span className="mono-label hidden sm:inline-block">Web Studio</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden md:flex items-center rounded-full border border-line bg-elev p-0.5 text-[11px] shadow-xs" role="group" aria-label="部署节点">
              <a
                href="https://slides.linguistwantstech.online/"
                aria-current={onChinaNode ? "page" : undefined}
                className={`press inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                  onChinaNode ? "bg-ink text-canvas font-medium" : "text-ink-mute hover:text-ink"
                }`}
                title="国内直连 EdgeOne CDN"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${onChinaNode ? "bg-canvas" : "bg-verm"}`} aria-hidden="true" />
                国内节点
              </a>
              <a
                href="https://slide-recipes-web.vercel.app/"
                aria-current={onGlobalNode ? "page" : undefined}
                className={`press inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                  onGlobalNode ? "bg-ink text-canvas font-medium" : "text-ink-mute hover:text-ink"
                }`}
                title="全球海外 Vercel Anycast"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${onGlobalNode ? "bg-canvas" : "bg-gold"}`} aria-hidden="true" />
                全球节点
              </a>
            </div>

            {inputMode === "topic" && !isLoading && (
              <button
                type="button"
                onClick={() => setTopic(EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)])}
                className="press inline-flex items-center gap-1.5 rounded-lg border border-line bg-elev px-3 py-1.5 text-xs text-ink-dim shadow-xs hover:border-line-strong hover:text-ink"
              >
                <IconShuffle size={13} />
                随机示例
              </button>
            )}
            {!plan && !isLoading && (
              <button
                type="button"
                onClick={handleLoadSample}
                className="press inline-flex items-center gap-1.5 rounded-lg border border-line bg-elev px-3 py-1.5 text-xs text-ink-dim shadow-xs hover:border-line-strong hover:text-ink"
                title="无需 API Key，直接预览并导出示例 PPTX"
              >
                <IconFileText size={13} />
                载入示例
              </button>
            )}
            {isLoading && (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="press inline-flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger hover:border-danger/70"
              >
                <IconStop size={13} />
                取消
              </button>
            )}
            <button
              type="button"
              ref={ctaMagnetic}
              onClick={handleGenerate}
              disabled={isLoading || !canGenerate}
              title="快捷键：Ctrl/Cmd + Enter"
              className="magnetic shine press inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[var(--ultra-deep)] disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-mute disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <span className="spin inline-block h-3 w-3 rounded-full border-[1.5px] border-white/40 border-t-white" aria-hidden="true" />
                  处理与渲染中
                </>
              ) : (
                <>
                  {plan && inputMode !== "json" ? "重新调用 AI 生成" : "生成大纲与 PPTX"}
                  <IconArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Body: two-column */}
      <main className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 px-6 py-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:py-4">
        {/* Left: config */}
        <section ref={configSpotlight} className="card spotlight rise min-w-0 p-5 lg:min-h-0 lg:overflow-y-auto" style={{ animationDelay: "40ms" }}>
          <ConfigPanel
            topic={topic}
            audience={audience}
            tone={tone}
            slideCount={slideCount}
            language={language}
            paletteId={paletteId}
            fontPair={fontPair}
            styleRecipe={styleRecipe}
            includeCode={includeCode}
            includeChart={includeChart}
            modelConfig={modelConfig}
            customOutlineJson={customOutlineJson}
            inputMode={inputMode}
            sourceText={sourceText}
            occasion={occasion}
            customTheme={customTheme}
            set={set}
          />
        </section>

        {/* Right: preview + download */}
        <section className="flex min-h-[60vh] min-w-0 flex-col gap-4 lg:min-h-0">
          {plan && (
            <div className="rise shrink-0 lg:max-h-[45%] lg:overflow-y-auto" style={{ animationDelay: "80ms" }}>
              <OutlineEditor plan={plan} isLoading={isLoading} dirty={!result}
                targetCount={slideCount}
                onChange={handlePlanChange} onExport={handleExportEdited} />
            </div>
          )}
          {result && (
            <div className="rise shrink-0" style={{ animationDelay: "60ms" }}>
              <DownloadCard
                fileName={result.fileName}
                blobUrl={result.blobUrl}
                sizeKb={result.sizeKb}
                outlineUrl={result.outlineUrl}
                outlineFileName={result.outlineFileName}
                onReset={handleReset}
              />
            </div>
          )}
          <div className="rise min-h-0 flex-1" style={{ animationDelay: plan ? "120ms" : "80ms" }}>
            <PreviewPanel plan={plan} isLoading={isLoading} error={error}
              theme={previewTheme} onLoadSample={handleLoadSample} />
          </div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-line bg-elev/60 px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-mute">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-ink-dim">
              <IconLock size={13} className="text-success" />
              本地纯前端渲染 · 零服务器存储 · API Key 只留内存
            </span>
            <span className="hidden sm:inline text-line-strong" aria-hidden="true">|</span>
            <div className="inline-flex items-center gap-2">
              <span>镜像</span>
              <a href="https://slides.linguistwantstech.online/" className="press text-ink-dim hover:text-gold hover:underline">国内 EdgeOne</a>
              <span className="text-line-strong" aria-hidden="true">·</span>
              <a href="https://slide-recipes-web.vercel.app/" className="press text-ink-dim hover:text-gold hover:underline">全球 Vercel</a>
            </div>
          </div>
          <a
            href="https://github.com/CacinieP/slide-recipes"
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex items-center gap-1.5 text-ink-dim hover:text-ink hover:underline"
          >
            GitHub Repository
            <IconArrowRight size={12} />
          </a>
        </div>
        <div className="mx-auto mt-2 max-w-7xl text-[11px] text-ink-mute">
          {PALETTES.length} 套色板 · {SLIDE_TYPES.length} 种版式 · 15 类演示场景 · 浏览器原生生成可编辑 PPTX
        </div>
      </footer>
    </div>
  );
}