# Production reference / 制作操作参考

Shared by SKILL.md and SKILL.cn.md. Set `SKILL_DIR` to the installed skill directory; run commands from your writable project. Inspect dependencies first: Node >=20, Python 3, project-local PptxGenJS for builds; LibreOffice (`soffice`) and Poppler (`pdftoppm`) for visual renders. The standalone QA scripts do not imply these renderers or fonts are installed. Do not install globally or claim unavailable checks passed.

## Build and edit / 构建与修改

- Keep `build_<theme>.js`, assets and the final editable PPTX together. Inspect an existing build script first; if only PPTX exists, use an available PPTX parser (e.g. project-local python-pptx) to inventory text, shapes and images. Parsing is not lossless round-trip editing. Preserve untouched pages; disclose reconstruction limits before destructive conversion.
- Suggested project outputs: `assets/`, `output/deck.pptx`, `output/deck.md`, `output/deck.pdf`, `output/slide-*.jpg`. No fixed `/data` directory is required.
- Preserve native editable text, shapes and charts; do not rasterize whole slides. PptxGenJS colors use six-digit hex without `#`; use the specific API's transparency parameter, not eight-digit hex or a universal opacity field.
- Create a fresh shadow object for each shape. Check shape names against the installed PptxGenJS version rather than assuming a name exists.
- Very narrow text boxes (especially under 0.4 inch on this canvas) are risky; use intentional rotation for vertical labels rather than forcing a character stack.

## Images / 生图与素材

Read [image-providers.md](image-providers.md) for provider/endpoint/model configuration and [image-constraints.md](image-constraints.md) for the real prompt schema. No paid generation is required by this workflow.

```bash
node "$SKILL_DIR/scripts/generate-image.mjs" request.json
```

Library entry: `generateSlideImage({ provider, model, prompt, usage, saveDir })`; successful results expose `localPath`, missing keys return `null`. `listImageUsages(provider)` supplies supported usages. Keep configuration and credentials out of deck text, outlines and logs.

Select recipe and image slot before generating. Keep title-safe negative space, subject placement, light, material and color temperature consistent. Native PPT objects supply titles, labels, sources and QR codes. Use real authorized screenshots for evidence; label generated concepts as illustrative. Never generate fake results, logos or product UI as evidence.

Use contain/crop with original aspect ratio; 1360×768 is only approximately 16:9 (not exact), 1184×896 only approximately 4:3. Check returned dimensions rather than trusting a usage label. Keep image/text separation at least 0.2 inch on a 10-inch canvas. Prefer a clear text region; if needed add an overlay and measure the actual contrast. `addImageOverlay`'s historical `opacity` is 0–100 PptxGenJS transparency, not 0–1 opacity. No fixed percentage guarantees legibility.

Missing key/failure: record unmet image needs, reuse authorized assets or use a purposeful native diagram/solid background; do not present a placeholder as finished artwork. Retry or regenerate only with an explicit reason within agreed scope, not as an automatic QA ritual.

## Offline QR / 离线二维码

Check imports first; ReportLab and Pillow are optional, not preinstalled promises. If unavailable, use an existing trusted QR encoder or request project-local dependency installation. The encoder itself needs no network; the destination may.

```bash
python3 -c "from reportlab.graphics.barcode.qrencoder import QRCode; from PIL import Image"
```

Save this as `make_qr.py` in the project and run `python3 make_qr.py 'https://example.org' output/qr.png` (create `output/` first). This bypasses optional renderPM backends.

```python
import sys
from reportlab.graphics.barcode.qrencoder import QRCode, QRErrorCorrectLevel, QR8bitByte
from PIL import Image

url, target = sys.argv[1:3]
modules = None
for version in range(1, 41):
    try:
        qr = QRCode(version, QRErrorCorrectLevel.H)
        qr.addData(QR8bitByte(url))
        qr.make()
        modules = qr.modules
        break
    except Exception:
        continue
if modules is None:
    raise ValueError("QR payload could not be encoded; shorten or verify the URL")
n, scale, border = len(modules), 16, 4
img = Image.new("RGB", ((n + border * 2) * scale,) * 2, "white")
pixels = img.load()
for row in range(n):
    for col in range(n):
        if modules[row][col]:
            for dy in range(scale):
                for dx in range(scale):
                    pixels[(col + border) * scale + dx, (row + border) * scale + dy] = (0, 0, 0)
img.save(target)
```

Embed with `slide.addImage({ path: 'output/qr.png', x: 6.95, y: 2.15, w: 2.4, h: 2.4 })` on the 10×5.625-inch canvas. Keep square modules and four-module white quiet zone; a white panel on dark slides is functional, decorative borders are optional and must stay outside the quiet zone. Show a readable short URL and CTA. Verify the decoded destination and scan the final rendered/exported slide at intended viewing size; high correction level alone does not prove scannability.

## Technical QA / 技术检查

```bash
node "$SKILL_DIR/scripts/cjk-overflow-check.mjs" --text "你的标题" --font-size 32 --box-width 9
node "$SKILL_DIR/scripts/render-qa.mjs" output/deck.pptx --fix-hints
python3 "$SKILL_DIR/scripts/pptx-editable-check.py" output/deck.pptx
node "$SKILL_DIR/scripts/color-qa.mjs" --fg 0F2233 --bg F1FBFA --role body
```

Test every actual foreground/background pair, including muted sources, footer, table header, chart legend and QR URL. Palette all-pairs mode is a diagnostic, not proof that every color must contrast with every other color:

```bash
node "$SKILL_DIR/scripts/color-qa.mjs" --palette 0F2233,F1FBFA,39C5BB --role body
```

For the legacy stripe layout family only, optionally add `--contract "$SKILL_DIR/references/layout-slots.md"` to render-qa. Do not force its decorative slots onto unrelated recipes. Retain heuristic findings, document intentional exceptions, and never waive unreadable text or lost data as a style choice.

Contrast uses linearized sRGB relative luminance, not RGB distance: `(Llighter + .05) / (Ldarker + .05)`. Body/small text >=4.5:1; large text (>=18pt regular or >=14pt bold) and meaningful graphics >=3:1. Small labels still require 4.5:1. Check text against the actual image region, not just a nominal background color.

## Render and review / 渲染与审阅

```bash
soffice --headless --convert-to pdf --outdir output output/deck.pptx
pdftoppm -jpeg -r 100 output/deck.pdf output/slide
# After rebuilding and converting the corrected PPTX, inspect page N:
pdftoppm -jpeg -r 100 -f N -l N output/deck.pdf output/slide-fix
```

Remove/stage stale previews before regeneration. Static checks may still run without soffice; that is **not** visual acceptance. Inspect all rendered slides plus a thumbnail overview: semantic line breaks, punctuation, tofu glyphs, collisions, hierarchy, consistency, cropping, density rhythm, source readability and chart accuracy. Fix and recheck affected pages, then check for regressions. Report technical checks, visual inspection and user approval separately. If rendering is unavailable, explicitly state visual review pending; do not claim full QA.

## Palette examples / 色板入口

Use [palette-catalog.md](palette-catalog.md) for maintained named palettes and [design-principles.md](design-principles.md) for theory. Choose semantic roles from [aesthetic-rules.md](aesthetic-rules.md), then test actual pairs. A catalog palette is not a blanket WCAG certificate. IP colors should be verified against a reliable source; do not imply endorsement or invent an official palette.
