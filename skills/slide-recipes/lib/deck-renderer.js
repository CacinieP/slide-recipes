/**
 * deck-renderer.js — 统一的 PPT 幻灯片渲染引擎。
 * 将符合 DeckSchema 的结构化 JSON 转化为 PptxGenJS 原生矢量幻灯片。
 * 支持 18 类商业页面与 9 套审美 Recipe 的全正交自由搭配。
 */

import pptxgen from 'pptxgenjs';
import { validateDeckSchema } from './deck-schema.js';
import { createCommercialRecipe, commercialRecipes } from '../recipes/recipe-commercial.mjs';

/** Recipe ID 到商业底座的映射与推荐色板 */
const RECIPE_MAPPING = {
  'investor-signal': { base: 'investor-signal', defaultPalette: 'forest-sand' },
  'editorial-proposal': { base: 'editorial-proposal', defaultPalette: 'cobalt-white' },
  'studio-monochrome': { base: 'studio-monochrome', defaultPalette: 'graphite-orange' },
  'editorial-grid': { base: 'editorial-proposal', defaultPalette: 'navy-teal' },
  'dark-launch': { base: 'studio-monochrome', defaultPalette: 'graphite-orange' },
  'research-report': { base: 'editorial-proposal', defaultPalette: 'navy-teal' },
  'product-story': { base: 'investor-signal', defaultPalette: 'forest-sand' },
  'magazine-story': { base: 'editorial-proposal', defaultPalette: 'burgundy-cream' },
  'roadmap-brief': { base: 'editorial-proposal', defaultPalette: 'cobalt-white' },
};

/**
 * 将 DeckSchema JSON 渲染为 PptxGenJS Presentation 对象
 * @param {object} deck 
 * @param {object} options 
 * @returns {Promise<any>} PptxGenJS presentation 实例
 */
