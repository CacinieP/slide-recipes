"use client";

import type { DeckPlan, SlidePlan } from "@/lib/types";
import { OUTLINE_FIELD_LABELS } from "@/lib/outline-markdown";
import { trimDeckPlan } from "@/lib/prompt";
import { IconArrowUp, IconArrowDown, IconTrash, IconPlus, IconDownload, IconInfo } from "./icons";

const inputClass = "w-full rounded-lg border border-line bg-elev px-3 py-2 text-sm text-ink shadow-xs focus:border-gold focus:outline-none";
const buttonClass = "press inline-flex items-center gap-1 rounded-md border border-line bg-elev px-2 py-1 text-[11px] text-ink-dim shadow-xs hover:border-line-strong hover:text-ink disabled:opacity-40 disabled:shadow-none";

function blankLike(value: unknown): unknown {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, blankLike(item)]));
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return "";
}

function ValueEditor({ value, label, onChange }: { value: unknown; label: string; onChange: (value: unknown) => void }) {
  if (Array.isArray(value)) return (
    <fieldset className="space-y-2 rounded-lg border border-line bg-base/60 p-2.5">
      <legend className="px-1 text-[11px] font-medium text-ink-mute">{label}</legend>
      {value.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="min-w-0 flex-1"><ValueEditor value={item} label={`${label} ${index + 1}`}
            onChange={next => onChange(value.map((old, i) => i === index ? next : old))} /></div>
          <button type="button" className={buttonClass} disabled={value.length === 1 && typeof item === "object" && item !== null} aria-label={`删除${label} ${index + 1}`}
            onClick={() => onChange(value.filter((_, i) => i !== index))}><IconTrash size={11} />删除</button>
        </div>
      ))}
      <button type="button" className={buttonClass} onClick={() => onChange([...value, blankLike(value[0])])}><IconPlus size={11} />添加{label}</button>
    </fieldset>
  );
  if (value && typeof value === "object") return (
    <fieldset className="space-y-2 rounded-lg border border-line bg-base/60 p-2.5">
      <legend className="px-1 text-[11px] font-medium text-ink-mute">{label}</legend>
      {Object.entries(value).map(([key, item]) => <ValueEditor key={key} value={item}
        label={`${label} · ${OUTLINE_FIELD_LABELS[key] || key}`}
        onChange={next => onChange({ ...value, [key]: next })} />)}
    </fieldset>
  );
  if (typeof value === "boolean") return (
    <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={value}
      onChange={event => onChange(event.target.checked)} />{label}</label>
  );
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-ink-mute">{label}</span>
      {typeof value === "number" ? <input aria-label={label} className={inputClass} type="number" value={value}
        onChange={event => onChange(Number(event.target.value))} /> :
        <textarea aria-label={label} className={`${inputClass} min-h-16 resize-y`} value={String(value ?? "")}
          onChange={event => onChange(event.target.value)} />}
    </label>
  );
}

