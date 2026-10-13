"use client";

import { useState } from "react";
import type { FontPairId, ModelConfig, StyleRecipe } from "@/lib/types";
import { FONT_PAIRS } from "@/lib/palettes";
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

  return (
    <div className="flex flex-col gap-5">
      {/* 1. 模型服务配置三要素 */}
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
          <div className="flex flex-col gap-2.5">
            <div>
              <div className="text-[11px] text-ink-dim mb-1">API Base URL (兼容 OpenAI 规范)</div>
              <input
                className={inputCls}
                value={props.modelConfig.baseUrl}
                onChange={(e) =>
                  set({
                    modelConfig: { ...props.modelConfig, baseUrl: e.target.value },
                  })
                }
                placeholder="https://api.modelbest.cn/v1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="text-[11px] text-ink-dim mb-1">Model Name (模型名称)</div>
                <input
                  className={inputCls}
                  value={props.modelConfig.model}
                  onChange={(e) =>
                    set({
                      modelConfig: { ...props.modelConfig, model: e.target.value },
                    })
                  }
                  placeholder="MiniCPM-V-4.7-35B-A3B"
                />
              </div>

              <div>
                <div className="text-[11px] text-ink-dim mb-1">API Key (仅保存在本地浏览器)</div>
                <input
                  type="password"
                  className={inputCls}
                  value={props.modelConfig.apiKey}
                  onChange={(e) =>
                    set({
                      modelConfig: { ...props.modelConfig, apiKey: e.target.value },
                    })
                  }
                  placeholder="sk-..."
                />
              </div>
            </div>
            <div className="text-[10px] text-ink-mute">
              * 纯前端安全运行：API Key 仅在浏览器发起调用，不会上传到任何第三方后端。
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
                    ? "border-gold bg-gold-soft text-gold"
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
