# Palette distillation / 色板蒸馏方法

How the muted editorial & heritage families in
[`business-palette.js`](../skills/slide-recipes/lib/business-palette.js) were produced,
so future palettes can be added the same way. The pipeline works on any collection of
slide decks and emits only abstract color tokens — no deck files, images, fonts or
vendor metadata are committed.

## Pipeline

1. **Collect candidate hues.** Unzip each deck (OOXML) and count every
   `srgbClr val="RRGGBB"` occurrence across `ppt/slides/*.xml`,
   `ppt/slideMasters/*.xml` and `ppt/slideLayouts/*.xml`. Frequency ≈ design intent;
   one-off colors are noise.
2. **Cluster and rank.** Merge near-duplicates (ΔE-ish by eye, or quantize to a
   small grid) and keep the top ~10 colors per deck. Discard pure
   `000000`/`FFFFFF` unless they carry the identity of the design.
3. **Map to the 8 semantic roles.** Pick, per palette:
   - `paper` — dominant light background
   - `ink` — darkest text color (aim ≥ 10:1 on paper)
   - `muted` — mid-tone for secondary text
   - `accent` — the signature saturated color, darkened until readable
   - `highlight` — light tint of the accent family for dark backgrounds
   - `line` — border/divider tone, close to paper
   - `dark` / `light` — dark-slide background and its text color
4. **Contrast calibration.** Every palette must pass the same gate as CI:
   `ink/paper`, `muted/paper`, `accent/paper`, `light/dark`, `highlight/dark`
   at **≥ 4.5:1** (WCAG AA, body text). If a pair fails, darken the foreground
   toward black (or lighten `highlight`/`light` toward white) in small steps and
   re-check with `contrastRatio` from `business-palette.js`.
5. **Register in three places.**
   - `skills/slide-recipes/lib/business-palette.js` — the palette object
   - `examples/color-qa.presets.json` — five contrast pairs per palette
     (role `body`), verified by `npm run color:qa:presets`
   - regenerate `docs/img/palette-gallery.svg` and
     `skills/slide-recipes/references/palette-catalog.md` via
     `node examples/build_palette_gallery.mjs` (sizes and counts are computed)

## Provenance & licensing notes

- Palettes are raw color tuples; they are not copyrightable on their own.
- Keep names descriptive of the *palette* (e.g. `clay-sunrise`), never of the
  deck it came from.
- Never commit deck files, thumbnails, embedded media, fonts or vendor strings.
- Recompute the QA ratios after any change: `npm run color:qa:presets`.
