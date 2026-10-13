# Aesthetic Rules for CJK PPTX Decks

Use this reference when deciding visual direction before writing a PptxGenJS build script. Keep the deck inside one visual system instead of mixing attractive fragments.

## Visual System Contract

Every deck should declare these fields before implementation:

```json
{
  "style_id": "cjk-swiss-accent",
  "palette_contract": "neutral-body + one dominant + one accent",
  "layout_family": "grid, editorial, product-showcase, dark-launch",
  "image_style": "abstract tech, no embedded text, title-safe negative space",
  "density_level": "low | medium | high",
  "forbidden_styles": ["3d mascots", "purple-blue gradient SaaS default", "busy stock photo"]
}
```

## Recommended Style Families

| Style | Use For | Rules |
| --- | --- | --- |
| `cjk-swiss-accent` | technical/product decks, research summaries | grid-first, restrained typography, one strong accent, no decoration that does not align to grid |
| `cjk-editorial-ip` | character/IP-inspired decks | color and motifs carry the IP; do not generate official character art by default |
| `dark-tech-launch` | launch, keynote, final CTA | deep background, strong contrast, large type, image overlay required |
| `soft-product-brief` | product/business introduction | neutral surfaces, quiet cards, simple diagrams, low saturation |
| `matrix-analysis` | comparisons and frameworks | table/matrix layouts, high label clarity, avoid excessive illustration |

## Aesthetic Negative List

Treat these as design failures unless the user explicitly requests them and QA still passes:

1. One deck uses a different visual language on every slide.
2. Layouts change grid, typography or spacing arbitrarily; different information types may use different layouts inside one system.
3. Cards inside cards, nested framed sections, or decorative panels that do not carry information.
4. Purple/blue SaaS gradient as the default answer for every topic.
5. Any palette without a readable neutral contrast ladder.
6. 3D mascots, cartoon stickers, or stock-photo smiles in serious operational decks.
7. Full-bleed AI background competes with title text.
8. AI images contain fake UI chrome, fake logos, fake QR codes, watermarks, page numbers, or long text.
9. IP/character theme implies official endorsement or uses unlicensed official character art by default.
10. Chinese titles are oversized and collide with subtitles or all-width punctuation.
11. Low-contrast accent color is used as body text.
12. Chart/table colors require color alone to decode meaning.

## Layout Discipline

- Pick one layout family first, then vary only within that family.
- Use repeated elements: top stripe, section heading, footer, or corner mark. Do not invent a new signature on every slide.
- Keep title-safe areas consistent: cover/hero images should not place focal subjects or high-contrast detail under title text.
- Dense business slides should feel like tools: restrained spacing, clear hierarchy, aligned grids, readable labels.
- Expressive decks can be more visual, but text must remain editable PPTX text.

## QA Severity

| Severity | Aesthetic Issue |
| --- | --- |
| P0 | unreadable text, image/text collision, QR not scannable, layout breaks, API key leak |
| P1 | visual system inconsistency, wrong image ratio, unsafe color pair, missing image overlay |
| P2 | inconsistent spacing, repeated element drift, weak hierarchy, slightly busy background |
| P3 | polish: shadows, small alignment differences, icon style mismatch |

## 内容优先的审美规则

- 先写每页要证明的结论，再决定信息关系：证据→结论、过程→结果、时间→里程碑、前后对比。不要把所有关系都装进三张卡片。
- 在 10 × 5.625 英寸画布上，内容安全边距建议 0.5–0.6 英寸，列间距 0.25–0.4 英寸。实际字体测量与渲染优先于经验字符数。
- 投影演讲正文建议 16–20pt；11–12pt 只适合近距离阅读的密集报告或注释。超量文本先精简或拆页，不连续缩字。
- 结论、证据、来源构成三个明确层级。每页最多一个视觉主角；强调色可以用于足够对比度的短标题，长正文用中性色。
- 图表采用原生可编辑图表或真实来源图片。注明单位、时间范围、基数；不通过 AI 生图制造数据图、实验结果或产品截图。
- 同一组配图统一光线、视角、材质与色温。先确定图框比例与主体位置，再写提示词；封面文字区留白，避免主体被裁切。
- 一张有意义的证据图胜过多张装饰图。每 3–4 页调整一次密度；章节页、证据页、总结页有节奏差异，但保持同一字号与颜色系统。
- 页脚、下划线、角标是可选的品牌元素，不必每页同时出现。保持位置一致比装饰数量更重要。
- 暖白、棕色和深灰均可使用，前提是存在清晰中性色阶、阅读对比度与内容匹配；不得把颜色偏好当作普遍禁令。
- 交付检查同时看缩略图总览与单页：总览查节奏、颜色一致性，单页查汉字断行、图片裁切、来源可读性。静态 QA 通过不代表视觉 QA 完成。

选型详见 [recipe-catalog.md](recipe-catalog.md)。这些原则优先于下文或旧示例中的固定装饰偏好；用户指定视觉风格时保留其意图。

## 商业演示质量标准

研究依据与原创转译见 [design-research.md](design-research.md)，运行代码见 [commercial-recipes.md](commercial-recipes.md)。

- **结构完整**：封面→议程→判断→证据→比较→案例→范围→下一步；按目的删减，不能为了页数塞入无关页。
- **封面有专属构图**：文字主导、图像主导、非对称、深色几何可选。不能让所有 recipe 只是同一封面的颜色替换。
- **建立疏密节奏**：强观点页、可阅读数据页、过渡页交替；深色页通常用于开启/转场/收尾，不要求机械地黑白交替。
- **商业信息可读**：金额包含币种，指标包含时间/单位/基数，报价包含范围和例外。装饰不得挤压这些字段。
- **图表先讲比较关系**：最多强调一组数据；柱图零基线，单位明示，来源就近，标签不靠颜色单独区分；具体图表能力以 API 契约为准。
- **图片有出处**：客户作品用真实授权图片，构思图注明示意。没有照片时可用原创原生几何构图，不交付大面积空白占位框。
- **中文不是替换英文字体**：减少斜排和大幅字距；允许语义换行；英文单词不拆断；禁止靠缩至小字来塞满框。
- **整体一致、局部不同**：统一边距、字号阶、来源位置，按信息关系切换目录/图表/案例/对照/服务范围。布局种类不做武断的五种上限。
- **参考转译可追溯**：至少记 URL、查看日期、已观察的页面、可复用原则和改造方式；没看到的模板内容不作质量结论。

验收用 0/1/2 评分：信息层级、网格对齐、密度节奏、图像作用、数据可读性、可编辑性，每项分别代表失败/基本可用/清晰完整。
总分只能用作人工审阅辅助；任何文字遮挡、虚假证据、丢失数据或未授权素材不得被高分抵消。
