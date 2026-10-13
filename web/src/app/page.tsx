"use client";

import { useState, useEffect } from "react";
import ConfigPanel from "@/components/ConfigPanel";
import PreviewPanel from "@/components/PreviewPanel";
import DownloadCard from "@/components/DownloadCard";
import { requestLlmPlan, renderDeckPlanToBlob } from "@/lib/client-generator";
import type { DeckPlan, FontPairId, ModelConfig, StyleRecipe } from "@/lib/types";

interface Result {
  blobUrl: string;
  fileName: string;
  sizeKb: number;
  plan: DeckPlan;
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
};

export default function Home() {
  const [topic, setTopic] = useState(EXAMPLES[0]);
  const [audience, setAudience] = useState("产品团队与管理层");
  const [tone, setTone] = useState("专业、清晰、简洁");
  const [slideCount, setSlideCount] = useState(6);
  const [language, setLanguage] = useState<"zh-CN" | "en-US">("zh-CN");
  const [paletteId, setPaletteId] = useState("consulting-navy");
  const [fontPair, setFontPair] = useState<FontPairId>("georgia-calibri");
  const [styleRecipe, setStyleRecipe] = useState<StyleRecipe>("soft");
  const [includeCode, setIncludeCode] = useState(false);
  const [includeChart, setIncludeChart] = useState(true);

  // 模型配置三要素 (持久化至 localStorage)
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG);

  // 自定义大纲模式
  const [useCustomOutline, setUseCustomOutline] = useState(false);
  const [customOutlineJson, setCustomOutlineJson] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<DeckPlan | null>(null);
  const [result, setResult] = useState<Result | null>(null);

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
    useCustomOutline: boolean;
  };

  const set = (patch: Partial<ConfigState>) => {
    if (patch.topic !== undefined) setTopic(patch.topic);
    if (patch.audience !== undefined) setAudience(patch.audience);
    if (patch.tone !== undefined) setTone(patch.tone);
    if (patch.slideCount !== undefined) setSlideCount(patch.slideCount);
    if (patch.language !== undefined) setLanguage(patch.language);
    if (patch.paletteId !== undefined) setPaletteId(patch.paletteId);
    if (patch.fontPair !== undefined) setFontPair(patch.fontPair);
    if (patch.styleRecipe !== undefined) setStyleRecipe(patch.styleRecipe);
    if (patch.includeCode !== undefined) setIncludeCode(patch.includeCode);
    if (patch.includeChart !== undefined) setIncludeChart(patch.includeChart);
    if (patch.modelConfig !== undefined) updateModelConfig(patch.modelConfig);
    if (patch.customOutlineJson !== undefined) setCustomOutlineJson(patch.customOutlineJson);
    if (patch.useCustomOutline !== undefined) setUseCustomOutline(patch.useCustomOutline);
  };

  async function handleGenerate() {
    setError("");
    setIsLoading(true);
    setPlan(null);
    setResult(null);

    try {
      let finalPlan: DeckPlan;

      if (useCustomOutline) {
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
        // AI 规划模式: 调用纯前端直连的大模型服务
        if (!topic.trim()) {
          throw new Error("请输入演示文稿主题。");
        }
        finalPlan = await requestLlmPlan(
          {
            topic,
            audience,
            tone,
            slideCount,
            language,
            paletteId,
            fontPair,
            styleRecipe,
            includeCode,
            includeChart,
          },
          modelConfig,
        );
      }

      setPlan(finalPlan);

      // 浏览器纯前端直接生成可编辑 PPTX 二进制
      const genResult = await renderDeckPlanToBlob(finalPlan, {
        paletteId,
        fontPair,
        styleRecipe,
        language,
      });

      setResult({
        blobUrl: genResult.blobUrl,
        fileName: genResult.fileName,
        sizeKb: genResult.sizeKb,
        plan: finalPlan,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试。");
    } finally {
      setIsLoading(false);
    }
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
                  Vercel Ready · Native CORS Proxy
                </span>
              </div>
              <p className="mono-label">28 PALETTES · 23 SLIDE TYPES · BROWSER-NATIVE PPTX</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!useCustomOutline && (
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
              disabled={isLoading || (!useCustomOutline && !topic.trim())}
              className="rounded-md bg-gold px-4 py-1.5 text-xs font-semibold text-canvas transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-mute"
            >
              {isLoading ? "处理与渲染中…" : "生成 .pptx"}
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
            useCustomOutline={useCustomOutline}
            set={set}
          />
        </section>

        {/* Right: preview + download */}
        <section className="flex min-h-[60vh] flex-col gap-4">
          {result && (
            <DownloadCard
              fileName={result.fileName}
              blobUrl={result.blobUrl}
              sizeKb={result.sizeKb}
              onReset={handleReset}
            />
          )}
          <div className="flex-1">
            <PreviewPanel plan={plan} isLoading={isLoading} error={error} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-ink-mute">
          <span className="mono-label">100% 浏览器客户端渲染 · 无中间服务器中转 · 密码学安全</span>
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
