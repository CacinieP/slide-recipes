/**
 * Studio icon set — 16/20px geometric strokes, currentColor.
 * Replaces emoji throughout the UI so the chrome reads as a designed tool.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...rest }: P, children: React.ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconArrowRight = (p: P) => base(p, <><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></>);
export const IconArrowLeft = (p: P) => base(p, <><path d="M20 12H4" /><path d="m10 6-6 6 6 6" /></>);
export const IconArrowUp = (p: P) => base(p, <><path d="M12 20V4" /><path d="m6 10 6-6 6 6" /></>);
export const IconArrowDown = (p: P) => base(p, <><path d="M12 4v16" /><path d="m6 14 6 6 6-6" /></>);
export const IconDownload = (p: P) => base(p, <><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M4 21h16" /></>);
export const IconShuffle = (p: P) => base(p, <><path d="M3 6h3.5c5.5 0 8.5 12 14 12H21" /><path d="M3 18h3.5c2.2 0 3.9-1.9 5.5-4.2M21 6h-1.5c-2.2 0-3.9 1.9-5.5 4.2" /><path d="m18 3 3 3-3 3" /><path d="m18 15 3 3-3 3" /></>);
export const IconKey = (p: P) => base(p, <><circle cx="8" cy="14" r="4.5" /><path d="m11.5 10.5 8-8" /><path d="M16 5l3 3" /><path d="M13.5 7.5l2.5 2.5" /></>);
export const IconServer = (p: P) => base(p, <><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01" /></>);
export const IconShield = (p: P) => base(p, <><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.5-4.3-1.5-7.5-4.9-7.5-9.5V6z" /><path d="m9 11.5 2.2 2.2L15.5 9" /></>);
export const IconLock = (p: P) => base(p, <><rect x="5" y="10.5" width="14" height="9.5" rx="1.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><path d="M12 14.5v2" /></>);
export const IconGlobe = (p: P) => base(p, <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.8 2.6 4 5.6 4 9s-1.2 6.4-4 9c-2.8-2.6-4-5.6-4-9s1.2-6.4 4-9z" /></>);
export const IconCheck = (p: P) => base(p, <path d="m4.5 12.5 5 5 10-11" />);
export const IconX = (p: P) => base(p, <><path d="M5 5l14 14" /><path d="M19 5 5 19" /></>);
export const IconPlus = (p: P) => base(p, <><path d="M12 5v14" /><path d="M5 12h14" /></>);
export const IconTrash = (p: P) => base(p, <><path d="M4 7h16" /><path d="M9 7V4.5h6V7" /><path d="M6.5 7l1 13h9l1-13" /><path d="M10 11v5M14 11v5" /></>);
export const IconFileText = (p: P) => base(p, <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h6" /></>);
export const IconSliders = (p: P) => base(p, <><path d="M4 8h10M18 8h2M4 16h2M10 16h10" /><circle cx="16" cy="8" r="2.2" /><circle cx="8" cy="16" r="2.2" /></>);
export const IconRefresh = (p: P) => base(p, <><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v4h-4" /></>);
export const IconExternal = (p: P) => base(p, <><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M19 14v6H5V6h6" /></>);
export const IconSearch = (p: P) => base(p, <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>);
export const IconTarget = (p: P) => base(p, <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" /></>);
export const IconLayers = (p: P) => base(p, <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /><path d="m3 17.5 9 5 9-5" /></>);
export const IconPlay = (p: P) => base(p, <path d="M7 4.5v15l12-7.5z" />);
export const IconAlert = (p: P) => base(p, <><path d="M12 3 2.5 20h19z" /><path d="M12 9.5v4.5" /><path d="M12 17.2h.01" /></>);
export const IconInfo = (p: P) => base(p, <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.8h.01" /></>);
export const IconChevronDown = (p: P) => base(p, <path d="m6 9.5 6 6 6-6" />);
export const IconStop = (p: P) => base(p, <rect x="6" y="6" width="12" height="12" rx="1.5" />);