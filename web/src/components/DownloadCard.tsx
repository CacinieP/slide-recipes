"use client";

import { useSpotlight, useCountUp } from "@/lib/motion";
import { IconDownload, IconFileText, IconRefresh } from "./icons";

interface Props {
  fileName: string;
  blobUrl: string;
  sizeKb: number;
  outlineUrl: string;
  outlineFileName: string;
  onReset: () => void;
}

export default function DownloadCard({ fileName, blobUrl, sizeKb, outlineUrl, outlineFileName, onReset }: Props) {
  const spotRef = useSpotlight<HTMLDivElement>();
  const animatedKb = useCountUp(sizeKb, 800);
  const shownKb = Math.round(animatedKb);
  return (
    <div
      ref={spotRef}
      className="card spotlight border-success/30 p-4"
      style={{ background: "linear-gradient(180deg, var(--success-soft), var(--surface) 65%)" }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-success/30 bg-elev text-success shadow-xs">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path className="draw-check" d="m4.5 12.5 5 5 10-11" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-wide text-success">渲染完成</span>
            <span className="text-[10px] text-ink-mute">原生可编辑对象</span>
          </div>
          <div className="truncate text-sm font-medium text-ink">{fileName}</div>
          <div className="mt-0.5 font-mono text-[10px] text-ink-mute">
            .pptx · {shownKb >= 1024 ? `${(shownKb / 1024).toFixed(1)} MB` : `${shownKb} KB`}
          </div>
        </div>
        <a
          href={blobUrl}
          download={fileName}
          className="shine press inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[var(--ultra-deep)]"
        >
          <IconDownload size={14} />
          下载 PPTX
        </a>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
        <a href={outlineUrl} download={outlineFileName} className="press inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:underline">
          <IconFileText size={13} />
          下载 Markdown 大纲 (.md)
        </a>
        <button
          type="button"
          onClick={onReset}
          className="press inline-flex items-center gap-1 text-[11px] text-ink-mute hover:text-ink"
        >
          <IconRefresh size={11} />
          重新开始
        </button>
      </div>
    </div>
  );
}