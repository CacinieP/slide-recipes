import type { Theme } from "./types";

/**
 * 将 6 位十六进制颜色（带或不带 #）转为 HSL
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace(/^#/, "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return {
    h: Math.round(h) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * 将 HSL（h: 0-360, s: 0-100, l: 0-100）转为 6 位十六进制（大写，不带 #）
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round((n + m) * 255)))
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();

  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 保持明度与饱和度不变，在色环上将色相旋转指定度数
 */
export function rotateHexHue(hex: string, deltaDegrees: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h + deltaDegrees, hsl.s, hsl.l);
}

/**
 * 直接设置色相为指定目标角度 (0-360)
 * 若原颜色为中性灰（饱和度极低），自动补齐基础饱和度使色相能够显现
 */
export function setHexHue(hex: string, targetHue: number): string {
  const hsl = hexToHsl(hex);
  const s = hsl.s < 10 ? 60 : hsl.s;
  const l = hsl.l < 10 ? 25 : hsl.l > 95 ? 85 : hsl.l;
  return hslToHex(targetHue, s, l);
}

/**
 * 调整明度 (+/- 百分比)
 */
export function adjustHexLightness(hex: string, deltaPercent: number): string {
  const hsl = hexToHsl(hex);
  const newL = Math.max(5, Math.min(95, hsl.l + deltaPercent));
  return hslToHex(hsl.h, hsl.s, newL);
}

/**
 * 调整饱和度 (+/- 百分比)
 */
export function adjustHexSaturation(hex: string, deltaPercent: number): string {
  const hsl = hexToHsl(hex);
  const newS = Math.max(0, Math.min(100, hsl.s + deltaPercent));
  return hslToHex(hsl.h, newS, hsl.l);
}

/**
 * 解析用户输入的任意颜色格式（HEX、#HEX、3位HEX、rgb(r,g,b)、r,g,b）
 * 成功返回 6 位大写 HEX 字符串（无 #），失败返回 null
 */
export function parseAnyColorToHex(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // 1. rgb(r, g, b)
  const rgbMatch = trimmed.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (rgbMatch) {
    const [r, g, b] = [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
    }
    return null;
  }

  // 2. r, g, b
  const commaMatch = trimmed.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
  if (commaMatch) {
    const [r, g, b] = [Number(commaMatch[1]), Number(commaMatch[2]), Number(commaMatch[3])];
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
    }
    return null;
  }

  // 3. HEX
  const clean = trimmed.replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    return clean.split("").map((c) => c + c).join("").toUpperCase();
  }
  if (/^[0-9a-f]{6}$/i.test(clean)) {
    return clean.toUpperCase();
  }

  return null;
}

/**
 * 计算相对亮度 (WCAG 2.1)
 */
export function luminance(hex: string): number {
  const clean = hex.replace(/^#/, "");
  const rgb = [0, 2, 4].map((i) => {
    const c = parseInt(clean.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * 计算两色的对比度比率 (1:1 到 21:1)
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * 规范化 8 大主要色相家族定义
 */
export interface HueFamily {
  id: string;
  name: string;
  hue: number;
  range: [number, number];
  color: string;
  emoji: string;
}

export const HUE_FAMILIES: HueFamily[] = [
  { id: "red", name: "绯红赤炎", hue: 0, range: [345, 15], color: "#EF4444", emoji: "🔴" },
  { id: "orange", name: "暖橙红褐", hue: 30, range: [15, 50], color: "#F97316", emoji: "🟠" },
  { id: "amber", name: "琥珀金黄", hue: 55, range: [50, 75], color: "#EAB308", emoji: "🟡" },
  { id: "green", name: "竹青苍翠", hue: 120, range: [75, 165], color: "#22C55E", emoji: "🟢" },
  { id: "cyan", name: "青碧海浪", hue: 180, range: [165, 205], color: "#06B6D4", emoji: "🌐" },
  { id: "blue", name: "经典钴蓝", hue: 220, range: [205, 255], color: "#3B82F6", emoji: "🔷" },
  { id: "violet", name: "极光紫藤", hue: 280, range: [255, 315], color: "#8B5CF6", emoji: "🟣" },
  { id: "rose", name: "洋红桃粉", hue: 330, range: [315, 345], color: "#EC4899", emoji: "🌸" },
];

/**
 * 判断色相角度是否在指定区间（支持跨越 0° 的区间，如 345° 到 15°）
 */
export function isHueInRange(hue: number, start: number, end: number): boolean {
  hue = ((hue % 360) + 360) % 360;
  if (start <= end) {
    return hue >= start && hue <= end;
  }
  return hue >= start || hue <= end;
}

/**
 * 获取色相所属的色系家族名称
 */
export function getHueFamily(hue: number): HueFamily {
  const normalized = ((hue % 360) + 360) % 360;
  const match = HUE_FAMILIES.find((f) => isHueInRange(normalized, f.range[0], f.range[1]));
  return match || HUE_FAMILIES[0];
}

/**
 * 获取色板的主导色相（取其核心强调色 accent，若饱和度极低则取 primary）
 */
export function getPaletteDominantHue(theme: Theme): number {
  const accentHsl = hexToHsl(theme.accent);
  if (accentHsl.s >= 15) return accentHsl.h;
  const primaryHsl = hexToHsl(theme.primary);
  return primaryHsl.h;
}

/**
 * 计算两个色相之间的最小角距离 (0° - 180°)
 */
export function hueAngleDistance(a: number, b: number): number {
  const diff = Math.abs((a % 360) - (b % 360));
  return Math.min(diff, 360 - diff);
}
