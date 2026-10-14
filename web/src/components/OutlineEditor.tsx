"use client";

import type { DeckPlan, SlidePlan } from "@/lib/types";
import { OUTLINE_FIELD_LABELS } from "@/lib/outline-markdown";

const inputClass = "w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none";
const buttonClass = "rounded border border-line px-2 py-1 text-xs text-ink-dim hover:border-gold disabled:opacity-40";

function blankLike(value: unknown): unknown {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, blankLike(item)]));
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return "";
}

function ValueEditor({ value, label, onChange }: { value: unknown; label: string; onChange: (value: unknown) => void }) {
  if (Array.isArray(value)) return (
    <fieldset className="space-y-2 rounded border border-line p-2">
      <legend className="px-1 text-xs text-ink-dim">{label}</legend>
      {value.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="min-w-0 flex-1"><ValueEditor value={item} label={`${label} ${index + 1}`}
            onChange={next => onChange(value.map((old, i) => i === index ? next : old))} /></div>
          <button type="button" className={buttonClass} disabled={value.length === 1 && typeof item === "object" && item !== null} aria-label={`删除${label} ${index + 1}`}
            onClick={() => onChange(value.filter((_, i) => i !== index))}>删除</button>
        </div>
      ))}
      <button type="button" className={buttonClass} onClick={() => onChange([...value, blankLike(value[0])])}>添加{label}</button>
    </fieldset>
  );
  if (value && typeof value === "object") return (
    <fieldset className="space-y-2 rounded border border-line p-2">
      <legend className="px-1 text-xs text-ink-dim">{label}</legend>
      {Object.entries(value).map(([key, item]) => <ValueEditor key={key} value={item}
        label={`${label} · ${OUTLINE_FIELD_LABELS[key] || key}`}
        onChange={next => onChange({ ...value, [key]: next })} />)}
    </fieldset>
  );
  if (typeof value === "boolean") return (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value}
      onChange={event => onChange(event.target.checked)} />{label}</label>
  );
  return (
    <label className="block space-y-1">
      <span className="text-xs text-ink-dim">{label}</span>
      {typeof value === "number" ? <input aria-label={label} className={inputClass} type="number" value={value}
        onChange={event => onChange(Number(event.target.value))} /> :
        <textarea aria-label={label} className={`${inputClass} min-h-20 resize-y`} value={String(value ?? "")}
          onChange={event => onChange(event.target.value)} />}
    </label>
  );
}

export default function OutlineEditor({ plan, isLoading, dirty, onChange, onExport }: {
  plan: DeckPlan; isLoading: boolean; dirty: boolean;
  onChange: (plan: DeckPlan) => void; onExport: () => void;
}) {
  const updateSlide = (index: number, next: SlidePlan) => onChange({ ...plan, slides: plan.slides.map((slide, i) => i === index ? next : slide) });
  const moveSlide = (index: number, offset: number) => {
    const slides = [...plan.slides];
    [slides[index], slides[index + offset]] = [slides[index + offset], slides[index]];
    onChange({ ...plan, slides });
  };
  return (
    <section className="rounded-lg border border-line bg-elev p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-ink">编辑大纲</h2>
        <button type="button" disabled={isLoading} onClick={onExport}
          className="rounded-md bg-gold px-3 py-2 text-xs font-semibold text-canvas disabled:opacity-40">
          {isLoading ? "正在导出…" : "按当前大纲导出 PPTX + MD"}
        </button>
      </div>
      <p className="mb-4 text-xs text-ink-mute">可修改标题、正文和数据，增删或调整页面顺序。修改后请重新导出，PPTX 与 Markdown 会同步更新；不再调用 AI。{dirty ? " 当前修改尚未导出。" : ""}</p>
      <fieldset disabled={isLoading} className="space-y-4">
        <label className="block space-y-1"><span className="text-xs text-ink-dim">演示文稿标题</span>
          <input aria-label="演示文稿标题" className={inputClass} value={plan.title}
            onChange={event => onChange({ ...plan, title: event.target.value })} /></label>
        {plan.slides.map((slide, index) => (
          <section key={index} className="space-y-3 rounded border border-line bg-canvas/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-ink-dim">第 {index + 1} 页 · {slide.type}</span>
              <div className="flex gap-1">
                <button type="button" className={buttonClass} disabled={index === 0} aria-label={`上移第 ${index + 1} 页`} onClick={() => moveSlide(index, -1)}>上移</button>
                <button type="button" className={buttonClass} disabled={index === plan.slides.length - 1} aria-label={`下移第 ${index + 1} 页`} onClick={() => moveSlide(index, 1)}>下移</button>
                <button type="button" className={buttonClass} disabled={plan.slides.length === 1} aria-label={`删除第 ${index + 1} 页`}
                  onClick={() => onChange({ ...plan, slides: plan.slides.filter((_, i) => i !== index) })}>删除页</button>
              </div>
            </div>
            <label className="block space-y-1"><span className="text-xs text-ink-dim">页面标题</span>
              <input aria-label={`第 ${index + 1} 页标题`} className={inputClass} value={slide.title}
                onChange={event => updateSlide(index, { ...slide, title: event.target.value })} /></label>
            {Object.entries(slide).filter(([key, value]) => value !== undefined && value !== null && !["type", "title", "layout"].includes(key)).map(([key, value]) => (
              <ValueEditor key={key} value={value} label={`第 ${index + 1} 页${OUTLINE_FIELD_LABELS[key] || key}`}
                onChange={next => updateSlide(index, { ...slide, [key]: next })} />
            ))}
          </section>
        ))}
        <button type="button" className={buttonClass} disabled={plan.slides.length >= 20} onClick={() => {
          const slides = [...plan.slides];
          slides.splice(slides.at(-1)?.type === "closing" ? slides.length - 1 : slides.length, 0,
            { type: "content", title: "新增页面", body: "请填写正文。" });
          onChange({ ...plan, slides });
        }}>添加正文页</button>
      </fieldset>
    </section>
  );
}