export async function renderDeckToPptx(deck, { pres: customPres, PptxGenJS: CustomPptxClass } = {}) {
  // 1. 强校验 Schema
  validateDeckSchema(deck, { throwOnError: true });

  const PptxClass = CustomPptxClass || pptxgen;
  const pres = customPres || new PptxClass();

  // 2. 解析设计系统与 Recipe
  const recipeId = deck.design?.recipeId || 'editorial-proposal';
  const mapping = RECIPE_MAPPING[recipeId] || RECIPE_MAPPING['editorial-proposal'];
  const baseRecipeId = mapping.base;
  const paletteId = deck.design?.paletteId || mapping.defaultPalette;
  const fontFace = deck.design?.fontFace || 'Microsoft YaHei';
  const mode = deck.design?.mode || 'presentation';
  const deckTitle = deck.meta?.title || '';

  // 3. 实例化商业底层 Recipe
  const r = createCommercialRecipe(pres, baseRecipeId, {
    fontFace,
    label: deckTitle,
    mode,
    palette: paletteId,
  });

  // 4. 为 Recipe 扩充通用 content 与兼容版式
  const t = r.theme;
  const renderContent = (slide, pageNum) => {
    const s = r.base ? r.base({ title: slide.title, kicker: slide.kicker || 'KEY TAKEAWAY', page: pageNum }) : pres.addSlide();
    let currentY = 1.85;

    if (slide.lead) {
      s.addText(slide.lead, {
        x: 0.55, y: currentY, w: 8.9, h: 0.65,
        fontSize: 22, fontFace, color: t.accent, bold: true, margin: 0, valign: 'top',
      });
      currentY += 0.8;
    }

    if (slide.body) {
      s.addText(slide.body, {
        x: 0.55, y: currentY, w: 8.9, h: 2.2,
        fontSize: 16, fontFace, color: t.ink, margin: 0, valign: 'top', lineSpacingMultiple: 1.2,
      });
    } else if (Array.isArray(slide.bullets) && slide.bullets.length > 0) {
      const bulletLines = slide.bullets.map(b => `• ${b}`).join('\n\n');
      s.addText(bulletLines, {
        x: 0.55, y: currentY, w: 8.9, h: 2.4,
        fontSize: 16, fontFace, color: t.ink, margin: 0, valign: 'top', lineSpacingMultiple: 1.15,
      });
    }

    if (slide.source) {
      s.addText(slide.source, {
        x: 0.55, y: 4.8, w: 8.9, h: 0.2,
        fontSize: 9, fontFace, color: t.muted, margin: 0,
      });
    }
    return s;
  };

  // 5. 遍历幻灯片，按类型分发渲染
  deck.slides.forEach((slide, idx) => {
    const pageNum = idx + 1;
    const payload = { ...slide, page: pageNum };

    switch (slide.type) {
      case 'cover':
        r.cover({
          title: slide.title,
          subtitle: slide.subtitle || (Array.isArray(slide.bullets) ? slide.bullets[0] : ''),
          kicker: slide.kicker || 'PRESENTATION',
          image: slide.image,
          page: pageNum,
        });
        break;

      case 'agenda':
        r.agenda({
          title: slide.title || '汇报议程',
          kicker: slide.kicker || 'AGENDA',
          items: slide.items,
          page: pageNum,
        });
        break;

      case 'section':
        r.section({
          number: slide.number !== undefined ? slide.number : String(pageNum).padStart(2, '0'),
          title: slide.title,
          summary: slide.summary || (Array.isArray(slide.bullets) ? slide.bullets.join('；') : ''),
          page: pageNum,
        });
        break;

      case 'closing':
        r.closing({
          title: slide.title || '感谢聆听',
          action: slide.action || '下一步推进与沟通',
          contact: slide.contact || '',
          page: pageNum,
        });
        break;

      case 'executiveSummary':
        r.executiveSummary({
          title: slide.title || '执行摘要',
          decision: slide.decision,
          evidence: slide.evidence,
          nextStep: slide.nextStep || '',
          page: pageNum,
        });
        break;

      case 'kpiDashboard':
        r.kpiDashboard({
          title: slide.title,
          items: slide.items,
          note: slide.note,
          page: pageNum,
        });
        break;

      case 'processFlow':
        r.processFlow({
          title: slide.title,
          steps: slide.steps,
          note: slide.note || '',
          page: pageNum,
        });
        break;

      case 'funnel':
        r.funnel({
          title: slide.title,
          stages: slide.stages,
          note: slide.note,
          page: pageNum,
        });
        break;

      case 'gantt':
        r.gantt({
          title: slide.title,
          periods: slide.periods,
          tasks: slide.tasks,
          note: slide.note || '',
          page: pageNum,
        });
        break;

      case 'quadrant':
        r.quadrant({
          title: slide.title,
          xLabel: slide.xLabel,
          yLabel: slide.yLabel,
          points: slide.points,
          note: slide.note,
          page: pageNum,
        });
        break;

      case 'swot':
        r.swot({
          title: slide.title,
          strengths: slide.strengths,
          weaknesses: slide.weaknesses,
          opportunities: slide.opportunities,
          threats: slide.threats,
          page: pageNum,
        });
        break;

      case 'team':
        r.team({
          title: slide.title,
          people: slide.people,
          note: slide.note || '',
          page: pageNum,
        });
        break;

      case 'pricing':
        r.pricing({
          title: slide.title,
          plans: slide.plans,
          note: slide.note,
          page: pageNum,
        });
        break;

      case 'testimonial':
        r.testimonial({
          title: slide.title,
          quote: slide.quote,
          author: slide.author,
          role: slide.role,
          source: slide.source,
          page: pageNum,
        });
        break;

      case 'metrics':
        r.metrics({
          title: slide.title,
          stats: slide.stats,
          categories: slide.categories,
          values: slide.values,
          seriesName: slide.seriesName,
          source: slide.source,
          page: pageNum,
        });
        break;

      case 'comparison':
        r.comparison({
          title: slide.title,
          columns: slide.columns,
          rows: slide.rows,
          verdict: slide.verdict || '',
          page: pageNum,
        });
        break;

      case 'caseStudy':
        r.caseStudy({
          title: slide.title,
          client: slide.client,
          problem: slide.problem,
          approach: slide.approach,
          outcome: slide.outcome,
          image: slide.image,
          source: slide.source || '',
          page: pageNum,
        });
        break;

      case 'scope':
        r.scope({
          title: slide.title,
          items: slide.items,
          note: slide.note || '',
          page: pageNum,
        });
        break;

      case 'content':
      default:
        renderContent(payload, pageNum);
        break;
    }
  });

  return pres;
}
