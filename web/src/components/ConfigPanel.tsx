"use client";

import { useState } from "react";
import type { FontPairId, ModelConfig, StyleRecipe, InputMode, OccasionId } from "@/lib/types";
import { FONT_PAIRS, OCCASION_PRESETS } from "@/lib/palettes";
import { PROVIDER_PRESETS } from "@/lib/providers";
import { smartFetch, DEFAULT_REQUEST_MODE } from "@/lib/client-generator";
import { MAX_SOURCE_TEXT_LENGTH } from "@/lib/prompt";
import PalettePicker from "./PalettePicker";

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
  set: (patch: Partial<Props>) => void;
}

const STYLES: { id: StyleRecipe; label: string; desc: string }[] = [
  { id: "sharp", label: "Sharp", desc: "紧凑·数据密集" },
  { id: "soft", label: "Soft", desc: "均衡·通用商务" },
  { id: "rounded", label: "Rounded", desc: "宽松·产品营销" },
  { id: "pill", label: "Pill", desc: "通透·品牌发布" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mono-label mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-line bg-elev px-3 py-2 text-sm text-ink placeholder:text-ink-mute transition focus:border-gold/60 focus:outline-none";

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

      const resData = (await resp.json()) as any;
      const rawList = Array.isArray(resData)
        ? resData
        : Array.isArray(resData?.data)
          ? resData.data
          : [];

      // 提取所有有效的 model id
      const modelIds: string[] = rawList
        .map((item: any) => (typeof item === "string" ? item : item?.id || item?.name))
        .filter((id: any): id is string => typeof id === "string" && id.trim().length > 0);

      if (modelIds.length === 0) {
        throw new Error("成功连接，但返回的 /models 列表为空");
      }

      setDetectedModels(modelIds);
      setDetectStatus(`✅ 检测成功！探测到 ${modelIds.length} 个可用模型`);

      // Preserve a chosen model; detection must not silently switch its cost tier.
      if (!props.modelConfig.model.trim()) {
        set({
          modelConfig: { ...props.modelConfig, model: modelIds[0] },
        });
      } else if (!modelIds.includes(props.modelConfig.model)) {
        setDetectStatus(`⚠️ 已获取 ${modelIds.length} 个模型，但当前型号未出现在列表中；已保留设置，请确认服务商支持该型号。`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setDetectStatus(`❌ 检测失败: ${msg}`);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 1. 模型服务配置三要素 (预设快捷选择 + 自定义 Endpoint + 自动检测) */}
      <div className="rounded-lg border border-line bg-elev/60 p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-azure" />
            <span className="mono-label text-ink">MODEL SERVICE / 模型服务三要素</span>
          </div>
          <button
            type="button"
            onClick={() => setShowModelConfig(!showModelConfig)}
            className="text-xs text-ink-dim hover:text-ink underline"
          >
            {showModelConfig ? "收起" : "展开配置"}
          </button>
        </div>

        {showModelConfig && (
          <div className="flex flex-col gap-3">
            <label className="text-xs text-ink-dim">请求方式
              <select className={inputCls} value={requestMode} onChange={(e) => {
                setDetectedModels([]); setDetectStatus("");
                set({ modelConfig: { ...props.modelConfig, mode: e.target.value as "proxy" | "direct" } });
              }}>
                <option value="proxy">代理（同源 /api/proxy）</option>
                <option value="direct">浏览器直连（受供应商 CORS 策略限制）</option>
              </select>
            </label>
            {/* 常见服务商快速切换按钮 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-ink-dim">预设服务商快捷选择：</span>
                <div className="inline-flex rounded border border-line bg-base p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setProviderRegion("all")}
                    className={`px-1.5 py-0.5 rounded transition ${
                      providerRegion === "all" ? "bg-elev font-medium text-ink shadow-xs" : "text-ink-mute hover:text-ink"
                    }`}
                  >
                    全部
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderRegion("cn")}
                    className={`px-1.5 py-0.5 rounded transition ${
                      providerRegion === "cn" ? "bg-elev font-medium text-ink shadow-xs" : "text-ink-mute hover:text-ink"
                    }`}
                  >
                    🇨🇳 国内直连 (免梯)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderRegion("global")}
                    className={`px-1.5 py-0.5 rounded transition ${
                      providerRegion === "global" ? "bg-elev font-medium text-ink shadow-xs" : "text-ink-mute hover:text-ink"
                    }`}
                  >
                    🌍 国际海外
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PROVIDER_PRESETS.filter(
                  (p) => providerRegion === "all" || p.id === "custom" || p.region === providerRegion
                ).map((p) => {
                  const active = currentProviderId === p.id;
                  const regionBadge = p.region === "cn" ? "🇨🇳" : p.region === "global" ? "🌍" : "⚙️";
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProvider(p.id)}
                      className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs transition border ${
                        active
                          ? "border-gold bg-gold-soft text-gold font-medium"
                          : "border-line bg-elev text-ink-dim hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      <span className="text-[10px] opacity-70">{regionBadge}</span>
                      <span>{p.name.split(" ")[0]}</span>
                      <span className="text-[10px] opacity-60">({p.badge})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Base URL (支持自由自定义修改) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-ink-dim">1. API Base URL (自定义或预设端点)</span>
                {matchedPreset?.docUrl && (
                  <a
                    href={matchedPreset.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-azure hover:underline"
                  >
                    获取 API Key →
                  </a>
                )}
              </div>
              <input
                className={inputCls}
                value={props.modelConfig.baseUrl}
                onChange={(e) => {
                  setDetectedModels([]); setDetectStatus("");
                  set({ modelConfig: { ...props.modelConfig, baseUrl: e.target.value } });
                }}
                placeholder="例如: https://api.modelbest.cn/v1 或 自定义端点"
              />
              <div className="mt-1 text-[10px] text-ink-mute">
                {requestMode === "proxy" ? "自定义地址需由部署者在允许列表中显式批准。" : "直连是否可用取决于供应商的 CORS 策略。"}
              </div>
            </div>

            {/* API Key */}
            <div>
              <div className="text-[11px] text-ink-dim mb-1">2. API Key (用于指定模型服务认证)</div>
              <div className="flex gap-2">
                <input
                  type="password"
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
                  className="shrink-0 rounded-md border border-azure/60 bg-azure/10 px-3 py-2 text-xs font-medium text-azure transition hover:bg-azure/20 disabled:cursor-not-allowed disabled:opacity-50"
                  title="使用当前请求方式查询 /models"
                >
                  {isDetecting ? "检测中…" : "🔍 自动检测模型"}
                </button>
              </div>
              {detectStatus && (
                <div
                  className={`mt-1 text-[11px] ${
                    detectStatus.startsWith("✅") ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {detectStatus}
                </div>
              )}
            </div>

            {/* Model Name (模型选择或填入) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-ink-dim">3. Model Name (检测选择或手动填入)</span>
                {detectedModels.length > 0 && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    已连通 ({detectedModels.length} 个模型)
                  </span>
                )}
              </div>

              {/* 如果自动探测到了模型，优先展示自动探测下拉列表 */}
              {detectedModels.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <select
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
                    * 已自动拉取该服务支持的模型列表，可直接点选。也可在下方修改为任意自定义 ID。
                  </div>
                </div>
              ) : matchedPreset && matchedPreset.models.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <select
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
              <input aria-label="自定义模型名" className={`${inputCls} mt-1.5`} value={props.modelConfig.model}
                onChange={(e) => set({ modelConfig: { ...props.modelConfig, model: e.target.value } })}
                placeholder="手动输入自定义模型 ID" />
            </div>

            {/* ModelBest 注册教程与专属邀请入口 */}
            <div className="rounded-md border border-gold/40 bg-gold-soft/60 p-2.5 text-xs text-ink-dim">
              <div className="flex items-center justify-between font-medium text-ink mb-1">
                <span className="flex items-center gap-1.5 text-gold">
                  <span>💡</span> 推荐方案：ModelBest (MiniCPM) API 快速获取
                </span>
                <a
                  href="https://platform.modelbest.cn/console/login?ref=A93DCA73"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-gold px-2 py-0.5 text-[11px] font-semibold text-canvas hover:brightness-110"
                >
                  免费注册领取额度 →
                </a>
              </div>
              <p className="text-[11px] leading-relaxed">
                1. 点击专属邀请链接注册/登录：
                <a
                  href="https://platform.modelbest.cn/console/login?ref=A93DCA73"
                  target="_blank"
                  rel="noreferrer"
                  className="text-azure underline mx-0.5"
                >
                  platform.modelbest.cn (专属邀请码 A93DCA73)
                </a>
                <br />
                2. 进入控制台「API 密钥」创建并复制以 <code className="text-gold font-mono">sk-live-</code> 开头的密钥填入上方。
                <br />
                3. 当前默认模型为 <code className="text-azure font-mono">MiniCPM-V-4.7-1B</code>。可点击「🔍 自动检测模型」检查你填写的 Key 是否可用。
              </p>
            </div>

            <div className="space-y-1 text-[10px] text-ink-mute">
              <div>API Key 保存在当前浏览器。请勿在共享电脑保存敏感配置。</div>
              <div>
                {requestMode === "proxy" ? "代理模式：API Key 会经过你自己的部署服务，再转发给已批准的供应商。仅使用你信任的部署。" : "直连模式：API Key 由浏览器直接发送给供应商；供应商须允许跨域请求。"}
              </div>
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-amber-300">
                <span className="font-semibold">💡 模型连接说明：</span>
                {requestMode === "proxy" ? "代理只转发已批准地址。被拒绝时请检查部署允许列表；503 请检查共享限流配置。" : "静态站未配置外部代理时使用直连；供应商可能因 CORS 策略拒绝浏览器请求。"} 服务不可用时可稍后重试，或切换至 JSON 大纲模式。
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 演示场合 / 场景预设 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="mono-label">OCCASION / 演示场景</span>
          <span className="text-[10px] text-ink-mute">15 类主流场景联动</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {OCCASION_PRESETS.map((o) => {
            const active = props.occasion === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  set({
                    occasion: o.id,
                    tone: o.recommendedTone,
                    paletteId: o.recommendedPalette,
                    styleRecipe: o.recommendedStyle,
                    fontPair: o.recommendedFont,
                    topic: props.topic ? props.topic : o.sampleTopic,
                  });
                }}
                className={`rounded border p-1.5 text-left transition flex flex-col justify-between ${
                  active
                    ? "border-gold bg-gold-soft text-gold font-medium"
                    : "border-line bg-elev/60 text-ink hover:border-line-strong hover:bg-elev"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-medium truncate">{o.name.split(" / ")[0]}</span>
                </div>
                <span className="text-[10px] text-ink-mute truncate mt-0.5">{o.desc.split("、")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 创作模式切换: AI 自动规划 vs 自定义大纲 */}
      <div>
        <div className="mono-label mb-2">MODE / 创作模式</div>
        <div className="grid grid-cols-3 gap-2">
          {([
            ["topic", "主题生成"],
            ["text", "粘贴文案 → AI"],
            ["json", "JSON 大纲"],
          ] as const).map(([mode, label]) => (
            <button key={mode} type="button" aria-pressed={props.inputMode === mode}
              onClick={() => set({ inputMode: mode })}
              className={`rounded-md border px-3 py-2 text-center text-xs transition ${props.inputMode === mode
                ? "border-gold bg-gold-soft text-gold font-medium"
                : "border-line bg-elev text-ink-dim hover:border-line-strong hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 主题 / 自定义大纲内容 */}
      {props.inputMode !== "json" ? (
        <>
          {props.inputMode === "text" ? (
            <Field label="SOURCE TEXT / 粘贴原始文案">
              <textarea aria-label="原始文案" className={`${inputCls} min-h-48 resize-y`}
                value={props.sourceText} maxLength={MAX_SOURCE_TEXT_LENGTH}
                onChange={(e) => set({ sourceText: e.target.value })}
                placeholder="粘贴文章、会议笔记、Markdown、列表或表格文本，无需转换为 JSON。AI 会整理为大纲并生成 PPTX。" />
              <span className="mt-1 block text-xs text-ink-mute">{props.sourceText.length.toLocaleString()} / 20,000 字符 · 文案会发送给所选模型。生成后可下载 PPTX 和 Markdown 大纲。</span>
            </Field>
          ) : (
            <Field label="TOPIC / 主题">
              <textarea className={`${inputCls} min-h-20 resize-y`} value={props.topic}
                onChange={(e) => set({ topic: e.target.value })} placeholder="例如:AI 驱动的年度战略汇报" />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="AUDIENCE / 受众">
              <input
                className={inputCls}
                value={props.audience}
                onChange={(e) => set({ audience: e.target.value })}
                placeholder="管理层 / 产品团队"
              />
            </Field>
            <Field label="TONE / 语气">
              <input
                className={inputCls}
                value={props.tone}
                onChange={(e) => set({ tone: e.target.value })}
                placeholder="专业、清晰、简洁"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="SLIDES / 页数">
              <input
                type="number"
                min={3}
                max={20}
                className={inputCls}
                value={props.slideCount}
                onChange={(e) => set({ slideCount: Number(e.target.value) })}
              />
            </Field>
            <Field label="LANGUAGE / 语言">
              <select
                className={inputCls}
                value={props.language}
                onChange={(e) => set({ language: e.target.value as "zh-CN" | "en-US" })}
              >
                <option value="zh-CN">中文</option>
                <option value="en-US">English</option>
              </select>
            </Field>
            <Field label="FONTS / 字体">
              <select
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
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <Field label="CUSTOM OUTLINE JSON / 自定义大纲数据">
            <textarea
              className={`${inputCls} min-h-48 font-mono text-xs resize-y`}
              value={props.customOutlineJson}
              onChange={(e) => set({ customOutlineJson: e.target.value })}
              placeholder={`{\n  "title": "自定义商业方案",\n  "slides": [\n    { "type": "cover", "title": "项目规划", "subtitle": "面向全员" },\n    { "type": "kpiDashboard", "title": "关键业务指标", "items": [{ "label": "ARR", "value": "120M", "change": "+30%", "context": "同比" }] },\n    { "type": "closing", "title": "感谢聆听", "action": "推进落地" }\n  ]\n}`}
            />
          </Field>
          <div className="flex justify-between items-center text-[11px] text-ink-mute">
            <span>支持 23 种原生版式（cover, kpiDashboard, funnel, gantt, architectureStack 等）</span>
            <button
              type="button"
              onClick={() => {
                const sample = {
                  title: "自定义商业全景汇报",
                  slides: [
                    {
                      type: "cover",
                      title: "自定义商业全景汇报",
                      subtitle: "让结构与数据说话",
                      kicker: "CUSTOM DECK",
                    },
                    {
                      type: "executiveSummary",
                      title: "核心决策与建议",
                      decision: "聚焦核心场景\n全面推进矢量化架构",
                      evidence: ["提升排版可读性", "杜绝文字乱码溢出", "多端一致性导出"],
                      nextStep: "下周启动全面上线评审",
                    },
                    {
                      type: "statCallout",
                      title: "交付效率提升",
                      stat: "100%",
                      label: "原生矢量对象率",
                      takeaway: "纯原生矢量几何与文本，支持自由修改",
                      details: ["15 秒自动化生成", "零人工对齐成本"],
                    },
                    {
                      type: "closing",
                      title: "感谢关注与支持",
                      action: "立即下载可编辑 PPTX 文件",
                      contact: "GitHub: https://github.com/CacinieP/slide-recipes",
                    },
                  ],
                };
                set({ customOutlineJson: JSON.stringify(sample, null, 2) });
              }}
              className="text-gold hover:underline"
            >
              填入标准示例
            </button>
          </div>
        </div>
      )}

      {/* 4. 28 套合规色板 */}
      <PalettePicker value={props.paletteId} onChange={(paletteId) => set({ paletteId })} />

      {/* 5. 风格配方 */}
      <Field label="STYLE RECIPE / 风格">
        <div className="grid grid-cols-4 gap-2">
          {STYLES.map((s) => {
            const active = props.styleRecipe === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => set({ styleRecipe: s.id })}
                className={`rounded-md border px-2 py-2 text-center transition ${
                  active
                    ? "border-gold bg-gold-soft text-gold font-medium"
                    : "border-line bg-elev text-ink-dim hover:border-line-strong hover:text-ink"
                }`}
              >
                <div className="text-sm font-medium">{s.label}</div>
                <div className="mt-0.5 text-[10px] text-ink-mute">{s.desc}</div>
              </button>
            );
          })}
        </div>
      </Field>

      {/* 6. 内容偏好 */}
      {props.inputMode !== "json" && (
        <Field label="PREFERENCES / 内容偏好">
          <div className="flex gap-2">
            {([
              ["includeCode", "代码片段"],
              ["includeChart", "图表建议"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => set({ [key]: !props[key] } as Partial<Props>)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                  props[key]
                    ? "border-azure bg-blue-soft text-azure"
                    : "border-line bg-elev text-ink-dim hover:border-line-strong"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${props[key] ? "bg-azure" : "bg-ink-mute"}`}
                />
                {label}
              </button>
            ))}
          </div>
        </Field>
      )}
    </div>
  );
}
