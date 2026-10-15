import type { Theme, FontPair, FontPairId, StyleRecipe, StyleMetrics, BadgeShape, OccasionId, OccasionPreset } from "./types";

/**
 * 18 named color palettes, ported verbatim from the pptx-generator skill's
 * design-system.md. Each maps to the 5-key Theme contract:
 *   { primary, secondary, accent, light, bg }
 * Colors are 6-char hex WITHOUT '#'.
 *
 * NOTE: the source palettes list colors as a 5-tuple. We map them positionally:
 *   (primary, secondary, accent, light, bg) — matching the skill's default
 *   (Luxury & Mysterious) ordering used in SKILL.md examples.
 */
export interface Palette {
  id: string;
  name: string;
  theme: Theme;
  /** Suggested use cases (from the skill). */
  useCases: string;
}

export const PALETTES: Palette[] = [
  {
    id: "modern-wellness",
    name: "Modern & Wellness",
    theme: { primary: "006d77", secondary: "83c5be", accent: "ffddd2", light: "e29578", bg: "edf6f9" },
    useCases: "医疗健康、心理咨询、护肤、瑜伽水疗",
  },
  {
    id: "business-authority",
    name: "Business & Authority",
    theme: { primary: "2b2d42", secondary: "8d99ae", accent: "ef233c", light: "d90429", bg: "edf2f4" },
    useCases: "年度报告、财务分析、企业、政府",
  },
  {
    id: "nature-outdoors",
    name: "Nature & Outdoors",
    theme: { primary: "283618", secondary: "606c38", accent: "dda15e", light: "bc6c25", bg: "fefae0" },
    useCases: "户外装备、环保、农业",
  },
  {
    id: "vintage-academic",
    name: "Vintage & Academic",
    theme: { primary: "003049", secondary: "669bbc", accent: "c1121f", light: "780000", bg: "fdf0d5" },
    useCases: "学术讲座、历史、博物馆",
  },
  {
    id: "soft-creative",
    name: "Soft & Creative",
    theme: { primary: "cdb4db", secondary: "ffc8dd", accent: "bde0fe", light: "a2d2ff", bg: "ffafcc" },
    useCases: "母婴、甜品、女性时尚、幼儿园",
  },
  {
    id: "bohemian",
    name: "Bohemian",
    theme: { primary: "414833", secondary: "656d4a", accent: "ccd5ae", light: "d4a373", bg: "fefae0" },
    useCases: "婚庆策划、家居装饰、有机食品",
  },
  {
    id: "vibrant-tech",
    name: "Vibrant & Tech",
    theme: { primary: "023047", secondary: "219ebc", accent: "ffb703", light: "fb8500", bg: "8ecae6" },
    useCases: "体育、健身房、创业路演、青少年教育",
  },
  {
    id: "craft-artisan",
    name: "Craft & Artisan",
    theme: { primary: "414833", secondary: "656d4a", accent: "a68a64", light: "7f5539", bg: "ede0d4" },
    useCases: "咖啡馆、手工艺、烘焙",
  },
  {
    id: "tech-night",
    name: "Tech & Night",
    theme: { primary: "000814", secondary: "001d3d", accent: "ffc300", light: "ffd60a", bg: "003566" },
    useCases: "科技发布、天文、夜间经济、豪华汽车",
  },
  {
    id: "education-charts",
    name: "Education & Charts",
    theme: { primary: "264653", secondary: "2a9d8f", accent: "f4a261", light: "e76f51", bg: "e9c46a" },
    useCases: "统计报告、教育、市场分析",
  },
  {
    id: "forest-eco",
    name: "Forest & Eco",
    theme: { primary: "344e41", secondary: "3a5a40", accent: "a3b18a", light: "588157", bg: "dad7cd" },
    useCases: "景观设计、ESG、环境",
  },
  {
    id: "elegant-fashion",
    name: "Elegant & Fashion",
    theme: { primary: "4a5759", secondary: "b0c4b1", accent: "edafb8", light: "dedbd2", bg: "f7e1d7" },
    useCases: "高级定制、画廊、美妆、杂志",
  },
  {
    id: "art-food",
    name: "Art & Food",
    theme: { primary: "335c67", secondary: "540b0e", accent: "e09f3e", light: "9e2a2b", bg: "fff3b0" },
    useCases: "美食纪录片、艺术展、复古餐厅",
  },
  {
    id: "luxury-mysterious",
    name: "Luxury & Mysterious",
    theme: { primary: "22223b", secondary: "4a4e69", accent: "9a8c98", light: "c9ada7", bg: "f2e9e4" },
    useCases: "珠宝、酒店管理、高端咨询、心理学",
  },
  {
    id: "pure-tech-blue",
    name: "Pure Tech Blue",
    theme: { primary: "03045e", secondary: "0077b6", accent: "90e0ef", light: "00b4d8", bg: "caf0f8" },
    useCases: "云/AI、水/海洋、医院、清洁能源",
  },
  {
    id: "coastal-coral",
    name: "Coastal Coral",
    theme: { primary: "0081a7", secondary: "00afb9", accent: "fed9b7", light: "f07167", bg: "fdfcdc" },
    useCases: "旅行、夏季活动、饮料品牌、海洋",
  },
  {
    id: "vibrant-orange-mint",
    name: "Vibrant Orange Mint",
    theme: { primary: "2ec4b6", secondary: "cbf3f0", accent: "ffbf69", light: "ff9f1c", bg: "ffffff" },
    useCases: "儿童活动、促销海报、快消",
  },
  {
    id: "platinum-white-gold",
    name: "Platinum White Gold",
    theme: { primary: "0a0a0a", secondary: "f5f5f5", accent: "0070F3", light: "D4AF37", bg: "ffffff" },
    useCases: "Agent 产品、企业官网、金融科技、奢侈品",
  },
  {
    id: "nordic-sage",
    name: "Nordic Sage",
    theme: { primary: "233228", secondary: "54695B", accent: "2E5E43", light: "CDE4D4", bg: "F4F6F0" },
    useCases: "北欧极简、可持续发展、ESG报告、自然家居",
  },
  {
    id: "consulting-navy",
    name: "Consulting Navy",
    theme: { primary: "111E2E", secondary: "4B5B6D", accent: "0B4F8A", light: "D0E4F7", bg: "F8F9FA" },
    useCases: "战略咨询、投行研报、董事会汇报、企业战略",
  },
  {
    id: "tokyo-cherry",
    name: "Tokyo Cherry",
    theme: { primary: "2B2326", secondary: "6B575D", accent: "B82645", light: "FBD2DB", bg: "F9F8F6" },
    useCases: "新消费品牌、时尚文化、创意提案、艺术展",
  },
  {
    id: "desert-dune",
    name: "Desert Dune",
    theme: { primary: "382A20", secondary: "6B5748", accent: "8C4724", light: "F5D5C2", bg: "F8F5EE" },
    useCases: "建筑空间、文旅地产、历史人文、咖啡与烘焙",
  },
  {
    id: "electric-violet",
    name: "Electric Violet",
    theme: { primary: "221D38", secondary: "595078", accent: "5C32A8", light: "E2D4FD", bg: "F7F6FB" },
    useCases: "AI原生产品、Web3科技、未来数字平台、前沿发布会",
  },
  {
    id: "alpine-cyan",
    name: "Alpine Cyan",
    theme: { primary: "1A2C38", secondary: "536573", accent: "1B6B8A", light: "CDE7F2", bg: "F6F9FA" },
    useCases: "清洁能源、云原生计算、高端硬件、水务环保",
  },
  {
    id: "bamboo-teal",
    name: "Bamboo Teal",
    theme: { primary: "1D3328", secondary: "50695B", accent: "1C6E4A", light: "C6E8D6", bg: "F5F8F6" },
    useCases: "东方美学、茶文化、绿色科技、新中式消费",
  },
  {
    id: "amber-coal",
    name: "Amber Coal",
    theme: { primary: "282725", secondary: "6B665E", accent: "9E5D10", light: "FCE5C3", bg: "FAF8F4" },
    useCases: "精密制造、工匠精神、经典商业、工业软件",
  },
];

