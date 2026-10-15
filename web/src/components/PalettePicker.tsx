"use client";

import { useState, useMemo } from "react";
import { PALETTES, DEFAULT_PALETTE_ID, resolveTheme } from "@/lib/palettes";
import type { Theme } from "@/lib/types";
import ColorWheel from "./ColorWheel";
import {
  getPaletteDominantHue,
  hueAngleDistance,
  rotateHexHue,
  contrastRatio,
  hexToHsl,
} from "@/lib/color-utils";

interface Props {
  value: string;
  onChange: (id: string) => void;
  customTheme?: Theme;
  onCustomThemeChange?: (theme: Theme | undefined) => void;
}

export default function PalettePicker({
  value,
  onChange,
  customTheme,
  onCustomThemeChange,
}: Props) {
  const selectedPreset =
    PALETTES.find((p) => p.id === value) ??
    PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID)!;

  // 当前有效的主题色（若用户自定义修改过，则使用 customTheme，否则使用预设）
  const activeTheme: Theme = customTheme || selectedPreset.theme;

  // 色环选中的色相过滤 (null 表示显示全部)
  const [selectedHue, setSelectedHue] = useState<number | null>(null);

  // 是否展开微调面板
  const [showEditor, setShowEditor] = useState(false);

  // 根据当前色环选择的色相角度，计算各色板与该色相的距离
  const paletteHueMap = useMemo(() => {
    const map = new Map<string, number>();
    PALETTES.forEach((p) => {
      map.set(p.id, getPaletteDominantHue(p.theme));
    });
    return map;
  }, []);

  // 过滤后的色板列表（若未选色相则显示全部；若选了则匹配 ±36° 内的色系）
  const filteredPalettes = useMemo(() => {
    if (selectedHue === null) return PALETTES;
    return [...PALETTES].sort((a, b) => {
      const distA = hueAngleDistance(paletteHueMap.get(a.id) ?? 0, selectedHue);
      const distB = hueAngleDistance(paletteHueMap.get(b.id) ?? 0, selectedHue);
      return distA - distB;
    });
  }, [selectedHue, paletteHueMap]);

  // 当在色环上选择了色相时，自动联动匹配距离最近的预设色板
  const handleHueChange = (hue: number | null) => {
    setSelectedHue(hue);
    if (hue !== null) {
      let closestId = value;
      let minDistance = 999;
      PALETTES.forEach((p) => {
        const d = hueAngleDistance(paletteHueMap.get(p.id) ?? 0, hue);
        if (d < minDistance) {
          minDistance = d;
          closestId = p.id;
        }
      });
      if (closestId !== value) {
        onChange(closestId);
        if (onCustomThemeChange) onCustomThemeChange(undefined);
      }
    }
  };

  // 修改单个色槽
  const handleSlotChange = (slot: keyof Theme, newHex: string) => {
    const cleanHex = newHex.replace(/^#/, "").toUpperCase();
    const next: Theme = {
      ...activeTheme,
      [slot]: cleanHex,
    };
    if (onCustomThemeChange) {
      onCustomThemeChange(next);
    }
  };

  // 在色环上整体旋转色调
  const handleHueRotate = (delta: number) => {
    const next: Theme = {
      primary: rotateHexHue(selectedPreset.theme.primary, delta),
      secondary: rotateHexHue(selectedPreset.theme.secondary, delta),
      accent: rotateHexHue(selectedPreset.theme.accent, delta),
      light: rotateHexHue(selectedPreset.theme.light, delta),
      bg: rotateHexHue(selectedPreset.theme.bg, delta),
    };
    if (onCustomThemeChange) {
      onCustomThemeChange(next);
    }
  };

  // 重置回预设
  const handleReset = () => {
    if (onCustomThemeChange) {
      onCustomThemeChange(undefined);
    }
  };

  // 计算实时 WCAG 对比度指标
  const primaryBgRatio = contrastRatio(activeTheme.primary, activeTheme.bg);
  const accentBgRatio = contrastRatio(activeTheme.accent, activeTheme.bg);
  const isPrimaryPass = primaryBgRatio >= 4.5;
  const isAccentPass = accentBgRatio >= 4.5;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="mono-label">PALETTE / 调色板与色相系统</span>
        <button
          type="button"
          onClick={() => setShowEditor(!showEditor)}
          className={`rounded px-2 py-0.5 text-xs transition border ${
            showEditor || customTheme
              ? "border-gold bg-gold-soft text-gold font-medium"
              : "border-line text-ink-dim hover:text-ink hover:border-line-strong"
          }`}
        >
          {customTheme ? "🎨 自定义已生效 (编辑)" : showEditor ? "收起微调" : "🎨 微调与修改配色"}
        </button>
      </div>

      {/* 色环交互定位模块 */}
      <ColorWheel selectedHue={selectedHue} onHueChange={handleHueChange} />

      {/* 当前选中的色板卡片 */}
      <div className="rounded-md border border-line bg-elev px-3.5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">{selectedPreset.name}</span>
            {customTheme && (
              <span className="rounded bg-gold/20 px-1.5 py-0.2 text-[10px] font-medium text-gold border border-gold/40">
                自定义微调中
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-ink-mute">ID: {value}</span>
        </div>
        <div className="mt-1 text-xs text-ink-dim">{selectedPreset.useCases}</div>

        {/* 5 个关键语义色槽预览 */}
        <div className="mt-3 flex gap-1.5">
          {(["primary", "secondary", "accent", "light", "bg"] as const).map((k) => (
            <div key={k} className="flex-1">
              <div
                className="h-7 w-full rounded-sm border border-line/80 shadow-xs transition hover:scale-105"
                style={{ background: `#${activeTheme[k]}` }}
                title={`${k}: #${activeTheme[k]}`}
              />
              <div className="mono-label mt-1 text-center" style={{ fontSize: 9 }}>
                {k.slice(0, 3)}
              </div>
              <div className="text-[9px] font-mono text-center text-ink-mute truncate">
                #{activeTheme[k]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 展开的自定义微调与色相旋转面板 */}
      {showEditor && (
        <div className="flex flex-col gap-3 rounded-lg border border-gold/40 bg-gold-soft/20 p-3.5">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="text-xs font-semibold text-ink">🛠️ 配色微调与 WCAG 健康度监测</span>
            {customTheme && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-amber-400 hover:underline"
              >
                ↺ 恢复当前预设
              </button>
            )}
          </div>

          {/* 1. 五个色槽精细化拾色器 */}
          <div>
            <div className="text-[11px] text-ink-dim mb-1.5">1. 点击独立色槽修改颜色：</div>
            <div className="grid grid-cols-5 gap-2">
              {(
                [
                  ["primary", "正文字/图表"],
                  ["secondary", "弱化文本"],
                  ["accent", "核心强调"],
                  ["light", "浅色底衬"],
                  ["bg", "页面底板"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex flex-col items-center gap-1 rounded bg-elev/70 p-1.5 border border-line">
                  <span className="text-[10px] text-ink-mute">{label}</span>
                  <div className="relative h-7 w-7 rounded border border-line overflow-hidden cursor-pointer shadow-xs">
                    <input
                      type="color"
                      value={`#${activeTheme[key]}`}
                      onChange={(e) => handleSlotChange(key, e.target.value)}
                      className="absolute -inset-2 h-12 w-12 cursor-pointer opacity-0"
                      title={`点击修改 ${label}`}
                    />
                    <div
                      className="h-full w-full"
                      style={{ backgroundColor: `#${activeTheme[key]}` }}
                    />
                  </div>
                  <input
                    type="text"
                    value={activeTheme[key]}
                    maxLength={6}
                    onChange={(e) => handleSlotChange(key, e.target.value)}
                    className="w-full text-center text-[10px] font-mono rounded border border-line bg-base px-1 py-0.5 text-ink"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 2. 整套色相旋转滑块 */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-ink-dim mb-1">
              <span>2. 全局色调色相旋转 (保持对比度阶梯)：</span>
              <span className="font-mono text-[10px] text-gold">旋转角度</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-ink-mute">-180°</span>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                defaultValue="0"
                onChange={(e) => handleHueRotate(Number(e.target.value))}
                className="flex-1 accent-gold cursor-pointer"
              />
              <span className="text-[10px] font-mono text-ink-mute">+180°</span>
            </div>
          </div>

          {/* 3. 实时对比度校验 */}
          <div className="flex items-center justify-between rounded bg-elev/80 px-2.5 py-1.5 text-[11px] border border-line">
            <span className="text-ink-dim">WCAG 2.1 对比度：</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-ink-mute">正文/底板:</span>
                <span className={`font-mono font-medium ${isPrimaryPass ? "text-emerald-400" : "text-amber-400"}`}>
                  {primaryBgRatio}:1 {isPrimaryPass ? "✅" : "⚠️"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-ink-mute">强调/底板:</span>
                <span className={`font-mono font-medium ${isAccentPass ? "text-emerald-400" : "text-amber-400"}`}>
                  {accentBgRatio}:1 {isAccentPass ? "✅" : "⚠️"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 色板网格（受色环过滤/重排影响） */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-ink-dim mb-1.5">
          <span>预设色板库（{filteredPalettes.length} 套）：</span>
          {selectedHue !== null && (
            <span className="text-[10px] text-gold font-mono">
              已按色相 {selectedHue}° 邻近度排序
            </span>
          )}
        </div>
        <div className="grid grid-cols-9 gap-1.5 max-h-48 overflow-y-auto p-0.5">
          {filteredPalettes.map((p) => {
            const isActive = p.id === value;
            const pHue = paletteHueMap.get(p.id) ?? 0;
            const isHueMatched = selectedHue !== null && hueAngleDistance(pHue, selectedHue) <= 35;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p.id);
                  if (onCustomThemeChange) onCustomThemeChange(undefined);
                }}
                title={`${p.name} (${pHue}°) — ${p.useCases}`}
                className={`group relative aspect-square overflow-hidden rounded-sm border transition ${
                  isActive
                    ? "border-gold ring-2 ring-gold scale-105 z-10 shadow-sm"
                    : isHueMatched
                    ? "border-amber-400/80 ring-1 ring-amber-400/40"
                    : "border-line hover:border-line-strong hover:scale-102"
                }`}
              >
                <div className="flex h-full flex-col">
                  <div className="flex-1" style={{ background: `#${p.theme.primary}` }} />
                  <div className="flex-1" style={{ background: `#${p.theme.accent}` }} />
                  <div className="flex-1" style={{ background: `#${p.theme.light}` }} />
                  <div className="flex-1" style={{ background: `#${p.theme.bg}` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
