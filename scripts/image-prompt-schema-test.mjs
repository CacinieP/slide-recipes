import assert from 'node:assert/strict';
import {
  validateImagePromptSchema,
  compileImagePrompt,
  STYLE_PRESETS,
  USAGE_ASPECT_RATIOS,
} from '../skills/slide-recipes/lib/image-prompt-schema.js';
import { generateSlideImage } from '../skills/slide-recipes/lib/ai-image.js';
import { validateSlide, validateDeckSchema } from '../skills/slide-recipes/lib/deck-schema.js';

console.log('Testing image-prompt-schema.js...');

// 1. 常量与预设检查
assert.ok(STYLE_PRESETS['editorial-minimal']);
assert.ok(STYLE_PRESETS['corporate-clean']);
assert.equal(USAGE_ASPECT_RATIOS.cover, '16:9');
assert.equal(USAGE_ASPECT_RATIOS.card, '1:1');
assert.equal(USAGE_ASPECT_RATIOS.bannerWide, '21:9');

// 2. 基础校验逻辑
assert.deepEqual(validateImagePromptSchema({ subject: 'Abstract crystal prism' }), []);

const invalid1 = validateImagePromptSchema({});
assert.ok(invalid1.some(e => e.includes('subject')));

const invalid2 = validateImagePromptSchema({ subject: 'Test', usage: 'unsupported-usage' });
assert.ok(invalid2.some(e => e.includes('usage')));

const invalid3 = validateImagePromptSchema({ subject: 'Test', stylePreset: 'unknown-preset' });
assert.ok(invalid3.some(e => e.includes('stylePreset')));

// 3. 提示词编译逻辑
const compiled = compileImagePrompt({
  subject: 'translucent geometric crystal prisms floating in balance',
  stylePreset: 'editorial-minimal',
  negativeSpace: 'left-50',
  palette: ['123936', '#28664D'],
  usage: 'cover',
});

assert.equal(compiled.usage, 'cover');
assert.equal(compiled.aspectRatio, '16:9');
assert.ok(compiled.prompt.includes('translucent geometric crystal prisms'));
assert.ok(compiled.prompt.includes('clean uncluttered empty negative space on the left 50%'));
assert.ok(compiled.prompt.includes('#123936, #28664D'));
assert.ok(compiled.prompt.includes('STRICT REQUIREMENT: Absolutely NO text'));
assert.ok(compiled.negativePrompt.includes('typography'));
assert.ok(compiled.negativePrompt.includes('watermark'));

// 4. DeckSchema 与 Slide 中的 imagePrompt 校验集成
const slideWithStructuredImagePrompt = {
  type: 'cover',
  title: '战略汇报',
  imagePrompt: {
    subject: 'architectural modern glass building at dusk',
    stylePreset: 'corporate-clean',
    negativeSpace: 'left-50',
    usage: 'cover',
  },
};
assert.deepEqual(validateSlide(slideWithStructuredImagePrompt, 0), []);

const invalidSlideImagePrompt = {
  type: 'cover',
  title: '战略汇报',
  imagePrompt: {
    // 缺少 subject
    stylePreset: 'corporate-clean',
  },
};
const slideErrors = validateSlide(invalidSlideImagePrompt, 0);
assert.ok(slideErrors.some(e => e.includes('subject')));

// 5. ai-image 的 generateSlideImage 对 imagePrompt 的平滑支持
// 当没有 API Key 时，应该正常返回 null 并给出警告，不发生崩溃
const res = await generateSlideImage({
  imagePrompt: {
    subject: 'floating glass geometric forms',
    stylePreset: 'tech-futuristic',
    usage: 'card',
  },
});
assert.equal(res, null, '未配置 key 时应安全返回 null');

console.log('✅ image-prompt-schema tests PASS');