export default function OutlineEditor({ plan, isLoading, dirty, targetCount, onChange, onExport }: {
  plan: DeckPlan; isLoading: boolean; dirty: boolean; targetCount?: number;
  onChange: (plan: DeckPlan) => void; onExport: () => void;
}) {
  const updateSlide = (index: number, next: SlidePlan) => onChange({ ...plan, slides: plan.slides.map((slide, i) => i === index ? next : slide) });
  const moveSlide = (index: number, offset: number) => {
    const slides = [...plan.slides];
    [slides[index], slides[index + offset]] = [slides[index + offset], slides[index]];
    onChange({ ...plan, slides });
  };
  return (
    <section className="card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="section-no" aria-hidden="true">✎</span>
          <h2 className="text-[13px] font-semibold tracking-tight text-ink">编辑大纲</h2>
          <span className="rounded-full border border-line bg-base px-2 py-0.5 font-mono text-[10px] text-ink-dim">
            {plan.slides.length} 页
          </span>
          {dirty && <span className="inline-flex items-center gap-1 text-[10px] text-warning"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />未导出</span>}
        </div>
        <button type="button" disabled={isLoading} onClick={onExport}
          className="press inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--ultra-deep)] disabled:opacity-40">
          <IconDownload size={13} />
          {isLoading ? "正在导出…" : "按当前大纲导出 PPTX + MD"}
        </button>
      </div>

      {targetCount && plan.slides.length !== targetCount && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-ink">
          <span className="inline-flex items-center gap-1.5">
            <IconInfo size={13} className="shrink-0 text-warning" />
            模型完整生成了 <b>{plan.slides.length}</b> 页（原设定 {targetCount} 页），所有内容已完整保留。
          </span>
          {plan.slides.length > targetCount && (
            <button
              type="button"
              onClick={() => onChange(trimDeckPlan(plan, targetCount))}
              className="press rounded-md border border-warning/40 bg-elev px-2 py-0.5 font-medium text-warning hover:bg-warning-soft"
              title="保留首页封面与尾页结语，精简为原设定页数"
            >
              一键精简为 {targetCount} 页
            </button>
          )}
        </div>
      )}

      <p className="mb-4 text-[11px] leading-relaxed text-ink-mute">
        可修改标题、正文和数据，增删或调整页面顺序。修改后请重新导出，PPTX 与 Markdown 会同步更新，不再调用 AI。
      </p>
      <fieldset disabled={isLoading} className="space-y-3">
        <label className="block space-y-1"><span className="text-[11px] font-medium text-ink-mute">演示文稿标题</span>
          <input aria-label="演示文稿标题" className={`${inputClass} font-display text-base`} value={plan.title}
            onChange={event => onChange({ ...plan, title: event.target.value })} /></label>
        {plan.slides.map((slide, index) => (
          <section key={index} className="space-y-3 rounded-lg border border-line bg-base/50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-baseline gap-1.5 text-[11px] text-ink-mute">
                <span className="font-display text-xs italic text-verm">{String(index + 1).padStart(2, "0")}</span>
                {slide.type}
              </span>
              <div className="flex gap-1">
                <button type="button" className={buttonClass} disabled={index === 0} aria-label={`上移第 ${index + 1} 页`} onClick={() => moveSlide(index, -1)}><IconArrowUp size={11} />上移</button>
                <button type="button" className={buttonClass} disabled={index === plan.slides.length - 1} aria-label={`下移第 ${index + 1} 页`} onClick={() => moveSlide(index, 1)}><IconArrowDown size={11} />下移</button>
                <button type="button" className={`${buttonClass} hover:border-danger/50 hover:text-danger`} disabled={plan.slides.length === 1} aria-label={`删除第 ${index + 1} 页`}
                  onClick={() => onChange({ ...plan, slides: plan.slides.filter((_, i) => i !== index) })}><IconTrash size={11} />删除页</button>
              </div>
            </div>
            <label className="block space-y-1"><span className="text-[11px] font-medium text-ink-mute">页面标题</span>
              <input aria-label={`第 ${index + 1} 页标题`} className={inputClass} value={slide.title}
                onChange={event => updateSlide(index, { ...slide, title: event.target.value })} /></label>
            {Object.entries(slide).filter(([key, value]) => value !== undefined && value !== null && !["type", "title", "layout"].includes(key)).map(([key, value]) => (
              <ValueEditor key={key} value={value} label={`第 ${index + 1} 页${OUTLINE_FIELD_LABELS[key] || key}`}
                onChange={next => updateSlide(index, { ...slide, [key]: next })} />
            ))}
          </section>
        ))}
        <button type="button" className={buttonClass} disabled={plan.slides.length >= 35} onClick={() => {
          const slides = [...plan.slides];
          slides.splice(slides.at(-1)?.type === "closing" ? slides.length - 1 : slides.length, 0,
            { type: "content", title: "新增页面", body: "请填写正文。" });
          onChange({ ...plan, slides });
        }}><IconPlus size={11} />添加正文页</button>
      </fieldset>
    </section>
  );
}