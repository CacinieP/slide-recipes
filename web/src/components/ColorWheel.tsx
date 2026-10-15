"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { HUE_FAMILIES, getHueFamily } from "@/lib/color-utils";

interface Props {
  selectedHue: number | null;
  onHueChange: (hue: number | null) => void;
  title?: string;
  subtitle?: string;
  centerColor?: string;
  headerRight?: React.ReactNode;
}

export default function ColorWheel({
  selectedHue,
  onHueChange,
  title,
  subtitle,
  centerColor,
  headerRight,
}: Props) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 计算鼠标在圆环上的极坐标角度 (0° 在顶部 12 点钟方向顺时针旋转)
  const handleWheelEvent = useCallback(
    (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
      if (!wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let clientX = 0;
      let clientY = 0;
      if ("touches" in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const dx = clientX - centerX;
      const dy = clientY - centerY;

      // atan2 返回弧度 (-PI 到 PI)，顶部为 0°
      let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (deg < 0) deg += 360;
      deg = Math.round(deg) % 360;

      onHueChange(deg);
    },
    [onHueChange]
  );

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleWheelEvent(e);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleWheelEvent(e);
    const onMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, handleWheelEvent]);

  // 当前指针角度坐标（外径 64px，指针中心在 r=54px）
  const pointerAngleRad = selectedHue !== null ? ((selectedHue - 90) * Math.PI) / 180 : 0;
  const pointerR = 54;
  const pointerX = 64 + pointerR * Math.cos(pointerAngleRad);
  const pointerY = 64 + pointerR * Math.sin(pointerAngleRad);

  const currentFamily = selectedHue !== null ? getHueFamily(selectedHue) : null;

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-elev/40 p-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-ink">
          <span>{title || "🎯 色环定位"}</span>
          {selectedHue !== null ? (
            <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold border border-gold/30">
              {currentFamily?.emoji} {currentFamily?.name} · {selectedHue}°
            </span>
          ) : (
            <span className="text-[10px] text-ink-mute">{subtitle || "点击色环或色系标签快速定位"}</span>
          )}
        </div>
        <div>
          {headerRight !== undefined ? (
            headerRight
          ) : (
            selectedHue !== null && (
              <button
                type="button"
                onClick={() => onHueChange(null)}
                className="text-[10px] text-ink-mute hover:text-gold transition hover:underline"
              >
                显示全部色板
              </button>
            )
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-1">
        {/* 交互式色相圆环 */}
        <div
          ref={wheelRef}
          onMouseDown={onMouseDown}
          onTouchStart={handleWheelEvent}
          onTouchMove={handleWheelEvent}
          className="relative h-32 w-32 shrink-0 cursor-crosshair select-none touch-none rounded-full"
          title="在色环上拖动或点击选择色相"
        >
          {/* 360° 色相环背景 */}
          <div
            className="h-full w-full rounded-full shadow-inner"
            style={{
              background:
                "conic-gradient(from 0deg, #EF4444 0deg, #F97316 30deg, #EAB308 60deg, #22C55E 120deg, #06B6D4 180deg, #3B82F6 220deg, #8B5CF6 270deg, #EC4899 320deg, #EF4444 360deg)",
            }}
          />

          {/* 圆环中空遮罩 */}
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-elev shadow-md border border-line/50">
            {centerColor ? (
              <>
                <div
                  className="h-5 w-5 rounded-full shadow-xs border border-white/60 mb-0.5"
                  style={{
                    backgroundColor: centerColor.startsWith("#") ? centerColor : `#${centerColor}`,
                  }}
                />
                <span className="text-[10px] font-mono font-bold text-ink leading-none">
                  {selectedHue !== null ? `${selectedHue}°` : centerColor}
                </span>
              </>
            ) : selectedHue !== null ? (
              <>
                <div
                  className="h-5 w-5 rounded-full shadow-xs border border-white/60 mb-0.5"
                  style={{ backgroundColor: `hsl(${selectedHue}, 80%, 48%)` }}
                />
                <span className="text-[10px] font-mono font-bold text-ink leading-none">
                  {selectedHue}°
                </span>
              </>
            ) : (
              <span className="text-[10px] text-ink-mute font-mono">全色相</span>
            )}
          </div>

          {/* 选中色相在环上的指示光标 */}
          {selectedHue !== null && (
            <div
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/40 shadow-md ring-1 ring-black/20"
              style={{
                left: `${pointerX}px`,
                top: `${pointerY}px`,
                backgroundColor: `hsl(${selectedHue}, 90%, 50%)`,
              }}
            />
          )}
        </div>

        {/* 常用色系快速直达标签 */}
        <div className="flex flex-1 flex-col gap-1 max-w-[200px]">
          <div className="text-[10px] text-ink-mute mb-0.5">8 大色系快选：</div>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            {HUE_FAMILIES.map((fam) => {
              const active =
                selectedHue !== null &&
                currentFamily?.id === fam.id;
              return (
                <button
                  key={fam.id}
                  type="button"
                  onClick={() => onHueChange(fam.hue)}
                  className={`flex items-center gap-1 rounded px-1.5 py-1 text-left transition border ${
                    active
                      ? "border-gold bg-gold-soft font-medium text-gold"
                      : "border-line bg-elev/60 text-ink-dim hover:border-line-strong hover:text-ink"
                  }`}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: fam.color }}
                  />
                  <span className="truncate text-[10px]">{fam.name.slice(0, 2)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
