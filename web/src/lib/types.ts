// Shared types for the PPTX web generator.

/**
 * All supported slide page types (5 basic types + 15 commercial/analytical elements).
 */
export type SlideType =
  | "cover"
  | "toc"
  | "section"
  | "content"
  | "summary"
  | "agenda"
  | "closing"
  | "executiveSummary"
  | "kpiDashboard"
  | "funnel"
  | "gantt"
  | "processFlow"
  | "quadrant"
  | "swot"
  | "team"
  | "pricing"
  | "testimonial"
  | "metrics"
  | "comparison"
  | "caseStudy"
  | "scope";

/**
 * The theme object contract — MANDATORY shape.
 * NEVER use other key names (background/text/muted/...).
 * Colors are 6-char hex WITHOUT '#'.
 */
export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  bg: string;
}

/** A single slide in the LLM-produced plan. */
export interface SlidePlan {
  type: SlideType;
  title: string;
  /** Bullet points / key lines. For cover this may hold subtitle/meta. */
  bullets?: string[];
  /** Optional layout hint within the type (e.g. "asymmetric", "center"). */
  layout?: string;
  /** Optional speaker note or data source. */
  note?: string;

  // 商业与专业元素支持
  lead?: string;
  body?: string;
  decision?: string;
  evidence?: string[];
  nextStep?: string;
  items?: any[];
  steps?: Array<{ title: string; body: string }>;
  stages?: Array<{ label: string; value: number }>;
  periods?: string[];
  tasks?: Array<{ label: string; start: number; end: number }>;
  points?: Array<{ label: string; x: number; y: number }>;
  xLabel?: string;
  yLabel?: string;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  people?: Array<{ name: string; role: string; bio: string; initials?: string }>;
  plans?: Array<{ name: string; price: string; period: string; features: string[]; recommended?: boolean }>;
  quote?: string;
  author?: string;
  role?: string;
  source?: string;
  columns?: [string, string];
  rows?: Array<{ label: string; values: [string, string] }>;
  verdict?: string;
  stats?: Array<{ label: string; value: string }>;
  categories?: string[];
  values?: number[];
  client?: string;
  problem?: string;
  approach?: string;
  outcome?: string;
  action?: string;
  contact?: string;
  imagePrompt?: string | ImagePromptSchema;
}

/** Structured AI image generation prompt schema. */
export interface ImagePromptSchema {
  subject: string;
  medium?: string;
  stylePreset?: "editorial-minimal" | "corporate-clean" | "tech-futuristic" | "studio-monochrome" | "warm-education";
  composition?: string;
  negativeSpace?: "left-50" | "right-50" | "top-40" | "bottom-40" | "center-safe" | "surrounding" | string;
  palette?: string[];
  colorMood?: string;
  lighting?: string;
  materials?: string[];
  usage?: string;
  aspectRatio?: string;
  allowText?: boolean;
  negativePrompt?: string;
  avoidConcepts?: string[];
}

/** A structured deck plan returned by the LLM. */
export interface DeckPlan {
  title: string;
  slides: SlidePlan[];
}

/** Style recipe — controls corner radius + spacing. */
export type StyleRecipe = "sharp" | "soft" | "rounded" | "pill";

/** Page-number badge shape. */
export type BadgeShape = "circle" | "pill";

/** Font pairing id. */
export type FontPairId =
  | "georgia-calibri"
  | "arialblack-arial"
  | "calibri-calibrilight"
  | "cambria-calibri"
  | "trebuchet-calibri"
  | "impact-arial"
  | "palatino-garamond"
  | "consolas-calibri";

/** Font pairing resolved to header + body fontFace. */
export interface FontPair {
  id: FontPairId;
  header: string;
  body: string;
}

/** Form payload sent from the client to POST /api/generate. */
export interface GenerateOptions {
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
}

/** Numeric layout knobs derived from StyleRecipe (units: inches). */
export interface StyleMetrics {
  pageMargin: number;
  blockGap: number;
  elementPad: number;
  /** corner radius for small / medium / large elements. */
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  badge: BadgeShape;
}
