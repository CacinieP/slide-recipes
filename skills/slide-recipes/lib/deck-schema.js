/**
 * deck-schema.js — 统一的 PPT 幻灯片大纲与页面类型 Schema 规范及验证器。
 * 规范化 18 类商业元素/版式以及 9 套 Recipe，供 Skill、Web API 与 LLM 统一使用。
 */

import { validateImagePromptSchema } from './image-prompt-schema.js';

export const SUPPORTED_RECIPE_IDS = [
  'investor-signal',
  'editorial-proposal',
  'studio-monochrome',
  'research-report',
  'product-story',
  'magazine-story',
  'roadmap-brief',
  'editorial-grid',
  'dark-launch',
];

export const SLIDE_TYPES = [
  // 基础架构页
  'cover',
  'agenda',
  'section',
  'content',
  'closing',
  // 商业数据与图表
  'executiveSummary',
  'kpiDashboard',
  'funnel',
  'gantt',
  'metrics',
  // 分析与决策
  'comparison',
  'quadrant',
  'swot',
  'caseStudy',
  // 执行与交付
  'processFlow',
  'scope',
  'pricing',
  'team',
  'testimonial',
];

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * 校验单张幻灯片 Payload 是否符合约束
 * @param {object} slide 
 * @param {number} index 
 * @returns {string[]} 错误列表
 */
