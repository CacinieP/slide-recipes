"use client";

import { useState, useMemo, useEffect } from "react";
import { PALETTES, DEFAULT_PALETTE_ID } from "@/lib/palettes";
import type { Theme } from "@/lib/types";
import ColorWheel from "./ColorWheel";
import {
  getPaletteDominantHue,
  hueAngleDistance,
  rotateHexHue,
  setHexHue,
  adjustHexLightness,
  adjustHexSaturation,
  parseAnyColorToHex,
  contrastRatio,
  hexToHsl,
  HUE_FAMILIES,
} from "@/lib/color-utils";

interface Props {
  value: string;
  onChange: (id: string) => void;
  customTheme?: Theme;
  onCustomThemeChange?: (theme: Theme | undefined) => void;
}

const SLOTS: { key: keyof Theme; label: string; roleDesc: string }[] = [
  { key: "primary", label: "正文字/图表", roleDesc: "主标题、正文与核心图表深色基准" },
  { key: "secondary", label: "弱化文本", roleDesc: "次级说明、注释及辅助边框轴线" },
  { key: "accent", label: "核心强调", roleDesc: "关键行动点(CTA)、高亮图元与强调" },
  { key: "light", label: "浅色底衬", roleDesc: "卡片容器底衬、进度槽及对比背景" },
  { key: "bg", label: "页面底板", roleDesc: "幻灯片整页背景底色" },
];

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

  // 当前选中的色槽（默认选中核心强调色 accent）
  const [activeSlot, setActiveSlot] = useState<keyof Theme>("accent");

  // 色环模式: "slot" 调节选中色块色相 | "filter" 筛选预设色板库
  const [wheelMode, setWheelMode] = useState<"slot" | "filter">("slot");

  // 色环筛选预设时的选定色相 (null 表示显示全部)
  const [filterHue, setFilterHue] = useState<number | null>(null);

  // 输入框文字缓存
  const [slotInputText, setSlotInputText] = useState<string>(
    `#${activeTheme[activeSlot]}`
  );

  // 当 activeSlot 或 activeTheme 变化时同步更新输入框文字
  useEffect(() => {
    setSlotInputText(`#${activeTheme[activeSlot]}`);
  }, [activeSlot, activeTheme]);

  // 根据当前色环选择的色相角度，计算各色板与该色相的距离
  const paletteHueMap = useMemo(() => {
    const map = new Map<string, number>();
    PALETTES.forEach((p) => {
      map.set(p.id, getPaletteDominantHue(p.theme));
    });
    return map;
  }, []);

  // 过滤后的预设色板列表
  const filteredPalettes = useMemo(() => {
    if (filterHue === null) return PALETTES;
    return [...PALETTES].sort((a, b) => {
      const distA = hueAngleDistance(paletteHueMap.get(a.id) ?? 0, filterHue);
      const distB = hueAngleDistance(paletteHueMap.get(b.id) ?? 0, filterHue);
      return distA - distB;
    });
  }, [filterHue, paletteHueMap]);

  // 修改单个色槽的核心函数
  const handleSlotChange = (slot: keyof Theme, newHexOrInput: string) => {
    const cleanHex = parseAnyColorToHex(newHexOrInput);
    if (!cleanHex) return;
    const next: Theme = {
      ...activeTheme,
      [slot]: cleanHex,
    };
    if (onCustomThemeChange) {
      onCustomThemeChange(next);
    }
  };

  // 通过色环或色相角改变当前选中色块的色相
  const handleSlotHueChange = (hue: number | null) => {
    if (hue === null) return;
    const currentHex = activeTheme[activeSlot];
    const newHex = setHexHue(currentHex, hue);
    handleSlotChange(activeSlot, newHex);
  };

  // 快捷微调选中色槽的明度
  const handleAdjustLightness = (delta: number) => {
    const currentHex = activeTheme[activeSlot];
    const newHex = adjustHexLightness(currentHex, delta);
    handleSlotChange(activeSlot, newHex);
  };

  // 快捷微调选中色槽的饱和度
  const handleAdjustSaturation = (delta: number) => {
    const currentHex = activeTheme[activeSlot];
    const newHex = adjustHexSaturation(currentHex, delta);
    handleSlotChange(activeSlot, newHex);
  };

  // 快捷微调选中色槽的色相角度 (+/- 15°)
  const handleAdjustHueAngle = (delta: number) => {
    const currentHex = activeTheme[activeSlot];
    const newHex = rotateHexHue(currentHex, delta);
    handleSlotChange(activeSlot, newHex);
  };

  // 在色环上整体旋转整套色调
  const handleGlobalHueRotate = (delta: number) => {
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

  // 恢复单个色槽至预设值
  const handleResetSlot = () => {
    handleSlotChange(activeSlot, selectedPreset.theme[activeSlot]);
  };

  // 重置回当前预设
  const handleResetAll = () => {
    if (onCustomThemeChange) {
      onCustomThemeChange(undefined);
    }
  };

  // 计算当前选中色块的信息
  const activeSlotMeta = SLOTS.find((s) => s.key === activeSlot)!;
  const activeSlotHsl = hexToHsl(activeTheme[activeSlot]);
  const isSlotModified = activeTheme[activeSlot] !== selectedPreset.theme[activeSlot];

  // 计算实时 WCAG 对比度指标
  const primaryBgRatio = contrastRatio(activeTheme.primary, activeTheme.bg);
  const accentBgRatio = contrastRatio(activeTheme.accent, activeTheme.bg);
  const isPrimaryPass = primaryBgRatio >= 4.5;
  const isAccentPass = accentBgRatio >= 4.5;

  return (
    <div className="flex flex-col gap-3">
      {/* 顶部标题与恢复按钮 */}
      <div className="flex items-center justify-between">
        <span className="mono-label">PALETTE / 调色板与色相系统</span>
        <div className="flex items-center gap-2">
          {customTheme && (
            <button
              type="button"
              onClick={handleResetAll}
              className="rounded px-2 py-0.5 text-xs text-amber-400 hover:text-amber-300 hover:underline transition"
              title="放弃自定义修改，恢复为预设配色"
            >
              ↺ 恢复整套预设
            </button>
          )}
        </div>
      </div>

      {/* 色环模式切换栏 */}
      <div className="flex items-center justify-between rounded-md bg-elev p-1 border border-line text-xs">
        <button
          type="button"
          onClick={() => setWheelMode("slot")}
          className={`flex-1 rounded py-1 px-2 text-center font-medium transition ${
            wheelMode === "slot"
              ? "bg-gold/20 text-gold shadow-xs border border-gold/40"
              : "text-ink-mute hover:text-ink"
          }`}
        >
          🎯 调节选中色块色相 ({activeSlotMeta.label})
        </button>
        <button
          type="button"
          onClick={() => setWheelMode("filter")}
          className={`flex-1 rounded py-1 px-2 text-center font-medium transition ${
            wheelMode === "filter"
              ? "bg-gold/20 text-gold shadow-xs border border-gold/40"
              : "text-ink-mute hover:text-ink"
          }`}
        >
          🔍 筛选预设色板库 ({filteredPalettes.length} 套)
        </button>
      </div>

      {/* 交互式色相环 */}
      {wheelMode === "slot" ? (
        <ColorWheel
          selectedHue={activeSlotHsl.h}
          onHueChange={handleSlotHueChange}
          centerColor={`#${activeTheme[activeSlot]}`}
          title={`🎯 色环微调: 【${activeSlotMeta.label}】`}
          subtitle="拖动或点击色环，实时改变当前选中色块的颜色"
          headerRight={
            <span className="text-[10px] font-mono text-ink-mute">
              H:{activeSlotHsl.h}° S:{activeSlotHsl.s}% L:{activeSlotHsl.l}%
            </span>
          }
        />
      ) : (
        <ColorWheel
          selectedHue={filterHue}
          onHueChange={(hue) => {
            setFilterHue(hue);
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
          }}
          title="🔍 色环定位预设"
          subtitle="点击色环或色系标签快速定位色板"
          headerRight={
            filterHue !== null ? (
              <button
                type="button"
                onClick={() => setFilterHue(null)}
                className="text-[10px] text-ink-mute hover:text-gold transition hover:underline"
              >
                显示全部
              </button>
            ) : undefined
          }
        />
      )}

      {/* 当前选中的色板卡片与 5 色槽选择修改区域 */}
      <div className="rounded-md border border-line bg-elev px-3.5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink">{selectedPreset.name}</span>
            {customTheme && (
              <span className="rounded bg-gold/20 px-1.5 py-0.2 text-[10px] font-medium text-gold border border-gold/40">
                已自定义修改
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-ink-mute">预设 ID: {value}</span>
        </div>
        <div className="mt-1 text-xs text-ink-dim">{selectedPreset.useCases}</div>

        {/* 5 个关键语义色槽：点击即可选中并修改颜色 */}
        <div className="mt-3">
          <div className="text-[11px] text-ink-dim mb-1 flex items-center justify-between">
            <span>👇 点击色块选择并直接修改色号：</span>
            <span className="text-[10px] text-gold font-mono">
              当前调整: {activeSlotMeta.label}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {SLOTS.map((s) => {
              const isSelected = activeSlot === s.key;
              const isSlotDiff = activeTheme[s.key] !== selectedPreset.theme[s.key];
              const hexVal = activeTheme[s.key];

              return (
                <div
                  key={s.key}
                  onClick={() => setActiveSlot(s.key)}
                  className={`group relative flex flex-col items-center rounded-md border p-1.5 transition cursor-pointer ${
                    isSelected
                      ? "border-gold bg-gold-soft/30 ring-2 ring-gold/70 shadow-sm scale-102"
                      : "border-line bg-base/60 hover:border-line-strong hover:bg-elev"
                  }`}
                  title={`点击选中调节 ${s.label}`}
                >
                  {/* 色块本身（点击也可直接唤起原生拾色器） */}
                  <div className="relative h-8 w-full rounded overflow-hidden shadow-xs border border-black/10">
                    <input
                      type="color"
                      value={`#${hexVal.toLowerCase()}`}
                      onChange={(e) => handleSlotChange(s.key, e.target.value)}
                      className="absolute -inset-2 h-14 w-full cursor-pointer opacity-0"
                      title={`点击为 ${s.label} 取色`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlot(s.key);
                      }}
                    />
                    <div
                      className="h-full w-full transition group-hover:scale-105"
                      style={{ backgroundColor: `#${hexVal}` }}
                    />
                  </div>

                  {/* 语义角色名 */}
                  <div
                    className={`mt-1.5 text-center text-[10px] font-medium truncate w-full ${
                      isSelected ? "text-gold font-bold" : "text-ink-mute"
                    }`}
                  >
                    {s.label}
                  </div>

                  {/* 色号显示 */}
                  <div className="text-[9px] font-mono text-center text-ink mt-0.5">
                    #{hexVal}
                  </div>

                  {/* 自定义微调圆点标识 */}
                  {isSlotDiff && (
                    <span
                      className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-gold"
                      title="已微调"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 正在选中的色块精细调节条 */}
        <div className="mt-3 rounded-lg border border-gold/30 bg-gold-soft/15 p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-ink">
                🎯 当前选中: <span className="text-gold">{activeSlotMeta.label}</span> ({activeSlot})
              </span>
              <span className="text-[10px] text-ink-mute hidden sm:inline">
                · {activeSlotMeta.roleDesc}
              </span>
            </div>
            {isSlotModified && (
              <button
                type="button"
                onClick={handleResetSlot}
                className="text-[10px] text-amber-400 hover:underline"
              >
                ↺ 恢复为 #{selectedPreset.theme[activeSlot]}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 原生拾色器按钮 */}
            <div className="relative flex items-center gap-1.5 rounded border border-line bg-base px-2 py-1 shadow-xs cursor-pointer">
              <div
                className="h-4 w-4 rounded-full border border-black/20 shadow-xs"
                style={{ backgroundColor: `#${activeTheme[activeSlot]}` }}
              />
              <span className="text-xs text-ink font-medium">拾色器</span>
              <input
                type="color"
                value={`#${activeTheme[activeSlot].toLowerCase()}`}
                onChange={(e) => handleSlotChange(activeSlot, e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                title="打开原生拾色器"
              />
            </div>

            {/* 色号直接输入（支持 HEX、#HEX、rgb(r,g,b)） */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-ink-mute">色号:</span>
              <input
                type="text"
                value={slotInputText}
                onChange={(e) => {
                  const val = e.target.value;
                  setSlotInputText(val);
                  const parsed = parseAnyColorToHex(val);
                  if (parsed) {
                    handleSlotChange(activeSlot, parsed);
                  }
                }}
                placeholder="#0A2540 或 rgb(10,37,64)"
                className="w-28 rounded border border-line bg-base px-1.5 py-1 text-center font-mono text-xs text-ink transition focus:border-gold focus:outline-none"
              />
            </div>

            {/* 快速明度与微调按钮 */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => handleAdjustLightness(-8)}
                className="rounded border border-line bg-base px-1.5 py-0.5 text-[10px] text-ink-dim hover:text-ink hover:border-line-strong transition"
                title="降低明度 (变深)"
              >
                暗 -8%
              </button>
              <button
                type="button"
                onClick={() => handleAdjustLightness(8)}
                className="rounded border border-line bg-base px-1.5 py-0.5 text-[10px] text-ink-dim hover:text-ink hover:border-line-strong transition"
                title="提高明度 (变浅)"
              >
                亮 +8%
              </button>
              <button
                type="button"
                onClick={() => handleAdjustSaturation(12)}
                className="rounded border border-line bg-base px-1.5 py-0.5 text-[10px] text-ink-dim hover:text-ink hover:border-line-strong transition"
                title="增加饱和度"
              >
                鲜艳 +
              </button>
              <button
                type="button"
                onClick={() => handleAdjustHueAngle(15)}
                className="rounded border border-line bg-base px-1.5 py-0.5 text-[10px] text-ink-dim hover:text-ink hover:border-line-strong transition"
                title="色相顺时针微调 15°"
              >
                色相 +15°
              </button>
            </div>
          </div>
        </div>

        {/* WCAG 对比度指标与全局色相旋转 */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2 text-[11px]">
          <div className="flex items-center gap-3">
            <span className="text-ink-mute">WCAG 对比度:</span>
            <span
              className={`font-mono font-medium ${
                isPrimaryPass ? "text-emerald-400" : "text-amber-400"
              }`}
              title="主文字与底板对比度 (标准 ≥4.5:1)"
            >
              正文/底板 {primaryBgRatio}:1 {isPrimaryPass ? "✅" : "⚠️"}
            </span>
            <span
              className={`font-mono font-medium ${
                isAccentPass ? "text-emerald-400" : "text-amber-400"
              }`}
              title="强调色与底板对比度 (标准 ≥4.5:1)"
            >
              强调/底板 {accentBgRatio}:1 {isAccentPass ? "✅" : "⚠️"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-ink-mute">整套旋转:</span>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              defaultValue="0"
              onChange={(e) => handleGlobalHueRotate(Number(e.target.value))}
              className="w-20 accent-gold cursor-pointer"
              title="全局旋转整套配色色相"
            />
          </div>
        </div>
      </div>

      {/* 预设色板库（28 套商业合规色板） */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-ink-dim mb-1.5">
          <span>商业语义色板库（{filteredPalettes.length} 套）：</span>
          {filterHue !== null && (
            <span className="text-[10px] text-gold font-mono">
              已按色相 {filterHue}° 邻近度排序
            </span>
          )}
        </div>
        <div className="grid grid-cols-9 gap-1.5 max-h-48 overflow-y-auto p-0.5">
          {filteredPalettes.map((p) => {
            const isActive = p.id === value;
            const pHue = paletteHueMap.get(p.id) ?? 0;
            const isHueMatched = filterHue !== null && hueAngleDistance(pHue, filterHue) <= 35;
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
