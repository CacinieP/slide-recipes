# Slide Recipes

**English** | [简体中文](README.zh-CN.md)

[Prompt guide](#prompt-guide) · [Color prompts](#color-guide) · [Business elements](skills/themed-cn-pptx/references/business-elements.md)

<p align="center">
  <img src="docs/img/hero-demos.png" alt="slide-recipes demo decks — miku, editorial-grid, dark-launch" width="820" />
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/CacinieP/slide-recipes?style=flat-square" alt="License" /></a>
  <a href="https://github.com/CacinieP/slide-recipes/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/CacinieP/slide-recipes/ci.yml?branch=main&label=CI&style=flat-square" alt="CI" /></a>
  <img src="https://img.shields.io/badge/skills-1%20released-39c5bb?style=flat-square" alt="Skills" />
  <img src="https://img.shields.io/badge/output-editable%20.pptx-0A7CFF?style=flat-square" alt="PPTX" />
  <img src="https://img.shields.io/badge/node-%E2%89%A5%2020-339933?style=flat-square" alt="Node" />
</p>

Open-source skills for generating and **accepting** real, **editable, CJK-aware PPTX decks** built with PptxGenJS — verified by a deterministic QA gate, not just eyeballed.

The first released skill, [`themed-cn-pptx`](skills/themed-cn-pptx/), ships nine aesthetic recipes, a provider-aware AI image layer (OpenAI-compatible / Google / Bailian / MiniMax), and three QA tools (render QA, CJK overflow, editable-text check).

---

## 🎬 Demo Gallery

Three locked demo decks, all generated from this repo with **zero API keys** (solid-color / hairline fallbacks). Rendered here with LibreOffice at 150 DPI.

| Deck | Slides | Recipe | Vibe |
| --- | --- | --- | --- |
| **Miku** | 3 | `miku` (skill showcase) | Teal + pink, dark/light alternation |
| **Editorial Grid** | 6 | `recipe-editorial-grid.mjs` | Nord neutrals, hairline report look |
| **Dark Launch** | 5 | `recipe-dark-launch.mjs` | Deep navy, oversized type, framed QR close |

### Miku — skill showcase

<p align="center">
  <a href="docs/img/demos/miku/miku-slide-1.jpg"><img src="docs/img/demos/miku/miku-slide-1.jpg" width="280" alt="miku cover" /></a>
  &nbsp;
  <a href="docs/img/demos/miku/miku-slide-2.jpg"><img src="docs/img/demos/miku/miku-slide-2.jpg" width="280" alt="miku content" /></a>
  &nbsp;
  <a href="docs/img/demos/miku/miku-slide-3.jpg"><img src="docs/img/demos/miku/miku-slide-3.jpg" width="280" alt="miku summary" /></a>
</p>

### Editorial Grid — Nord report look

<p align="center">
  <a href="docs/img/demos/editorial/editorial-slide-1.jpg"><img src="docs/img/demos/editorial/editorial-slide-1.jpg" width="195" alt="editorial s1" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-2.jpg"><img src="docs/img/demos/editorial/editorial-slide-2.jpg" width="195" alt="editorial s2" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-3.jpg"><img src="docs/img/demos/editorial/editorial-slide-3.jpg" width="195" alt="editorial s3" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-4.jpg"><img src="docs/img/demos/editorial/editorial-slide-4.jpg" width="195" alt="editorial s4" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-5.jpg"><img src="docs/img/demos/editorial/editorial-slide-5.jpg" width="195" alt="editorial s5" /></a>
  <a href="docs/img/demos/editorial/editorial-slide-6.jpg"><img src="docs/img/demos/editorial/editorial-slide-6.jpg" width="195" alt="editorial s6" /></a>
</p>

### Dark Launch — keynote close

<p align="center">
  <a href="docs/img/demos/darklaunch/darklaunch-slide-1.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-1.jpg" width="232" alt="darklaunch s1" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-2.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-2.jpg" width="232" alt="darklaunch s2" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-3.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-3.jpg" width="232" alt="darklaunch s3" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-4.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-4.jpg" width="232" alt="darklaunch s4" /></a>
  <a href="docs/img/demos/darklaunch/darklaunch-slide-5.jpg"><img src="docs/img/demos/darklaunch/darklaunch-slide-5.jpg" width="232" alt="darklaunch s5" /></a>
</p>

> The `.pptx` files themselves are committed at `examples/slides/output/` — open them in PowerPoint and edit directly.

---

## ✨ Highlights

- **Editable PPTX** — real `.pptx`, not flattened slide images; verified by `pptx-editable-check.py`.
- **CJK-first layout** — font fallback, full-width punctuation, conservative sizes; overflow predicted *before* render.
- **Render QA gate** — `render-qa.mjs` catches overflow, overlap, off-canvas, bad image ratios, missing page badges.
- **Locked recipes** — nine aesthetic recipes for briefings, brand proposals, investor updates and studio decks so you stop re-deciding every detail.
- **Provider-aware AI images** — OpenAI-compatible custom endpoints, Google/Nano, Bailian and MiniMax, with model-specific configuration.
- **WCAG color QA** — sRGB luminance contrast, not eyeballing; CI gate fails on P0.
- **Graceful degradation** — no API key? builds continue with solid-color placeholders, never crash.

---

## 🚀 Quick Start

```bash
git clone https://github.com/CacinieP/slide-recipes.git
cd slide-recipes
npm ci          # install locked deps
npm test        # skill manifest + smoke + preset palette contrast QA
npm run demos   # build all three demo PPTX (no API key needed)
```

Then hand a prompt to an Agent with shell access:

```text
Make this README into an editable Chinese PPTX, ~8 slides, editorial-grid recipe.
```

**Or install the skill directly:**

```bash
npx skills add https://github.com/CacinieP/slide-recipes --skill themed-cn-pptx
```

> The install is self-contained — `SKILL.md`, `lib/`, `recipes/`, `references/` **and the render-QA gate (`scripts/`)** travel together, so `/skill:themed-cn-pptx` in pi (or the equivalent in Claude Code / Codex) can run `render-qa`, `cjk-overflow-check`, `color-qa` and `pptx-editable-check` straight out of `~/.agents/skills/themed-cn-pptx/` with no clone of this repo. Only `pptxgenjs` (deck *generation*) still needs `npm i` in your own deck project. The standard Anthropic `pptx` skill is an **optional** pairing, not a dependency — its license forbids redistribution, so it is deliberately not vendored in this repo; fetch it from the official channel if you want it alongside.

---

<a id="prompt-guide"></a>

## Prompt guide: build useful business decks

Copy a prompt and replace bracketed fields. Specify **audience, decision, source material, slide count, viewing context, visual direction and deliverables**. A concrete brief works better than “make it premium.”

### 1. Create a complete proposal

```text
Use themed-cn-pptx to turn [file or pasted material] into a 12-slide business proposal.
Audience: [client leadership]. Decision: [approve a pilot]. Duration: [15 minutes].
Viewing context: [meeting-room projection]. Use editorial-proposal with navy-teal.
Use conclusion-led titles. Include an executive summary, problem, approach, process,
evidence, case study, timeline, team, scope, pricing and next steps.
Use only supplied facts. Mark missing information; do not invent customers or metrics.
Keep charts and text editable. Plan the pages, then build the PPTX, source script
and previews, and complete render QA.
```

### 2. Specify business elements

```text
Turn [data file] into a 10-slide monthly business review for department leads.
Use investor-signal with forest-sand. Include a KPI dashboard, same-cohort funnel,
impact/effort matrix, next-month Gantt plan and one explicit management decision.
Show metric definitions, periods, units and sources. Distinguish percentage change
from percentage-point change. Do not replace missing values with zero.
```

### 3. Revise selected slides

```text
Edit [PPTX and source script]. Make slide 4 a KPI dashboard, slide 6 a comparison,
and slide 8 a Gantt plan. Preserve other slides, all values and citations.
Keep the existing fonts and palette. Split crowded pages instead of shrinking text.
Deliver the revised PPTX, source and change list.
```

### 4. Direct image generation

```text
Generate concept art only for the cover and section dividers. Use my real product
images for case studies. Keep [material, lighting, camera angle and color temperature]
consistent. Place the cover subject on the right and reserve the left 45% for text.
No embedded text, logos, numbers or QR codes. Use my configured provider/endpoint/model;
read credentials from the environment. Keep slide text and charts editable.
Report missing assets or generation failures.
```

### Business elements you can request

The three commercial recipes support **18 page/element APIs**: the existing eight page types plus these ten.

| Element | API | Scope |
| --- | --- | --- |
| Executive summary | `executiveSummary` | Decision, evidence, next action |
| KPI dashboard | `kpiDashboard` | 3–4 metrics with comparison context |
| Process flow | `processFlow` | 3–4 stages and outputs |
| Conversion funnel | `funnel` | 3–5 decreasing stages; proportional widths |
| Gantt plan | `gantt` | 4–8 equal time periods, 3–5 tasks |
| Priority matrix | `quadrant` | Two dimensions; normalized 0–1 coordinates |
| SWOT | `swot` | Internal strengths/weaknesses, external opportunities/threats |
| Team | `team` | 2–3 people, real portraits or initials |
| Pricing | `pricing` | 2–3 plans, currency, billing basis, inclusions |
| Testimonial | `testimonial` | Real quote, attribution and source |

![Business element gallery](docs/img/business-elements.jpg)

See [business element fields and constraints](skills/themed-cn-pptx/references/business-elements.md). Run `npm run demo:elements` for the ten-slide example.

<a id="color-guide"></a>


### 15 distinctive palettes, with actionable color prompts

![20 semantic palettes](docs/img/palette-gallery.svg)

Together with the original five, there are now 20 original palettes. Each defines all eight semantic roles and passes the built-in 4.5:1 text-pair checks. The lighter secondary color is `highlight` for dark backgrounds, not a substitute for text on paper. Suggested uses are starting points.

| Preset | Suggested context | Accent / highlight |
|---|---|---|
| `aubergine-lime` | Creative strategy | `69336F` / `DDEDAB` |
| `petrol-apricot` | Consumer brands | `176272` / `FFD3B0` |
| `ink-lilac` | Research and technology | `494F8C` / `DCD2F4` |
| `plum-celadon` | Premium services | `783E60` / `CEE4D8` |
| `indigo-saffron` | Product launches | `354D92` / `F5DA91` |
| `oxblood-rose` | Boutique retail | `8A3246` / `F2CFCC` |
| `moss-linen` | Architecture and sustainability | `4B653A` / `E2E4B9` |
| `espresso-ice` | Consulting and hospitality | `78503C` / `CBE5EB` |
| `terracotta-glacier` | Travel and spatial design | `984B32` / `CEE5E7` |
| `midnight-citron` | Digital products | `385E72` / `E4EFAD` |
| `mineral-copper` | Industrial design | `397166` / `F0CEB5` |
| `slate-wisteria` | People and professional services | `655080` / `E1D4ED` |
| `olive-orchid` | Beauty and arts | `68612F` / `E8D6EA` |
| `prussian-butter` | Finance and publishing | `245B79` / `F4E5B8` |
| `mulberry-mist` | Exhibitions and experience | `803E73` / `D2E4E5` |

```text
Propose three distinctive palettes for [topic/audience]: aubergine-lime,
petrol-apricot, and espresso-ice. Compare the same KPI slide before applying one.
Return HEX values for paper/ink/muted/accent/highlight/line/dark/light.
Use a light base for roughly 70–80% of the composition, dark type for structure,
and color for the key conclusion. Preserve semantic roles across the deck.
Do not encode categories or positive/negative status with color alone.
Keep text and charts editable, preserve data, and verify contrast for projection.
```

```text
Use plum-celadon for a quiet, editorial premium-services proposal.
Use paper as the main background, plum for headings and the primary chart,
and celadon for emphasis on dark backgrounds or decoration. Keep data pages light.
Avoid candy-colored pages, glow gradients, and meaningless colored panels.
If a brand override fails contrast checks, darken the text color and show both HEX values.
```

See the [palette catalog](skills/themed-cn-pptx/references/palette-catalog.md) for every role and usage.

## Color prompting guide

### Specify semantic roles

| Role | Purpose | navy-teal example |
| --- | --- | --- |
| `paper` | Light slide background | `F5F8FA` |
| `ink` | Headings and body text | `142B40` |
| `muted` | Secondary text and sources | `526475` |
| `accent` | Short headings, metrics and chart emphasis | `006F73` |
| `highlight` | Dark-slide emphasis and limited decoration | `BCE9E5` |
| `line` | Decorative separators | `CCD8E0` |
| `dark` / `light` | Dark background / light text | `142B40` / `F5F8FA` |

Use one primary emphasis color for charts. Pair status colors with words or symbols. Decorative `line` colors must not be the only encoding for essential data.

### Five foundation palettes (plus 15 distinctive palettes above)

| ID | Prompt direction | Accent | Dark background |
| --- | --- | --- | --- |
| `navy-teal` | Restrained navy and teal for operational reviews | `006F73` | `142B40` |
| `forest-sand` | Forest green and warm sand for investor updates | `28664D` | `123936` |
| `cobalt-white` | Crisp cobalt and warm white for brand proposals | `214CC4` | `183387` |
| `burgundy-cream` | Warm burgundy and cream for brand storytelling | `8C2946` | `4B1F2D` |
| `graphite-orange` | Graphite and burnt orange for product proposals | `A94413` | `25282C` |

These are starting points, not industry rules. Any palette can be paired with any commercial recipe.

### 5. Start from a brand color

```text
Our brand color is #FF6A00. Preserve its hue for limited marks and dark-slide accents.
Start from graphite-orange and create a full semantic palette. Use a darker orange
or neutral for small text on light backgrounds. List paper, ink, muted, accent,
highlight, line, dark and light with HEX values and roles, then apply the palette.
Check actual text/background pairs and adjust lightness when needed.
Preserve the source data, image content and original brand logo.
```

### 6. Start from a mood

```text
The deck should feel [professional, warm and restrained], avoiding [neon and gradients].
Propose three semantic palettes with different hues, including HEX values and roles.
Recommend the best fit for [audience and purpose], then apply it.
Use neutrals for most reading surfaces and one primary accent for key conclusions.
Keep dark covers/dividers and light content pages within the same color system.
```

### 7. Change only the palette

```text
Preserve the current layout and switch to burgundy-cream. Update backgrounds,
headings, body text, secondary labels, separators and charts. Keep all content
and values unchanged. Check contrast in dark slides, table headers, accent text
and footnotes, then render previews again.
```

Code supports named presets or partial role overrides:

```js
const r = createCommercialRecipe(pres, 'editorial-proposal', {
  palette: 'navy-teal', // or { accent: '#A94413', highlight: '#FF6A00' }
  fontFace: 'Microsoft YaHei', // choose a font installed in the rendering environment
  label: 'Client proposal',
});
```

Critical text pairs must pass 4.5:1 before generation. Invalid palettes throw a descriptive error instead of silently replacing brand colors. Text over photographs still needs visual QA. This palette API applies to the commercial recipes; older recipes retain their own theme interfaces.

---

## 📋 Commands

### Generation

| Command | Purpose |
| --- | --- |
| `npm run demo` | 3-slide **Miku** demo (no API key) |
| `npm run demo:editorial` | 6-slide **editorial-grid** recipe demo |
| `npm run demo:elements` | Ten editable business element examples |
| `npm run demo:darklaunch` | 5-slide **dark-launch** recipe demo |
| `npm run demos` | Build all three |

### QA gates

| Command | Purpose |
| --- | --- |
| `npm test` | Skill manifest **+** smoke (imports/provider/size) **+** preset palette contrast QA |
| `npm run qa:render -- deck.pptx` | **PPTX render + heuristic QA** — overflow, overlap, bounds, image aspect, page badge. P0 exits 1 |
| `npm run qa:render -- deck.pptx --render --out ./qa` | Above **+** drive `soffice → pdf → jpg` when LibreOffice + poppler installed |
| `npm run qa:cjk -- --text "标题" --font-size 44 --box-width 9` | **Render-free CJK overflow estimator**, use before generating |
| `npm run qa:editable -- deck.pptx` | **Editable / CJK-font / macro / theme check** (Python; zip-fallback) |
| `npm run color:qa -- --palette 0F2233,F1FBFA,39C5BB,FF77AA --role body` | WCAG contrast for a palette |
| `npm run color:qa:presets` | All preset palettes (CI gate, exits 1 on P0) |

---

## 🛠️ Workflows

**A. Modify an existing deck** — read the deck / `build_*.js`, scope the change (colors, pages, images, copy, QR, layout), edit + regenerate, then run render QA and fix until clean.

**B. Generate from manuscript** — extract source → decompose into slide-level messages → define theme tokens + image needs → pick reusable layouts → generate AI images, embed, run render QA.

---

## 🎨 AI Image Generation

Use [`skills/themed-cn-pptx/lib/ai-image.js`](skills/themed-cn-pptx/lib/ai-image.js) with configurable models and protocols; see the [API configuration guide](skills/themed-cn-pptx/references/image-providers.md). No key → returns `null`, build falls back to placeholders.

```js
import { generateSlideImage, addImageToSlide, addImageOverlay } from "./lib/ai-image.js";

const cover = await generateSlideImage({
  provider: "openai",            // recommended; also: google / gpt-image / nano-banana-pro
  prompt: "teal tech cover background, clean whitespace, room for a title",
  usage: "cover",                // -> size 1360x768 on GPT Image 2, 16:9 + 2K on Nano Banana Pro
});

if (cover) {
  addImageToSlide(slide, cover, { x: 0, y: 0, w: 10, h: 5.625 });
  addImageOverlay(slide, pres, { color: "0B1B2B", opacity: 45 }); // 40-55% over any image with text
}
```

### Provider priority

1. `provider` arg to `generateSlideImage()`
2. `PPT_IMAGE_PROVIDER` / `AI_IMAGE_PROVIDER` env
3. Google only if `GOOGLE_API_KEY`/`GEMINI_API_KEY` set and no `OPENAI_API_KEY`
4. Default: OpenAI GPT Image 2

### Environment variables

```bash
PPT_IMAGE_PROVIDER=openai        # openai | google    (openai recommended)
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=xxx               # GEMINI_API_KEY also read
# optional overrides:
# OPENAI_BASE_URL / GOOGLE_BASE_URL / OPENAI_IMAGE_MODEL / GOOGLE_IMAGE_MODEL
```

The helper auto-loads `.env` on import; shell/CI vars take priority. Create `.env` locally — it's gitignored, never commit keys.

### Size → layout mapping

The usage → size/ratio/layout contract is unchanged from the previous StepFun/MiniMax provider layer, so existing decks keep their layout slots.

| Usage | GPT Image 2 `size` | Nano Banana Pro ratio + size | PPTX layout |
| --- | --- | --- | --- |
| `cover` / `coverOverlay` | `1360x768` | `16:9` + `2K` | `10 × 5.625 in` |
| `hero` | `1360x768` | `16:9` + `2K` | `10 × 3 in` |
| `bannerWide` / `ultraWideHero` | `1344x576` (native 21:9) | `21:9` + `2K` | `10 × 2.45 in` / `10 × 2.8 in` |
| `sideStrip` / `phoneMockup` | `768x1360` | `9:16` + `2K`/`1K` | `2.5 × 4.44 in` / `1.8 × 3.2 in` |
| `card` | `1024x1024` | `1:1` + `1K` | `2.5 × 2.5 in` |
| `cardWide` / `showcase` | `1184x896` | `4:3` + `1K`/`2K` | `3.5 × 2.65 in` / `3.9 × 2.95 in` |
| `cardTall` | `896x1184` | `3:4` + `1K` | `2.3 × 3.04 in` |
| `icon` | `1024x1024` (adapted from 512x512) | `1:1` + `1K` | `1.5 × 1.5 in` |

Size-adaptation rules: `gpt-image-2` accepts any size whose edges are multiples of 16, max edge ≤ 3840, long:short ≤ 3:1, and total pixels in [655,360, 8,294,400] — every SIZE_MAP size passes directly except `icon` (512×512 is below the pixel minimum, snapped to 1024×1024) and the 21:9 banners (generated natively at 1344×576 instead of cropping 16:9). User-supplied sizes go through `adaptSizeForGptImage()`. Nano Banana Pro takes `aspect_ratio` + `image_size` (`1K/2K/4K`); all ratios used here are native, and unsupported ratios snap to the nearest via `adaptAspectRatioForGemini()`.

### Endpoints

| Provider | Model | Default Base URL |
| --- | --- | --- |
| OpenAI | `gpt-image-2` | `https://api.openai.com/v1` (`/images/generations`) |
| Google | `gemini-3-pro-image` | `https://generativelanguage.googleapis.com/v1beta` (Interactions API `/interactions`) |

Official docs: [OpenAI image generation](https://developers.openai.com/api/docs/guides/image-generation) · [Gemini image generation](https://ai.google.dev/gemini-api/docs/image-generation)

---

## 🧪 QA Expectations

Before delivering a real deck, render and inspect:

```bash
soffice --headless --convert-to pdf deck.pptx
pdftoppm -jpeg -r 100 deck.pdf slide
```

Watch for: CJK overflow, cropped full-width punctuation, unreadable text on images, QR contrast, footer collisions, AI image aspect mismatches. `render-qa.mjs` automates the deterministic checks.

### About `npm audit` warnings

`npm ci` reports two high-severity advisories against `image-size` ([GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq)). They affect **every published `image-size` version (<= 2.0.2)** and arrive transitively through `pptxgenjs`, so they cannot be fixed from this repo: overriding to `image-size@2.x` breaks `pptxgenjs` (2.x removed the callable default export), and the only `npm audit fix --force` "fix" downgrades `pptxgenjs` to the 2018 `1.1.5` API. Both advisories are denial-of-service bugs in the ICNS/JXL/HEIF parsers, only triggerable by feeding `pptxgenjs` a maliciously crafted image file — not a realistic input for locally generated deck assets. Track the upstream `pptxgenjs` bump instead; do not paper over this with dependency overrides.

### Color QA rules

- Body text / URLs / footnotes: **≥ 4.5:1**
- Large titles / icons / borders / UI: **≥ 3:1**
- Never use a saturated accent as body text
- Never rely on red/green alone for status
- Text over AI images needs a 40–55% overlay

---

## 🧭 Where this sits vs. `guizang-ppt-skill`

`guizang-ppt-skill` is a mature **single-file HTML horizontal-slide deck** skill — browser-first, strong aesthetic templates. This repo is a **different route, not a competitor**.

| Dimension | `guizang-ppt-skill` | `slide-recipes` (this repo) |
| --- | --- | --- |
| **Output** | single-file HTML, browser | real editable `.pptx`, PowerPoint |
| **Best for** | offline talks, demo days, personal keynotes | decks delivered as `.pptx`, edited later, stable Chinese type |
| **Aesthetic system** | two fixed templates (magazine, Swiss) | nine recipes + extensible theme system |
| **QA approach** | HTML layout validator (`data-layout`) | PPTX render + heuristic QA, CJK overflow, editable-text, color contrast |
| **Image** | Codex/GPT-Image into HTML | provider layer (GPT Image 2 / Nano Banana Pro) returning PPTX layout metadata |

**Two routes, complementary.** Browser talks → HTML; deliverable `.pptx` → this repo.

---

## 📦 Platform Support

| Platform | Status | Notes |
| --- | --- | --- |
| Claude Code / Codex / ZCode | ✅ supported | native skill workflow |
| Cursor / local Agents | ✅ usable | needs file read/write + shell |
| CI (GitHub Actions) | ✅ tested | Node 20/22 matrix, npm ci, smoke + color QA + demo builds + render QA |
| Plain chatbot | ⚠️ not recommended | without a filesystem + shell, stable PPTX + QA is hard |

---

## 📁 Repository Layout

```text
slide-recipes/
  README.md            README.zh-CN.md      docs/                 # rendered demo images (committed)
  package.json
  .github/workflows/ci.yml
  examples/
    build_miku_demo.mjs  build_editorial_demo.mjs  build_darklaunch_demo.mjs
    color-qa.sample.json  color-qa.presets.json  cjk-overflow.sample.json  render-qa.sample.json
    slides/output/        # the committed .pptx demos — open & edit in PowerPoint
      miku-demo.pptx  editorial-demo.pptx  darklaunch-demo.pptx
  scripts/            # repo dev/CI tooling only (not part of the installed skill)
    validate-skills.mjs  smoke-test.mjs  color-qa-presets.mjs
  skills/themed-cn-pptx/          # ← everything here is what `npx skills add` installs
    SKILL.md
    scripts/    render-qa.mjs  cjk-overflow-check.mjs  color-qa.mjs  pptx-editable-check.py
    references/ aesthetic-rules.md  image-constraints.md  layout-slots.md  design-principles.md
    recipes/    recipe-editorial-grid.mjs  recipe-dark-launch.mjs  design-contract*.md
    lib/        ai-image.js  stepfun-image.js  cjk-text.js  pptx-shapes.js  zip-reader.js
```

---

## 🤝 Suitable / not suitable

**✅ Suitable** — needs a `.pptx` deliverable / later editing in PowerPoint / stable Chinese typography / QR closing slide / verifiable CI-gated build.

**❌ Not suitable** — only need a browser presentation (use an HTML deck skill) / large animated data dashboards / decks that must never touch PowerPoint.

## 🖋️ IP & Character Theme Note

For character/IP-themed decks, prefer color systems, abstract visual motifs, and user-provided licensed assets. Do not imply official endorsement; do not generate trademarked character art unless the user has rights or explicitly asks for a legally-safe, inspired-by direction.

## 🤝 Contribute

Got a PPT skill recipe? Submit a PR under:

```text
skills/<skill-name>/SKILL.md
skills/<skill-name>/lib/          # optional utility code
skills/<skill-name>/examples/     # optional build scripts
```

## License

[MIT](LICENSE)

## Codex · Recipes & custom image APIs

The recipe collection includes research-report, product-story, magazine-story and roadmap-brief.
See [recipe catalog](skills/themed-cn-pptx/references/recipe-catalog.md) for content-driven builders and aesthetic constraints.

Install the complete skill in Codex with the existing skills installer, or copy `skills/themed-cn-pptx` into your Codex skills directory. Restart/reload skill discovery if needed.
The image CLI travels with the skill and runs on Node >=20, without this repository or npm dependencies:

```bash
node "$SKILL_DIR/scripts/generate-image.mjs" --check
node "$SKILL_DIR/scripts/generate-image.mjs" image-request.json
```

[Configuration guide](skills/themed-cn-pptx/references/image-providers.md): OpenAI-compatible custom endpoints, Google/Nano, Bailian synchronous images and MiniMax. Exact model IDs are configurable; `gpt-image-2.5` is an example only when your service exposes it. Keys stay in the deck project's environment. Codex native image generation is used only when that tool is available.

### Commercial presentation recipes

Three original systems researched from Pinterest and commercial template previews: **investor-signal**, **editorial-proposal**, **studio-monochrome**. Each supports 18 page/element APIs, including native editable charts, business dashboards, case studies and scope/investment pages.

- [Research and source notes](skills/themed-cn-pptx/references/design-research.md)
- [Recipe API and visual contracts](skills/themed-cn-pptx/references/commercial-recipes.md)
- Run `npm run demo:commercial` to generate three 8-slide decks with clearly labeled fictional content; no API keys or vendor assets needed.

| Investor signal | Editorial proposal | Studio monochrome |
| --- | --- | --- |
| ![Investor](docs/img/commercial/investor-signal.jpg) | ![Editorial](docs/img/commercial/editorial-proposal.jpg) | ![Studio](docs/img/commercial/studio-monochrome.jpg) |
