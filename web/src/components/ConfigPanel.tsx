"use client";

import { useState } from "react";
import type { FontPairId, ModelConfig, StyleRecipe } from "@/lib/types";
import { FONT_PAIRS } from "@/lib/palettes";
import { PROVIDER_PRESETS } from "@/lib/providers";
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
  useCustomOutline: boolean;
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

  // 根据当前的 baseUrl 匹配预设渠道，若没有匹配到则是 custom
  const matchedPreset = PROVIDER_PRESETS.find(
    (p) => p.id !== "custom" && p.baseUrl === props.modelConfig.baseUrl,
  );
  const currentProviderId = matchedPreset ? matchedPreset.id : "custom";

  const handleSelectProvider = (presetId: string) => {
    const preset = PROVIDER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDetectedModels([]);
    setDetectStatus("");
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

    setIsDetecting(true);
    setDetectStatus("正在检测端点与模型列表...");
    setDetectedModels([]);

    try {
      const resp = await fetch(`${baseUrl}/models`, {
        method: "GET",
        headers: {
          Authorization: apiKey ? `Bearer ${apiKey}` : "",
          "Content-Type": "application/json",
        },
      });

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

      // 若当前填写的模型不在列表里，默认选中第一个
      if (!modelIds.includes(props.modelConfig.model)) {
        set({
          modelConfig: { ...props.modelConfig, model: modelIds[0] },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setDetectStatus(
          "⚠️ 跨域受阻 (CORS): 服务商接口未开放浏览器跨域。建议开启 Chrome 扩展「Allow CORS」直连，或直接在下方手动输入/保留预设模型。",
        );
      } else {
        setDetectStatus(
          `❌ 检测失败: ${msg}`,
        );
      }
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
            {/* 常见服务商快速切换按钮 */}
            <div>
              <div className="text-[11px] text-ink-dim mb-1.5">预设服务商快捷选择：</div>
              <div className="flex flex-wrap gap-1.5">
                {PROVIDER_PRESETS.map((p) => {
                  const active = currentProviderId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProvider(p.id)}
                      className={`rounded px-2.5 py-1 text-xs transition border ${
                        active
                          ? "border-gold bg-gold-soft text-gold font-medium"
                          : "border-line bg-elev text-ink-dim hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      {p.name.split(" ")[0]} ({p.badge})
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
                onChange={(e) =>
                  set({
                    modelConfig: { ...props.modelConfig, baseUrl: e.target.value },
                  })
                }
                placeholder="例如: https://api.modelbest.cn/v1 或 自定义端点"
              />
            </div>

            {/* API Key */}
            <div>
              <div className="text-[11px] text-ink-dim mb-1">2. API Key (仅保存在本地浏览器)</div>
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
                  title="根据输入的 Base URL 与 API Key 自动请求 /v1/models 探测可用模型"
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
              ) : (
                <input
                  className={inputCls}
                  value={props.modelConfig.model}
                  onChange={(e) =>
                    set({
                      modelConfig: { ...props.modelConfig, model: e.target.value },
                    })
                  }
                  placeholder="输入模型 ID，如 MiniCPM-V-4.7-35B-A3B, qwen-max..."
                />
              )}
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
                3. 点击「🔍 自动检测模型」按钮，系统即可自动拉取并选择 <code className="text-azure font-mono">MiniCPM-V-4.7-35B-A3B</code>！
              </p>
            </div>

            <div className="space-y-1 text-[10px] text-ink-mute">
              <div>
                * 填入任意兼容 OpenAI 的 Endpoint 和 API Key 后，点击「🔍 自动检测模型」即可自动获取端点支持的模型并选择填入。所有请求仅在本地浏览器发起，安全无泄漏。
              </div>
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-amber-300">
                <span className="font-semibold">💡 浏览器跨域 (CORS) 必读：</span>
                国内各大模型（如 ModelBest、阶跃、智谱等）官方 API 默认未开启浏览器跨域许可。若在 GitHub Pages 直连报错 Failed to fetch，推荐安装 Chrome / Edge 插件
                <a
                  href="https://chromewebstore.google.com/search/allow%20cors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-1 underline text-amber-200 hover:text-white"
                >
                  「Allow CORS」
                </a>
                并开启，即可免代理直连！或直接切换至下方「自定义大纲」模式，免 API 秒出 PPT。
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. 创作模式切换: AI 自动规划 vs 自定义大纲 */}
      <div>
        <div className="mono-label mb-2">MODE / 创作模式</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => set({ useCustomOutline: false })}
            className={`rounded-md border px-3 py-2 text-center text-xs transition ${
              !props.useCustomOutline
                ? "border-gold bg-gold-soft text-gold font-medium"
                : "border-line bg-elev text-ink-dim hover:border-line-strong hover:text-ink"
            }`}
          >
            AI 智能大纲生成
          </button>
          <button
            type="button"
            onClick={() => set({ useCustomOutline: true })}
            className={`rounded-md border px-3 py-2 text-center text-xs transition ${
              props.useCustomOutline
                ? "border-azure bg-blue-soft text-azure font-medium"
                : "border-line bg-elev text-ink-dim hover:border-line-strong hover:text-ink"
            }`}
          >
            自定义大纲与内容 (JSON)
          </button>
        </div>
      </div>

      {/* 3. 主题 / 自定义大纲内容 */}
      {!props.useCustomOutline ? (
        <>
          <Field label="TOPIC / 主题">
            <textarea
              className={`${inputCls} min-h-20 resize-y`}
              value={props.topic}
              onChange={(e) => set({ topic: e.target.value })}
              placeholder="例如:AI 驱动的年度战略汇报"
            />
          </Field>

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
      {!props.useCustomOutline && (
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
