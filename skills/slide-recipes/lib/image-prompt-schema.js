/**
 * image-prompt-schema.js — 商业 PPT 场景的结构化生图 Prompt Schema 规范与编译器。
 *
 * 核心设计哲学：
 * 1. 结构化解耦：主体(Subject)、媒介风格(Medium)、构图(Composition)、留白安全区(Negative Space)、
 *    色彩氛围(Color Mood)、光影材质(Lighting/Materials)独立声明。
 * 2. 排版安全第一：PPT 配图必须为文字留出负空间(Negative Space)，严禁在文本覆盖区域生成杂乱内容。
 * 3. 严格禁字约束：商业 PPT 的标题与数据全部由 PPTX 原生矢量文字承载，生图严禁带字、带伪UI、带水印。
 */

export const USAGE_ASPECT_RATIOS = {
  cover: '16:9',
  coverOverlay: '16:9',
  hero: '16:9',
  bannerWide: '21:9',
  ultraWideHero: '21:9',
  sideStrip: '9:16',
  card: '1:1',
  cardTall: '3:4',
  cardWide: '4:3',
  showcase: '4:3',
  phoneMockup: '9:16',
  icon: '1:1',
};

export const DEFAULT_NEGATIVE_PROMPT =
  'text, typography, letters, words, slide title, watermark, logo, barcode, QR code, fake UI chrome, buttons, chart labels, messy details, low resolution, blurry, distorted geometry, extra fingers, noisy background';

export const STYLE_PRESETS = {
  'editorial-minimal': {
    label: '编辑设计极简风',
    medium: 'editorial architectural 3D render',
    lighting: 'soft diffused daylight with delicate ambient shadows',
    materials: ['matte ceramic', 'frosted plexiglass', 'natural paper texture'],
    compositionNote: 'restrained elegant layout, clean geometric silhouette, ample breathing room',
  },
  'corporate-clean': {
    label: '商务战略咨询风',
    medium: 'high-end studio photography and minimalist abstract art',
    lighting: 'neutral balanced studio lighting with subtle rim light',
    materials: ['brushed aluminium', 'translucent acrylic', 'fine architectural glass'],
    compositionNote: 'authoritative, organized balance, clean background',
  },
  'tech-futuristic': {
    label: '前沿科技灵动风',
    medium: 'abstract 3D data visualization and geometric structures',
    lighting: 'subtle glowing edge light with deep dark ambient background',
    materials: ['dark refractive glass', 'fiber optic glow', 'nanotech surfaces'],
    compositionNote: 'dynamic diagonal motion, crisp focus, uncluttered focal point',
  },
  'studio-monochrome': {
    label: '黑白工作室创意风',
    medium: 'monochrome studio art and sculptural composition',
    lighting: 'high-contrast directional key light, sculptural chiaroscuro',
    materials: ['matte black clay', 'cast concrete', 'polished chrome'],
    compositionNote: 'bold silhouettes, stark negative space, graphic shapes',
  },
  'warm-education': {
    label: '温暖亲和教育风',
    medium: 'soft stylized 3D claymation and welcoming vector art',
    lighting: 'warm golden morning sunlight, soft inviting radiance',
    materials: ['soft tactile clay', 'light birch wood', 'matte cardboard'],
    compositionNote: 'friendly rounded forms, central focus, cheerful minimalism',
  },
};

/**
 * 留白安全区描述到英文提示词的映射
 */
const NEGATIVE_SPACE_MAP = {
  'left-50': 'clean uncluttered empty negative space on the left 50% of the canvas for typography overlay',
  'right-50': 'clean uncluttered empty negative space on the right 50% of the canvas for typography overlay',
  'top-40': 'spacious smooth gradient or solid background in the top 40% for title overlay',
  'bottom-40': 'clean spacious lower 40% for caption and footer placement',
  'center-safe': 'subject isolated to the periphery with clean empty center field for text',
  'surrounding': 'isolated subject centered on an expansive solid clean background with ample margins',
};

/**
 * 校验 ImagePromptSchema 对象
 * @param {object} schema 
 * @returns {string[]} 错误列表
 */