export const DEFAULT_PALETTE_ID = "luxury-mysterious";

/** Resolve a palette id to its Theme; falls back to the default. */
export function resolveTheme(paletteId: string): Theme {
  const found = PALETTES.find((p) => p.id === paletteId);
  const palette = found ?? PALETTES.find((p) => p.id === DEFAULT_PALETTE_ID)!;
  return { ...palette.theme };
}

/** Font pairings — ported from design-system.md Font Pairings table. */
export const FONT_PAIRS: FontPair[] = [
  { id: "georgia-calibri", header: "Georgia", body: "Calibri" },
  { id: "arialblack-arial", header: "Arial Black", body: "Arial" },
  { id: "calibri-calibrilight", header: "Calibri", body: "Calibri Light" },
  { id: "cambria-calibri", header: "Cambria", body: "Calibri" },
  { id: "trebuchet-calibri", header: "Trebuchet MS", body: "Calibri" },
  { id: "impact-arial", header: "Impact", body: "Arial" },
  { id: "palatino-garamond", header: "Palatino", body: "Garamond" },
  { id: "consolas-calibri", header: "Consolas", body: "Calibri" },
];

export function resolveFontPair(id: FontPairId): FontPair {
  return FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0];
}

/**
 * Style recipes → concrete layout metrics (inches). Ported from the skill's
 * Style Recipes table. rectRadius only applies to ROUNDED_RECTANGLE.
 */
