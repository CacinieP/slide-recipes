# 统一 Deck Schema 与全功能商业渲染器迭代计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `slide-recipes` 构建标准化的 Deck & Slide JSON Schema，打通 Web 应用与底层 18 类商业元素及 9 套审美 Recipe，使大模型能够直接生成结构化商业幻灯片并渲染为可编辑 PPTX。

**Architecture:** 
- 建立 `@slide-recipes/schema` 核心规范（JavaScript + TypeScript 声明），将 18 类商业页面与 9 套 Recipe 规范化为强类型的 Discriminated Union。
- 建立统一 Deck 渲染引擎 `deck-renderer.js`，将统一 Schema 直接分发渲染为原生 PptxGenJS 对象。
- 重构 Web 端（Next.js）的 Prompt 与渲染管道，使其支持生成和预览全部 18 类商业组件。
- 增加 Schema 单元测试与端到端 PPTX 渲染集成测试。

**Tech Stack:** Node.js (ESM), PptxGenJS, TypeScript, Next.js 16, React 19, Tailwind CSS.

---

### Task 1: 建立核心 Deck & Slide Schema 规范及验证器

**Files:**
- Create: `skills/slide-recipes/lib/deck-schema.js`
- Test: `scripts/deck-schema-test.mjs`

- [ ] **Step 1: 编写失败的测试用例**
- [ ] **Step 2: 实现 `skills/slide-recipes/lib/deck-schema.js` 及其校验器**
- [ ] **Step 3: 运行测试并确保通过**

---

### Task 2: 建立统一渲染器 `deck-renderer.js`

**Files:**
- Create: `skills/slide-recipes/lib/deck-renderer.js`
- Modify: `scripts/deck-schema-test.mjs`

- [ ] **Step 1: 在测试中补充 `renderDeckToPptx` 的端到端测试**
- [ ] **Step 2: 实现 `deck-renderer.js`，将 18 类 Slide 映射到 PptxGenJS 原生商业元素**
- [ ] **Step 3: 运行测试并验证生成的 `.pptx` 结构与合法性**

---

### Task 3: 升级 Web 端 Schema 定义与 LLM Prompt

**Files:**
- Modify: `web/src/lib/types.ts`
- Modify: `web/src/lib/prompt.ts`
- Modify: `web/src/lib/render.ts`

- [ ] **Step 1: 在 `web/src/lib/types.ts` 中引入完整的 SlidePayload 联合类型**
- [ ] **Step 2: 在 `web/src/lib/prompt.ts` 中升级 LLM Prompt，使其指导大模型根据商业意图使用 KPI、甘特、流程、漏斗等组件**
- [ ] **Step 3: 在 `web/src/lib/render.ts` 中适配全新 18 类页面渲染器**

---

### Task 4: 升级 Web 前端大纲预览展示与测试门禁整合

**Files:**
- Modify: `web/src/components/preview-panel.tsx`
- Modify: `package.json`

- [ ] **Step 1: 增强 `preview-panel.tsx`，对 KPI、漏斗、甘特、四象限等组件提供更清晰的卡片预览**
- [ ] **Step 2: 将 `deck-schema-test.mjs` 加入根目录 `package.json` 的 `npm test` 门禁**
- [ ] **Step 3: 运行全量 `npm test`，确保所有既有与新增测试 100% 通过**