export function validateImagePromptSchema(schema) {
  const errors = [];
  if (!schema || typeof schema !== 'object') {
    return ['ImagePromptSchema 必须是对象'];
  }

  if (typeof schema.subject !== 'string' || !schema.subject.trim()) {
    errors.push('subject (核心主体描述) 为必填项且不能为空');
  }

  if (schema.usage && !USAGE_ASPECT_RATIOS[schema.usage]) {
    errors.push(`不支持的 usage: "${schema.usage}"。支持的有: ${Object.keys(USAGE_ASPECT_RATIOS).join(', ')}`);
  }

  if (schema.stylePreset && !STYLE_PRESETS[schema.stylePreset]) {
    errors.push(`未知的 stylePreset: "${schema.stylePreset}"。可选预设: ${Object.keys(STYLE_PRESETS).join(', ')}`);
  }

  return errors;
}

/**
 * 将结构化 ImagePromptSchema 编译为可以直接发给文生图模型的提示词包
 * @param {object} schema 
 * @param {object} options 
 * @returns {{ prompt: string, negativePrompt: string, usage: string, aspectRatio: string, manifest: object }}
 */
export function compileImagePrompt(schema, { defaultUsage = 'card', language = 'en' } = {}) {
  const errors = validateImagePromptSchema(schema);
  if (errors.length > 0) {
    throw new Error(`ImagePromptSchema 校验失败:\n - ${errors.join('\n - ')}`);
  }

  const usage = schema.usage || defaultUsage;
  const aspectRatio = schema.aspectRatio || USAGE_ASPECT_RATIOS[usage] || '1:1';
  const preset = schema.stylePreset ? STYLE_PRESETS[schema.stylePreset] : null;

  const parts = [];

  // 1. 媒介与主要风格定义
  const medium = schema.medium || preset?.medium || 'minimalist commercial 3D render';
  parts.push(`A ${medium}`);

  // 2. 核心主体
  parts.push(`depicting ${schema.subject.trim()}`);

  // 3. 构图与景别
  if (schema.composition) {
    parts.push(`Composition: ${schema.composition}`);
  } else if (preset?.compositionNote) {
    parts.push(`Composition: ${preset.compositionNote}`);
  }

  // 4. 留白与文字安全区 (PPT 排版核心)
  if (schema.negativeSpace) {
    const spaceDesc = NEGATIVE_SPACE_MAP[schema.negativeSpace] || schema.negativeSpace;
    parts.push(`Layout requirement: ${spaceDesc}`);
  } else if (usage === 'cover' || usage === 'coverOverlay' || usage === 'hero') {
    // 封面与顶部英雄图默认需要左侧或大面积文字留白
    parts.push(`Layout requirement: clean empty negative space on the left 50% for presentation headline overlay`);
  }

  // 5. 色彩氛围与色板联动
  if (schema.colorMood) {
    parts.push(`Color mood: ${schema.colorMood}`);
  } else if (Array.isArray(schema.palette) && schema.palette.length > 0) {
    const hexCodes = schema.palette.map(c => (c.startsWith('#') ? c : `#${c}`)).join(', ');
    parts.push(`Color palette: harmonized tones of ${hexCodes}`);
  }

  // 6. 光影与材质
  const lighting = schema.lighting || preset?.lighting;
  if (lighting) {
    parts.push(`Lighting: ${lighting}`);
  }

  const materials = schema.materials || preset?.materials;
  if (Array.isArray(materials) && materials.length > 0) {
    parts.push(`Textures and materials: ${materials.join(', ')}`);
  }

  // 7. 商业演示品质修饰
  parts.push('High-end corporate presentation quality, immaculate aesthetic, 8k resolution visual');

  // 8. 绝对禁止文字约束 (强强调)
  if (!schema.allowText) {
    parts.push('STRICT REQUIREMENT: Absolutely NO text, NO words, NO letters, NO numbers, NO watermark, NO logo, NO user interface buttons, NO graphs or charts in the image.');
  }

  const compiledPrompt = parts.join('. ') + '.';

  // 负向提示词合并
  const negativeParts = [DEFAULT_NEGATIVE_PROMPT];
  if (schema.negativePrompt) {
    negativeParts.push(schema.negativePrompt);
  }
  if (Array.isArray(schema.avoidConcepts) && schema.avoidConcepts.length > 0) {
    negativeParts.push(schema.avoidConcepts.join(', '));
  }
  const compiledNegative = negativeParts.join(', ');

  return {
    prompt: compiledPrompt,
    negativePrompt: compiledNegative,
    usage,
    aspectRatio,
    manifest: {
      ...schema,
      compiledUsage: usage,
      compiledRatio: aspectRatio,
    },
  };
}
