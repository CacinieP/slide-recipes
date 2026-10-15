"use client";

import { useState, useEffect } from "react";
import ConfigPanel from "@/components/ConfigPanel";
import OutlineEditor from "@/components/OutlineEditor";
import PreviewPanel from "@/components/PreviewPanel";
import DownloadCard from "@/components/DownloadCard";
import { requestLlmPlan, renderDeckPlanToBlob, DEFAULT_REQUEST_MODE, DEFAULT_PROXY_URL } from "@/lib/client-generator";
import { deckPlanToMarkdown } from "@/lib/outline-markdown";
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
  model: "MiniCPM-V-4.7-1B",
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

  // 模型配置三要素 (持久化至 localStorage)
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHost(window.location.hostname);
    }
  }, []);

  useEffect(() => () => {
    if (result) { URL.revokeObjectURL(result.blobUrl); URL.revokeObjectURL(result.outlineUrl); }
  }, [result]);

  // 读取 localStorage 历史配置
  useEffect(() => {
    try {
      const saved = localStorage.getItem("slide_recipes_model_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        setModelConfig((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  // 更新配置并持久化敏感字段到本地浏览器
  const updateModelConfig = (cfg: ModelConfig) => {
    setModelConfig(cfg);
    try {
      localStorage.setItem("slide_recipes_model_config", JSON.stringify(cfg));
    } catch {}
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

    try {
      let finalPlan: DeckPlan;

      if (inputMode === "json") {
        // 自定义大纲模式: 直接解析用户输入的 JSON
        if (!customOutlineJson.trim()) {
          throw new Error("请在左侧填入自定义大纲与内容的 JSON 数据。");
        }
        try {
          const parsed = JSON.parse(customOutlineJson);
          if (!parsed || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
            throw new Error("自定义大纲必须包含有效的 slides 数组。");
          }
          finalPlan = {
            title: parsed.title || "自定义演示文稿",
            slides: parsed.slides,
          };
        } catch (e) {
          throw new Error(`自定义 JSON 解析失败: ${e instanceof Error ? e.message : String(e)}`);
        }
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
          modelConfig,
        );
      }

      setPlan(finalPlan);

      await exportPlan(finalPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试。");
    } finally {
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

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-gold/50 bg-gold-soft">
              <span className="font-mono text-sm font-bold text-gold">S</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight text-ink">
                  Slide Recipes Web Studio
                </h1>
                <span className="rounded bg-azure/20 text-azure px-1.5 py-0.2 text-[10px] font-mono border border-azure/40">
                  Web Studio · 模型连接可配置
                </span>
              </div>
              <p className="mono-label">28 PALETTES · 25 SLIDE TYPES · 15 OCCASIONS · BROWSER-NATIVE PPTX</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 rounded-full border border-line bg-elev/70 px-2 py-1 text-[11px]">
              <span className="text-ink-dim pl-1">网络节点:</span>
              <a
                href="https://slides.linguistwantstech.online/"
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                  currentHost.includes("linguistwantstech.online")
                    ? "bg-gold-soft text-gold font-medium border border-gold/40"
                    : "text-ink-dim hover:text-ink hover:bg-base"
                }`}
                title="国内直连 EdgeOne CDN"
              >
                <span>🇨🇳 国内节点</span>
              </a>
              <span className="text-line">|</span>
              <a
                href="https://slide-recipes-web.vercel.app/"
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                  currentHost.includes("vercel.app")
                    ? "bg-azure/20 text-azure font-medium border border-azure/40"
                    : "text-ink-dim hover:text-ink hover:bg-base"
                }`}
                title="全球海外 Vercel Anycast"
              >
                <span>🌍 全球节点</span>
              </a>
            </div>
            {inputMode === "topic" && (
              <button
                type="button"
                onClick={() => setTopic(EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)])}
                className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-dim transition hover:border-line-strong hover:text-ink"
              >
                随机示例
              </button>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || (inputMode === "topic" ? !topic.trim() : inputMode === "text" ? !sourceText.trim() : !customOutlineJson.trim())}
              className="rounded-md bg-gold px-4 py-1.5 text-xs font-semibold text-canvas transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-mute"
            >
              {isLoading ? "处理与渲染中…" : plan && inputMode !== "json" ? "重新调用 AI 生成" : "生成大纲与 PPTX"}
            </button>
          </div>
        </div>
      </header>

      {/* Body: two-column */}
      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Left: config */}
        <section className="rounded-xl border border-line bg-canvas p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <h2 className="mono-label text-ink-dim">CONFIGURATION / 工作台配置</h2>
          </div>
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
        <section className="flex min-h-[60vh] flex-col gap-4">
          {plan && (
            <OutlineEditor plan={plan} isLoading={isLoading} dirty={!result}
              targetCount={slideCount}
              onChange={handlePlanChange} onExport={handleExportEdited} />
          )}
          {result && (
            <DownloadCard
              fileName={result.fileName}
              blobUrl={result.blobUrl}
              sizeKb={result.sizeKb}
              outlineUrl={result.outlineUrl}
              outlineFileName={result.outlineFileName}
              onReset={handleReset}
            />
          )}
          <div className="flex-1">
            <PreviewPanel plan={plan} isLoading={isLoading} error={error} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-mute">
          <div className="flex flex-wrap items-center gap-3">
            <span className="mono-label">PPTX 在浏览器原生渲染 · 零服务器存储</span>
            <span className="hidden sm:inline text-line">|</span>
            <div className="inline-flex items-center gap-2">
              <span>镜像站:</span>
              <a
                href="https://slides.linguistwantstech.online/"
                className="text-ink-dim hover:text-gold hover:underline transition"
              >
                🇨🇳 腾讯云 EdgeOne (国内)
              </a>
              <span className="text-line">·</span>
              <a
                href="https://slide-recipes-web.vercel.app/"
                className="text-ink-dim hover:text-azure hover:underline transition"
              >
                🌍 Vercel Anycast (全球)
              </a>
            </div>
          </div>
          <a
            href="https://github.com/CacinieP/slide-recipes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-dim hover:text-ink transition hover:underline"
          >
            GitHub Repository
          </a>
        </div>
      </footer>
    </div>
  );
}