export function validateSlide(slide, index = 0) {
  const errors = [];
  const prefix = `Slide #${index + 1} (${slide?.type || 'unknown'}):`;

  if (!slide || typeof slide !== 'object') {
    return [`${prefix} 幻灯片必须是对象`];
  }

  if (!SLIDE_TYPES.includes(slide.type)) {
    return [`${prefix} 不支持的幻灯片类型 "${slide.type}"。支持的类型有: ${SLIDE_TYPES.join(', ')}`];
  }

  // 标题通常需要是字符串（除了少数特殊过渡页）
  if (slide.title !== undefined && typeof slide.title !== 'string') {
    errors.push(`${prefix} title 必须是字符串`);
  }

  // 生图提示词校验 (支持字符串或结构化 ImagePromptSchema)
  if (slide.imagePrompt !== undefined) {
    if (typeof slide.imagePrompt === 'object' && slide.imagePrompt !== null) {
      const imgErrors = validateImagePromptSchema(slide.imagePrompt);
      imgErrors.forEach(e => errors.push(`${prefix} ${e}`));
    } else if (typeof slide.imagePrompt !== 'string') {
      errors.push(`${prefix} imagePrompt 必须是字符串或结构化 ImagePromptSchema 对象`);
    }
  }

  switch (slide.type) {
    case 'cover':
      if (!isNonEmptyString(slide.title)) errors.push(`${prefix} cover 需要非空的 title`);
      break;

    case 'section':
      if (slide.number === undefined || slide.number === null || String(slide.number).trim() === '') {
        errors.push(`${prefix} section 需要 number 章节编号`);
      }
      if (!isNonEmptyString(slide.title)) errors.push(`${prefix} section 需要非空的 title`);
      break;

    case 'agenda':
      if (!Array.isArray(slide.items) || slide.items.length < 2 || slide.items.length > 4) {
        errors.push(`${prefix} agenda 需要 2–4 个 items`);
      } else {
        slide.items.forEach((item, i) => {
          if (!isNonEmptyString(item?.title)) errors.push(`${prefix} item[${i}] 需要非空 title`);
        });
      }
      break;

    case 'closing':
      if (!isNonEmptyString(slide.title)) errors.push(`${prefix} closing 需要非空 title`);
      if (!isNonEmptyString(slide.action)) errors.push(`${prefix} closing 需要非空 action 明确行动`);
      break;

    case 'executiveSummary':
      if (!isNonEmptyString(slide.decision)) errors.push(`${prefix} executiveSummary 需要非空 decision 核心决策`);
      if (!Array.isArray(slide.evidence) || slide.evidence.length < 2 || slide.evidence.length > 3) {
        errors.push(`${prefix} executiveSummary 需要 2–3 条 evidence 证据`);
      }
      break;

    case 'kpiDashboard':
      if (!Array.isArray(slide.items) || slide.items.length < 3 || slide.items.length > 4) {
        errors.push(`${prefix} kpiDashboard 需要 3–4 个 KPI items`);
      } else {
        slide.items.forEach((item, i) => {
          if (!isNonEmptyString(item?.label) || item?.value === undefined) {
            errors.push(`${prefix} item[${i}] 需要 label 和 value`);
          }
        });
      }
      if (!isNonEmptyString(slide.note)) errors.push(`${prefix} kpiDashboard 需要 note 说明数据口径或来源`);
      break;

    case 'processFlow':
      if (!Array.isArray(slide.steps) || slide.steps.length < 3 || slide.steps.length > 4) {
        errors.push(`${prefix} processFlow 需要 3–4 个 steps 阶段`);
      } else {
        slide.steps.forEach((step, i) => {
          if (!isNonEmptyString(step?.title)) errors.push(`${prefix} step[${i}] 需要非空 title`);
        });
      }
      break;

    case 'funnel':
      if (!Array.isArray(slide.stages) || slide.stages.length < 3 || slide.stages.length > 5) {
        errors.push(`${prefix} funnel 需要 3–5 个 stages 阶段`);
      } else {
        const stages = slide.stages;
        if (stages.some((s, i) => !isFiniteNumber(s?.value) || s.value < 0 || (i > 0 && s.value > stages[i - 1].value))) {
          errors.push(`${prefix} funnel 数值必须非负且单调非递增`);
        }
        if (stages[0]?.value <= 0) errors.push(`${prefix} funnel 首阶段数值必须大于 0`);
      }
      if (!isNonEmptyString(slide.note)) errors.push(`${prefix} funnel 需要 note 说明人群或统计周期`);
      break;

    case 'gantt':
      if (!Array.isArray(slide.periods) || slide.periods.length < 4 || slide.periods.length > 8) {
        errors.push(`${prefix} gantt 需要 4–8 个 periods 时间段`);
      }
      if (!Array.isArray(slide.tasks) || slide.tasks.length < 3 || slide.tasks.length > 5) {
        errors.push(`${prefix} gantt 需要 3–5 个 tasks 任务`);
      } else if (Array.isArray(slide.periods)) {
        const periodLen = slide.periods.length;
        slide.tasks.forEach((task, i) => {
          if (!Number.isInteger(task?.start) || !Number.isInteger(task?.end) ||
              task.start < 0 || task.end < task.start || task.end >= periodLen) {
            errors.push(`${prefix} task[${i}] 的 start/end 索引超出 periods 范围 [0, ${periodLen - 1}]`);
          }
        });
      }
      break;

    case 'quadrant':
      if (!isNonEmptyString(slide.xLabel) || !isNonEmptyString(slide.yLabel)) {
        errors.push(`${prefix} quadrant 需要 xLabel 与 yLabel 坐标轴描述`);
      }
      if (!Array.isArray(slide.points) || slide.points.length < 1 || slide.points.length > 5) {
        errors.push(`${prefix} quadrant 需要 1–5 个 points 象限点`);
      } else {
        slide.points.forEach((p, i) => {
          if (!isFiniteNumber(p?.x) || !isFiniteNumber(p?.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) {
            errors.push(`${prefix} point[${i}] 的 x, y 坐标必须在 [0, 1] 之间`);
          }
        });
      }
      if (!isNonEmptyString(slide.note)) errors.push(`${prefix} quadrant 需要 note 说明评估标准`);
      break;

    case 'swot':
      ['strengths', 'weaknesses', 'opportunities', 'threats'].forEach(key => {
        if (!Array.isArray(slide[key]) || slide[key].length < 1 || slide[key].length > 2) {
          errors.push(`${prefix} swot 的 ${key} 必须包含 1–2 条内容`);
        }
      });
      break;

    case 'team':
      if (!Array.isArray(slide.people) || slide.people.length < 2 || slide.people.length > 3) {
        errors.push(`${prefix} team 需要 2–3 位成员`);
      } else {
        slide.people.forEach((p, i) => {
          if (!isNonEmptyString(p?.name) || !isNonEmptyString(p?.role)) {
            errors.push(`${prefix} people[${i}] 需要 name 与 role`);
          }
        });
      }
      break;

    case 'pricing':
      if (!Array.isArray(slide.plans) || slide.plans.length < 2 || slide.plans.length > 3) {
        errors.push(`${prefix} pricing 需要 2–3 个 plans 方案`);
      } else {
        slide.plans.forEach((plan, i) => {
          if (!isNonEmptyString(plan?.name) || !isNonEmptyString(plan?.price)) {
            errors.push(`${prefix} plan[${i}] 需要 name 和 price`);
          }
          if (!Array.isArray(plan?.features) || plan.features.length < 2 || plan.features.length > 3) {
            errors.push(`${prefix} plan[${i}] 的 features 需要 2–3 条`);
          }
        });
      }
      if (!isNonEmptyString(slide.note)) errors.push(`${prefix} pricing 需要 note 说明计费口径或税费`);
      break;

    case 'testimonial':
      if (!isNonEmptyString(slide.quote) || !isNonEmptyString(slide.author) || !isNonEmptyString(slide.source)) {
        errors.push(`${prefix} testimonial 需要 quote、author 与 source`);
      }
      break;

    case 'metrics':
      if (!Array.isArray(slide.stats) || slide.stats.length < 1 || slide.stats.length > 3) {
        errors.push(`${prefix} metrics 需要 1–3 个 stats 核心数据指标`);
      }
      if (!Array.isArray(slide.categories) || slide.categories.length < 2 || slide.categories.length > 6) {
        errors.push(`${prefix} metrics 需要 2–6 个 categories 图表分类`);
      }
      if (!Array.isArray(slide.values) || slide.values.length !== (slide.categories?.length || 0) ||
          slide.values.some(v => !isFiniteNumber(v) || v < 0)) {
        errors.push(`${prefix} metrics 的 values 必须与 categories 等长且为非负数值`);
      }
      if (!isNonEmptyString(slide.source)) errors.push(`${prefix} metrics 需要 source 数据源说明`);
      break;

    case 'comparison':
      if (!Array.isArray(slide.columns) || slide.columns.length !== 2) {
        errors.push(`${prefix} comparison 需要正好 2 个对比方案 columns`);
      }
      if (!Array.isArray(slide.rows) || slide.rows.length < 2 || slide.rows.length > 4) {
        errors.push(`${prefix} comparison 需要 2–4 行对比维度 rows`);
      } else {
        slide.rows.forEach((row, i) => {
          if (!Array.isArray(row?.values) || row.values.length !== 2) {
            errors.push(`${prefix} row[${i}] 需要对应 2 列的值 values`);
          }
        });
      }
      break;

    case 'caseStudy':
      if (!isNonEmptyString(slide.client) || !isNonEmptyString(slide.problem) ||
          !isNonEmptyString(slide.approach) || !isNonEmptyString(slide.outcome)) {
        errors.push(`${prefix} caseStudy 需要 client、problem、approach 与 outcome 完整闭环`);
      }
      break;

    case 'scope':
      if (!Array.isArray(slide.items) || slide.items.length < 2 || slide.items.length > 3) {
        errors.push(`${prefix} scope 需要 2–3 项服务范围 items`);
      } else {
        slide.items.forEach((item, i) => {
          if (!isNonEmptyString(item?.title) || !isNonEmptyString(item?.body)) {
            errors.push(`${prefix} item[${i}] 需要 title 和 body`);
          }
        });
      }
      break;

    case 'content':
      // 容纳通用正文或要点
      if (!slide.lead && !slide.body && (!slide.bullets || slide.bullets.length === 0)) {
        errors.push(`${prefix} content 页至少需要 lead、body 或 bullets 之一`);
      }
      break;
  }

  return errors;
}

/**
 * 校验整个 Deck JSON 结构
 * @param {object} deck 
 * @param {object} options
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateDeckSchema(deck, { throwOnError = false } = {}) {
  const errors = [];
  if (!deck || typeof deck !== 'object') {
    const err = 'Deck 必须是有效 JSON 对象';
    if (throwOnError) throw new Error(err);
    return { valid: false, errors: [err] };
  }

  if (!Array.isArray(deck.slides) || deck.slides.length === 0) {
    errors.push('Deck 必须包含至少 1 页 slides');
  }

  if (deck.design?.recipeId && !SUPPORTED_RECIPE_IDS.includes(deck.design.recipeId)) {
    errors.push(`不支持的 recipeId "${deck.design.recipeId}"。支持的有: ${SUPPORTED_RECIPE_IDS.join(', ')}`);
  }

  if (Array.isArray(deck.slides)) {
    deck.slides.forEach((slide, idx) => {
      const slideErrors = validateSlide(slide, idx);
      errors.push(...slideErrors);
    });
  }

  if (errors.length > 0 && throwOnError) {
    throw new Error(`Deck Schema 校验失败:\n - ${errors.join('\n - ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
