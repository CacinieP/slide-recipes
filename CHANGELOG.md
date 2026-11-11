# Changelog / 更新日志

## 2026-11-11 — Muted editorial & heritage palettes / 低饱和编辑风与传统配色

### Added / 新增

- Added 11 business palettes: `clay-sunrise`, `pine-paper`, `xuan-cinnabar`, `crimson-scholar`, `deep-harbor`, `harbor-mist`, `sage-brush`, `plum-noir`, `oat-taupe`, `olive-rust`, and `slate-drizzle`. The Skill catalog now contains 39 semantic palettes.
- Added the same 11 presets to the Web palette picker, preview and PPTX export through the existing five-role mapping: `ink → primary`, `muted → secondary`, `accent → accent`, `highlight → light`, `paper → bg`. Web retains 18 existing inspiration palettes, for 57 presets total. The Web mapping does not expose the Skill’s separate `dark`, `light` and `line` roles.
- Added 55 contrast QA pairs and documented palette distillation and provenance. All 39 Skill palettes pass the runtime seven-pair 4.5:1 contrast gate.

### Fixed / 修复

- Regenerated the palette gallery and catalog so `plum-noir.light` matches the calibrated source value `F5F2F5`; the previous documented value `F3EEF2` failed the `light/accent` contrast gate.
- Gallery canvas dimensions and preset counts now derive from the palette list, avoiding clipped rows and stale labels.
- Updated Web documentation to distinguish 39 business palettes from 57 total presets. The public repository’s Web headline derives its count from the palette list.

### Deployment / 部署

- China: https://slides.linguistwantstech.online/ (EdgeOne Pages).
- Global: https://slide-recipes-web.vercel.app/ (Vercel).
- Both production sites build from `CacinieP/slide-recipes-web`, branch `main`, project root `web`. Web palette updates are synchronized separately from the public Skill repository. Each deployment keeps its existing UI and model proxy configuration.
