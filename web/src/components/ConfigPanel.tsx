"use client";

import { useState } from "react";
import type { FontPairId, ModelConfig, StyleRecipe, InputMode, OccasionId, Theme } from "@/lib/types";
import { FONT_PAIRS, OCCASION_PRESETS } from "@/lib/palettes";
import { PROVIDER_PRESETS } from "@/lib/providers";
import { smartFetch, DEFAULT_REQUEST_MODE } from "@/lib/client-generator";
import { MAX_SOURCE_TEXT_LENGTH } from "@/lib/prompt";
import { SAMPLE_PLAN } from "@/lib/sample-plan";
import PalettePicker from "./PalettePicker";
import {
  IconServer, IconShield, IconSearch, IconKey, IconExternal, IconLock, IconCheck, IconChevronDown,
} from "./icons";

interface Props {
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
  set: (patch: Partial<Props>) => void;
}

const STYLES: { id: StyleRecipe; label: string; desc: string }[] = [
  { id: "sharp", label: "Sharp", desc: "紧凑 · 数据密集" },
  { id: "soft", label: "Soft", desc: "均衡 · 通用商务" },
  { id: "rounded", label: "Rounded", desc: "宽松 · 产品营销" },
  { id: "pill", label: "Pill", desc: "通透 · 品牌发布" },
];

/** Style glyph: the corner-radius language of each recipe, drawn literally. */
function StyleGlyph({ id, active }: { id: StyleRecipe; active: boolean }) {
  const cls = `h-4 w-6 border-[1.5px] ${active ? "border-gold" : "border-ink-mute"}`;
  if (id === "sharp") return <span className={`${cls} rounded-none`} aria-hidden="true" />;
  if (id === "soft") return <span className={`${cls} rounded-[4px]`} aria-hidden="true" />;
  if (id === "rounded") return <span className={`${cls} rounded-[8px]`} aria-hidden="true" />;
  return <span className={`${cls} rounded-full`} aria-hidden="true" />;
}