export function resolveStyleMetrics(recipe: StyleRecipe): StyleMetrics {
  switch (recipe) {
    case "sharp":
      return { pageMargin: 0.3, blockGap: 0.3, elementPad: 0.12, radiusSm: 0, radiusMd: 0.03, radiusLg: 0.05, badge: "circle" };
    case "soft":
      return { pageMargin: 0.4, blockGap: 0.42, elementPad: 0.18, radiusSm: 0.05, radiusMd: 0.08, radiusLg: 0.12, badge: "circle" };
    case "rounded":
      return { pageMargin: 0.5, blockGap: 0.6, elementPad: 0.25, radiusSm: 0.1, radiusMd: 0.15, radiusLg: 0.25, badge: "pill" };
    case "pill":
      return { pageMargin: 0.6, blockGap: 0.75, elementPad: 0.32, radiusSm: 0.2, radiusMd: 0.3, radiusLg: 0.5, badge: "pill" };
  }
}

/** The badge shape for a given recipe (drives whether circle or pill). */
export function badgeShapeFor(recipe: StyleRecipe): BadgeShape {
  return resolveStyleMetrics(recipe).badge;
}

export const OCCASION_PRESETS: OccasionPreset[] = [
  {
    id: "01-business-report",
    name: "商业汇报 / 经营复盘",
    badge: "BUSINESS",
    desc: "经营指标、财务复盘、KPI 看板与执行计划",
    recommendedPalette: "business-authority",
    recommendedStyle: "sharp",
    recommendedFont: "arialblack-arial",
    recommendedTone: "专业严谨、数据导向、清晰客观",
    sampleTopic: "2026 第一季度业务经营复盘与关键指标汇报",
  },
  {
    id: "02-pitch-deck",
    name: "商业计划书 / 融资路演",
    badge: "PITCH",
    desc: "行业痛点、创新方案、市场空间(TAM)、商业模式与团队",
    recommendedPalette: "indigo-saffron",
    recommendedStyle: "soft",
    recommendedFont: "georgia-calibri",
    recommendedTone: "具有商业说服力、聚焦市场潜力与竞争壁垒、高昂感染力",
    sampleTopic: "新一代智能协作办公平台种子轮商业计划书",
  },
  {
    id: "03-academic-defense",
    name: "学术答辩 / 科研结题",
    badge: "ACADEMIC",
    desc: "研究背景、文献述评、实验假设、实证数据与结论",
    recommendedPalette: "vintage-academic",
    recommendedStyle: "sharp",
    recommendedFont: "cambria-calibri",
    recommendedTone: "学术严密、论断证据对应、逻辑自洽",
    sampleTopic: "基于大语言模型的自适应代码生成优化方法研究",
  },
  {
    id: "04-education-course",
    name: "教学课件 / 知识培训",
    badge: "EDUCATION",
    desc: "概念拆解、原理解析、步骤引导、思考题与互动小结",
    recommendedPalette: "warm-education",
    recommendedStyle: "rounded",
    recommendedFont: "trebuchet-calibri",
    recommendedTone: "深入浅出、启发式教学、生动清晰",
    sampleTopic: "现代分布式系统架构核心原理与工程实战",
  },
  {
    id: "05-product-launch",
    name: "产品发布 / 功能推介",
    badge: "LAUNCH",
    desc: "核心亮点 Hero、架构全景、性能对比与版本定价",
    recommendedPalette: "vibrant-tech",
    recommendedStyle: "soft",
    recommendedFont: "impact-arial",
    recommendedTone: "震撼有力、极速发布、突出核心技术突破与用户价值",
    sampleTopic: "全新企业级云原生实时数据引擎 V3.0 发布会",
  },
  {
    id: "06-creative-portfolio",
    name: "设计作品集 / 创意提案",
    badge: "CREATIVE",
    desc: "设计理念、视觉情绪板、代表案例复盘与品牌合作",
    recommendedPalette: "soft-creative",
    recommendedStyle: "soft",
    recommendedFont: "palatino-garamond",
    recommendedTone: "富有美感、克制高级、注重视觉留白与艺术品味",
    sampleTopic: "2026 建筑空间与品牌体验设计作品集精选",
  },
  {
    id: "07-annual-review",
    name: "年终总结 / 表彰盛典",
    badge: "ANNUAL",
    desc: "年度大事件、经营业绩里程碑、标杆表彰与来年战略",
    recommendedPalette: "tokyo-cherry",
    recommendedStyle: "soft",
    recommendedFont: "arialblack-arial",
    recommendedTone: "喜庆庄重、催人奋进、提振士气",
    sampleTopic: "2026 年度企业发展总结表彰暨新年战略部署大会",
  },
  {
    id: "08-minimal-swiss",
    name: "极简瑞士 / 严谨排印",
    badge: "SWISS",
    desc: "大字排版、高对比度、黑白克制、严密网格无冗余",
    recommendedPalette: "slate-minimal",
    recommendedStyle: "sharp",
    recommendedFont: "calibri-calibrilight",
    recommendedTone: "克制冷峻、极简精准、以排版为核心力量",
    sampleTopic: "数字化转型顶层设计战略原则与规范指南",
  },
  {
    id: "09-event-wedding",
    name: "活动策划 / 典礼庆典",
    badge: "EVENT",
    desc: "活动主题、流程日程表、物料与场地规划、统筹团队",
    recommendedPalette: "bohemian",
    recommendedStyle: "pill",
    recommendedFont: "palatino-garamond",
    recommendedTone: "优雅温情、浪漫仪式感、详尽周密",
    sampleTopic: "2026 春季国际艺术交流节开幕盛典全案策划",
  },
  {
    id: "10-tech-dark",
    name: "科技发布 / 暗黑极客",
    badge: "TECH",
    desc: "深色终端、架构全景、性能跑分与代码规范",
    recommendedPalette: "dark-creative",
    recommendedStyle: "sharp",
    recommendedFont: "consolas-calibri",
    recommendedTone: "极客硬核、极高信息密度、前沿科技感",
    sampleTopic: "次世代高性能 AI 推理基础设施架构深度剖析",
  },
  {
    id: "11-consulting",
    name: "战略咨询 / 麦肯锡风",
    badge: "CONSULTING",
    desc: "金字塔原理、执行摘要、四象限矩阵、甘特路线图",
    recommendedPalette: "consulting-navy",
    recommendedStyle: "sharp",
    recommendedFont: "arialblack-arial",
    recommendedTone: "高管决策视角、逻辑缜密、结构化推演",
    sampleTopic: "某行业领军企业全球供应链韧性重塑战略咨询建议",
  },
  {
    id: "12-marketing-plan",
    name: "营销增长 / 推广方案",
    badge: "GROWTH",
    desc: "用户画像、转化漏斗、全渠道推广策略与 ROI 预测",
    recommendedPalette: "terracotta-glacier",
    recommendedStyle: "soft",
    recommendedFont: "trebuchet-calibri",
    recommendedTone: "目标清晰、打法敏捷、转化导向",
    sampleTopic: "新消费品牌 Q2 整合营销全域获客与裂变增长全案",
  },
  {
    id: "13-training-hr",
    name: "HR培训 / 企业文化",
    badge: "HR & CULTURE",
    desc: "组织愿景、团队阵型、规章规范、入职成长指引",
    recommendedPalette: "bamboo-teal",
    recommendedStyle: "rounded",
    recommendedFont: "georgia-calibri",
    recommendedTone: "温馨亲切、赋能成长、增强归属感",
    sampleTopic: "2026 届新员工入职培训手册与组织文化指南",
  },
  {
    id: "14-medical-healthcare",
    name: "医疗健康 / 临床报告",
    badge: "HEALTHCARE",
    desc: "临床痛点、医学试验数据、治疗机制与对照分析",
    recommendedPalette: "modern-wellness",
    recommendedStyle: "soft",
    recommendedFont: "calibri-calibrilight",
    recommendedTone: "权威可信、严谨求实、以患者为中心",
    sampleTopic: "创新靶向生物制药临床三期试验进展与疗效分析",
  },
  {
    id: "15-kids-playful",
    name: "童趣创意 / 亲子活动",
    badge: "PLAYFUL",
    desc: "探索挑战、手绘趣味、活泼角色与成就激励",
    recommendedPalette: "warm-education",
    recommendedStyle: "pill",
    recommendedFont: "trebuchet-calibri",
    recommendedTone: "童趣盎然、生动好玩、鼓舞激励",
    sampleTopic: "奇妙科学探索营：少儿编程与机器人体验日",
  },
];

export function resolveOccasionPreset(id?: OccasionId): OccasionPreset {
  return OCCASION_PRESETS.find((o) => o.id === id) ?? OCCASION_PRESETS[0];
}