function SectionHead({ no, title, hint }: { no: string; title: string; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-2">
      <div className="flex items-baseline gap-2">
        <span className="section-no" aria-hidden="true">{no}</span>
        <h3 className="text-[13px] font-semibold tracking-tight text-ink">{title}</h3>
      </div>
      {hint && <span className="text-[11px] text-ink-mute">{hint}</span>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium tracking-wide text-ink-mute">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-elev px-3 py-2 text-sm text-ink placeholder:text-ink-mute/80 shadow-xs transition focus:border-gold/60 focus:outline-none";

export default function ConfigPanel(props: Props) {
  const { set } = props;
  const [showModelConfig, setShowModelConfig] = useState(true);

  // 自动探测模型状态
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedModels, setDetectedModels] = useState<string[]>([]);
  const [detectStatus, setDetectStatus] = useState<string>("");
  const [providerRegion, setProviderRegion] = useState<"all" | "cn" | "global">("all");

  // 根据当前的 baseUrl 匹配预设渠道，若没有匹配到则是 custom
  const matchedPreset = PROVIDER_PRESETS.find(
    (p) => p.id !== "custom" && p.baseUrl === props.modelConfig.baseUrl,
  );
  const [customProvider, setCustomProvider] = useState(false);
  const currentProviderId = !customProvider && matchedPreset ? matchedPreset.id : "custom";
  const requestMode = props.modelConfig.mode || DEFAULT_REQUEST_MODE;

  const handleSelectProvider = (presetId: string) => {
    const preset = PROVIDER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDetectedModels([]);
    setDetectStatus("");
    setCustomProvider(preset.id === "custom");
    if (preset.id === "custom") {
      set({
        modelConfig: {
          ...props.modelConfig,
        },
      });
    } else {
      set({
        modelConfig: {
          ...props.modelConfig,
          baseUrl: preset.baseUrl,
          model: preset.defaultModel,
        },
      });
    }
  };

  // 自动检测可用模型函数
  const handleDetectModels = async () => {
    const baseUrl = (props.modelConfig.baseUrl || "").trim().replace(/\/+$/, "");
    const apiKey = (props.modelConfig.apiKey || "").trim();

    if (!baseUrl) {
      setDetectStatus("请先填写 API Base URL");
      return;
    }
    if (!apiKey) {
      setDetectStatus("请先填写 API Key 后再检测模型");
      return;
    }

    setIsDetecting(true);
    setDetectStatus("正在检测端点与模型列表...");
    setDetectedModels([]);

    try {
      const resp = await smartFetch(`${baseUrl}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }, props.modelConfig);

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`端点返回错误 (${resp.status}): ${text.slice(0, 150)}`);
      }

      const resData: unknown = await resp.json();
      const rawList: unknown[] = Array.isArray(resData)
        ? resData
        : resData && typeof resData === "object" && Array.isArray((resData as { data?: unknown }).data)
          ? (resData as { data: unknown[] }).data
          : [];

      // 提取所有有效的 model id
      const modelIds: string[] = rawList
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const record = item as { id?: unknown; name?: unknown };
            return typeof record.id === "string" ? record.id : typeof record.name === "string" ? record.name : undefined;
          }
          return undefined;
        })
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

      if (modelIds.length === 0) {
        throw new Error("成功连接，但返回的 /models 列表为空");
      }

      setDetectedModels(modelIds);
      setDetectStatus(`检测成功，探测到 ${modelIds.length} 个可用模型`);

      // Preserve a chosen model; detection must not silently switch its cost tier.
      if (!props.modelConfig.model.trim()) {
        set({
          modelConfig: { ...props.modelConfig, model: modelIds[0] },
        });
      } else if (!modelIds.includes(props.modelConfig.model)) {
        setDetectStatus(`已获取 ${modelIds.length} 个模型，但当前型号未出现在列表中；已保留设置，请确认服务商支持该型号。`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setDetectStatus(`检测失败: ${msg}`);
    } finally {
      setIsDetecting(false);
    }
  };

  const detectTone = detectStatus.startsWith("检测成功")
    ? "text-success"
    : detectStatus.startsWith("检测失败")
      ? "text-danger"
      : "text-ink-dim";

  return (
    <div className="flex flex-col gap-6">
      {/* 01 模型服务 */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="section-no" aria-hidden="true">01</span>
            <h3 className="text-[13px] font-semibold tracking-tight text-ink">模型服务</h3>
          </div>
          <button
            type="button"
            aria-expanded={showModelConfig}
            onClick={() => setShowModelConfig(!showModelConfig)}
            className="press inline-flex items-center gap-1 text-[11px] text-ink-mute hover:text-ink"
          >
            {showModelConfig ? "收起" : "展开"}
            <IconChevronDown size={12} className={`transition-transform ${showModelConfig ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div className={`collapse-grid ${showModelConfig ? "is-open" : ""}`} inert={!showModelConfig}>
          <div>
          <div className="flex flex-col gap-3.5 pt-0.5">
            {/* 通信与请求模式切换 */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-ink-mute">请求模式</span>
                <span className="text-[10px] text-ink-mute">
                  {requestMode === "proxy" ? "经本站内存转发 · 解决跨域" : "浏览器直连 · 不经服务器"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={requestMode === "proxy"}
                  onClick={() => {
                    setDetectedModels([]); setDetectStatus("");
                    set({ modelConfig: { ...props.modelConfig, mode: "proxy" } });
                  }}
                  className={`press flex flex-col rounded-lg border p-3 text-left ${
                    requestMode === "proxy"
                      ? "border-gold bg-gold-soft shadow-xs ring-1 ring-gold/40"
                      : "border-line bg-elev text-ink-dim shadow-xs hover:border-line-strong"
                  }`}
                >
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${requestMode === "proxy" ? "text-gold" : "text-ink"}`}>
                    <IconServer size={14} />
                    代理模式
                    <span className="ml-auto rounded-full bg-gold px-1.5 py-px text-[9px] font-medium text-white">推荐</span>
                  </span>
                  <span className="mt-1 text-[10px] leading-snug text-ink-mute">
                    解决跨域限制 · 纯内存管道透传 · 不落盘不记 Key
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={requestMode === "direct"}
                  onClick={() => {
                    setDetectedModels([]); setDetectStatus("");
                    set({ modelConfig: { ...props.modelConfig, mode: "direct" } });
                  }}
                  className={`press flex flex-col rounded-lg border p-3 text-left ${
                    requestMode === "direct"
                      ? "border-azure bg-blue-soft shadow-xs ring-1 ring-azure/40"
                      : "border-line bg-elev text-ink-dim shadow-xs hover:border-line-strong"
                  }`}
                >
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${requestMode === "direct" ? "text-azure" : "text-ink"}`}>
                    <IconShield size={14} />
                    纯前端直连
                  </span>
                  <span className="mt-1 text-[10px] leading-snug text-ink-mute">
                    浏览器直发服务商 · 物理隔离不经任何服务器
                  </span>
                </button>
              </div>
            </div>

            {/* 常见服务商快速切换按钮 */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-ink-mute">服务商</span>
                <div className="inline-flex rounded-md border border-line bg-base p-0.5 text-[10px]" role="group" aria-label="服务商区域筛选">
                  {([["all", "全部"], ["cn", "国内"], ["global", "海外"]] as const).map(([region, label]) => (
                    <button
                      key={region}
                      type="button"
                      aria-pressed={providerRegion === region}
                      onClick={() => setProviderRegion(region)}
                      className={`press rounded px-2 py-0.5 ${
                        providerRegion === region ? "bg-elev font-medium text-ink shadow-xs" : "text-ink-mute hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PROVIDER_PRESETS.filter(
                  (p) => providerRegion === "all" || p.id === "custom" || p.region === providerRegion
                ).map((p) => {
                  const active = currentProviderId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleSelectProvider(p.id)}
                      className={`press pop inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                        active
                          ? "border-gold bg-gold-soft font-medium text-gold"
                          : "border-line bg-elev text-ink-dim hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      <span>{p.name.split(" ")[0]}</span>
                      <span className={`text-[9px] ${active ? "text-gold/70" : "text-ink-mute"}`}>{p.badge}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Base URL */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-ink-mute">API Base URL</span>
                {matchedPreset?.docUrl && (
                  <a
                    href={matchedPreset.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="press inline-flex items-center gap-1 text-[10px] text-gold hover:underline"
                  >
                    获取 API Key
                    <IconExternal size={10} />
                  </a>
                )}
              </div>
              <input
                aria-label="API Base URL"
                className={inputCls}
                value={props.modelConfig.baseUrl}
                onChange={(e) => {
                  setDetectedModels([]); setDetectStatus("");
                  set({ modelConfig: { ...props.modelConfig, baseUrl: e.target.value } });
                }}
                placeholder="例如: https://api.modelbest.cn/v1 或自定义端点"
              />
              <div className="mt-1 text-[10px] text-ink-mute">
                {requestMode === "proxy" ? "自定义地址需由部署者在允许列表中显式批准。" : "直连是否可用取决于供应商的 CORS 策略。"}
              </div>
            </div>

            {/* API Key */}
            <div>
              <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-ink-mute">
                <IconKey size={11} />
                API Key
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  aria-label="API Key"
                  autoComplete="off"
                  className={inputCls}
                  value={props.modelConfig.apiKey}
                  onChange={(e) =>
                    set({
                      modelConfig: { ...props.modelConfig, apiKey: e.target.value },
                    })
                  }
                  placeholder={matchedPreset?.keyPlaceholder || "sk-..."}
                />
                <button
                  type="button"
                  onClick={handleDetectModels}
                  disabled={isDetecting || !props.modelConfig.baseUrl}
                  className="press inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gold/50 bg-gold-soft px-3 py-2 text-xs font-medium text-gold hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-50"
                  title="使用当前请求方式查询 /models"
                >
                  {isDetecting ? (
                    <span className="spin inline-block h-3 w-3 rounded-full border-[1.5px] border-gold/30 border-t-gold" aria-hidden="true" />
                  ) : (
                    <IconSearch size={13} />
                  )}
                  {isDetecting ? "检测中" : "检测模型"}
                </button>
              </div>
              {detectStatus && (
                <div className={`mt-1 text-[11px] ${detectTone}`} role="status">
                  {detectStatus}
                </div>
              )}
            </div>

            {/* Model Name */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-ink-mute">模型</span>
                {detectedModels.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-success">
                    <IconCheck size={10} />
                    已连通 · {detectedModels.length} 个模型
                  </span>
                )}
              </div>

              {detectedModels.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <select
                    aria-label="从已检测模型中选择"
                    className={inputCls}
                    value={props.modelConfig.model}
                    onChange={(e) =>
                      set({
                        modelConfig: { ...props.modelConfig, model: e.target.value },
                      })
                    }
                  >
                    {props.modelConfig.model.trim() && !detectedModels.includes(props.modelConfig.model) && (
                      <option value={props.modelConfig.model}>
                        当前模型: {props.modelConfig.model} (未在列表中)
                      </option>
                    )}
                    {detectedModels.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-ink-mute">
                    已自动拉取该服务支持的模型列表，可直接点选，也可在下方改为任意自定义 ID。
                  </div>
                </div>
              ) : matchedPreset && matchedPreset.models.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <select
                    aria-label="从预设模型中选择"
                    className={inputCls}
                    value={props.modelConfig.model}
                    onChange={(e) =>
                      set({
                        modelConfig: { ...props.modelConfig, model: e.target.value },
                      })
                    }
                  >
                    {matchedPreset.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.desc ? `(${m.desc})` : ""}
                      </option>
                    ))}
                    <option value={props.modelConfig.model}>自定义型号: {props.modelConfig.model}</option>
                  </select>
                </div>
              ) : null}
              <input aria-label="自定义模型名" className={`${inputCls} mt-1.5 font-mono text-xs`} value={props.modelConfig.model}
                onChange={(e) => set({ modelConfig: { ...props.modelConfig, model: e.target.value } })}
                placeholder="手动输入自定义模型 ID" />
            </div>

            {/* ModelBest 推荐：一行式，不喧宾夺主 */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-base px-3 py-2">
              <span className="text-[11px] text-ink-dim">
                没有 Key？推荐 ModelBest（MiniCPM），默认模型
                <code className="mx-1 font-mono text-[10px] text-ink">MiniCPM-V-4.7-35B-A3B</code>
              </span>
              <a
                href="https://platform.modelbest.cn/console/login?ref=A93DCA73"
                target="_blank"
                rel="noreferrer"
                className="press inline-flex items-center gap-1 text-[11px] font-medium text-gold hover:underline"
              >
                免费注册领取额度
                <IconExternal size={10} />
              </a>
            </div>

            {/* 隐私承诺：安静的脚注，而不是大色块 */}
            <div className="border-t border-line pt-2.5 text-[10.5px] leading-relaxed text-ink-mute">
              <div className="mb-1 flex items-center gap-1.5 font-medium text-ink-dim">
                <IconLock size={11} className="text-success" />
                隐私承诺
              </div>
              PPTX 纯前端本地组装，文件绝不上报；Key 仅保留在当前浏览器内存，绝不建库收集。
              {requestMode === "proxy" ? (
                <span className="text-warning"> 当前为代理模式：仅作内存管道转发以解决跨域，服务器不落盘、不记录 Key。</span>
              ) : (
                <span className="text-success"> 当前为直连模式：浏览器直接与供应商通信，不经过任何中间服务器。</span>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* 02 演示场景 */}
      <div className="border-t border-line pt-4">
        <SectionHead no="02" title="演示场景" hint="15 类场景联动风格" />
        <div className="grid max-h-40 grid-cols-3 gap-1.5 overflow-y-auto pr-1">
          {OCCASION_PRESETS.map((o) => {
            const active = props.occasion === o.id;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  set({
                    occasion: o.id,
                    tone: o.recommendedTone,
                    paletteId: o.recommendedPalette,
                    customTheme: undefined,
                    styleRecipe: o.recommendedStyle,
                    fontPair: o.recommendedFont,
                    topic: props.topic ? props.topic : o.sampleTopic,
                  });
                }}
                className={`press pop rounded-lg border p-2 text-left ${
                  active
                    ? "border-gold bg-gold-soft shadow-xs"
                    : "border-line bg-elev shadow-xs hover:border-line-strong"
                }`}
              >
                <span className={`block truncate text-xs font-medium ${active ? "text-gold" : "text-ink"}`}>
                  {o.name.split(" / ")[0]}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-ink-mute">{o.desc.split("、")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 03 创作模式与内容 */}
      <div className="border-t border-line pt-4">
        <SectionHead no="03" title="创作模式" />
        <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-lg border border-line bg-base p-1" role="group" aria-label="创作模式">
          {([
            ["topic", "主题生成"],
            ["text", "粘贴文案"],
            ["json", "JSON 大纲"],
          ] as const).map(([mode, label]) => (
            <button key={mode} type="button" aria-pressed={props.inputMode === mode}
              onClick={() => set({ inputMode: mode })}
              className={`press rounded-md px-2 py-1.5 text-center text-xs ${props.inputMode === mode
                ? "bg-elev font-semibold text-ink shadow-xs"
                : "text-ink-mute hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>

        {props.inputMode !== "json" ? (
          <div className="flex flex-col gap-3">
            {props.inputMode === "text" ? (
              <Field label="原始文案">
                <textarea aria-label="原始文案" className={`${inputCls} min-h-44 resize-y`}
                  value={props.sourceText} maxLength={MAX_SOURCE_TEXT_LENGTH}
                  onChange={(e) => set({ sourceText: e.target.value })}
                  placeholder="粘贴文章、会议笔记、Markdown、列表或表格文本，无需转换为 JSON。AI 会整理为大纲并生成 PPTX。" />
                <span className="mt-1 block text-[10px] text-ink-mute">{props.sourceText.length.toLocaleString()} / 20,000 字符 · 文案会发送给所选模型</span>
              </Field>
            ) : (
              <Field label="主题">
                <textarea aria-label="演示主题" className={`${inputCls} min-h-16 resize-y`} value={props.topic}
                  onChange={(e) => set({ topic: e.target.value })} placeholder="例如：AI 驱动的年度战略汇报" />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="受众">
                <input
                  className={inputCls}
                  value={props.audience}
                  onChange={(e) => set({ audience: e.target.value })}
                  placeholder="管理层 / 产品团队"
                />
              </Field>
              <Field label="语气">
                <input
                  className={inputCls}
                  value={props.tone}
                  onChange={(e) => set({ tone: e.target.value })}
                  placeholder="专业、清晰、简洁"
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="大致页数">
                <input
                  type="number"
                  min={3}
                  max={30}
                  aria-label="大致页数"
                  className={inputCls}
                  value={props.slideCount}
                  onChange={(e) => set({ slideCount: Math.max(3, Math.min(30, Number(e.target.value) || 8)) })}
                  placeholder="约 8 页"
                  title="设定大致目标页数（AI 会围绕主题自适应组织 3~30 页）"
                />
              </Field>
              <Field label="语言">
                <select
                  aria-label="语言"
                  className={inputCls}
                  value={props.language}
                  onChange={(e) => set({ language: e.target.value as "zh-CN" | "en-US" })}
                >
                  <option value="zh-CN">中文</option>
                  <option value="en-US">English</option>
                </select>
              </Field>
              <Field label="字体">
                <select
                  aria-label="字体配对"
                  className={inputCls}
                  value={props.fontPair}
                  onChange={(e) => set({ fontPair: e.target.value as FontPairId })}
                >
                  {FONT_PAIRS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.header} / {f.body}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Field label="自定义大纲 JSON">
              <textarea
                aria-label="自定义大纲 JSON"
                className={`${inputCls} min-h-48 resize-y font-mono text-xs`}
                value={props.customOutlineJson}
                onChange={(e) => set({ customOutlineJson: e.target.value })}
                placeholder={`{\n  "title": "自定义商业方案",\n  "slides": [\n    { "type": "cover", "title": "项目规划", "subtitle": "面向全员" },\n    { "type": "kpiDashboard", "title": "关键业务指标", "items": [{ "label": "ARR", "value": "120M", "change": "+30%", "context": "同比" }] },\n    { "type": "closing", "title": "感谢聆听", "action": "推进落地" }\n  ]\n}`}
              />
            </Field>
            <div className="flex items-center justify-between text-[11px] text-ink-mute">
              <span>支持 27 种原生版式，未知类型自动归一</span>
              <button
                type="button"
                onClick={() => set({ customOutlineJson: JSON.stringify(SAMPLE_PLAN, null, 2) })}
                className="press font-medium text-gold hover:underline"
              >
                填入标准示例
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 04 调色板 */}
      <div className="border-t border-line pt-4">
        <PalettePicker
          value={props.paletteId}
          customTheme={props.customTheme}
          onChange={(paletteId) => set({ paletteId, customTheme: undefined })}
          onCustomThemeChange={(customTheme) => set({ customTheme })}
        />
      </div>

      {/* 05 风格配方 */}
      <div className="border-t border-line pt-4">
        <SectionHead no="05" title="风格配方" />
        <div className="grid grid-cols-4 gap-2">
          {STYLES.map((s) => {
            const active = props.styleRecipe === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => set({ styleRecipe: s.id })}
                className={`press pop flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 ${
                  active
                    ? "border-gold bg-gold-soft shadow-xs"
                    : "border-line bg-elev shadow-xs hover:border-line-strong"
                }`}
              >
                <StyleGlyph id={s.id} active={active} />
                <span className={`text-xs font-semibold ${active ? "text-gold" : "text-ink"}`}>{s.label}</span>
                <span className="text-[9px] leading-tight text-ink-mute">{s.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 06 内容偏好 */}
      {props.inputMode !== "json" && (
        <div className="border-t border-line pt-4">
          <SectionHead no="06" title="内容偏好" />
          <div className="flex gap-2">
            {([
              ["includeCode", "代码片段"],
              ["includeChart", "图表建议"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={props[key]}
                onClick={() => set({ [key]: !props[key] } as Partial<Props>)}
                className={`press flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                  props[key]
                    ? "border-gold bg-gold-soft text-gold"
                    : "border-line bg-elev text-ink-dim shadow-xs hover:border-line-strong"
                }`}
              >
                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${props[key] ? "border-gold bg-gold text-white" : "border-line-strong bg-elev"}`} aria-hidden="true">
                  {props[key] && <IconCheck size={8} />}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}