# Case · 感知机问题深度解析

用 `themed-cn-pptx` skill 把一份中文学术汇报文稿（感知机线性不可分 / XOR）转成
**全原生可编辑图表**的 PPT，演示"从文稿到 PPT"（路径 B）的完整闭环。

## 内容

| 文件 | 说明 |
| --- | --- |
| `感知机问题.md` | 原始文稿（内容源） |
| `perceptron-学术靛.pptx` | 浅色版 · 学术靛配色（论文答辩向） |
| `perceptron-暗色创意.pptx` | 深色版 · Catppuccin Mocha 暗色创意配色 |
| `build_perceptron.mjs` | PptxGenJS 生成脚本（当前为暗色版；顶部 `C` 色板块可换回学术靛） |

## 亮点

- 15 页，中文 + 学术主题；XOR 四点图、"直墙工匠"失败直线图、`x₁x₂→OR/NAND→y` 网络结构图、
  原始空间 vs 特征空间变换对比图、五维对比表——**全部为 PptxGenJS 原生形状，可逐字编辑**。
- 走 skill 的三条 QA 门禁：`render-qa`（0 P0 / 0 P1）、`color-qa`（正文/强调对比度全部达 WCAG AA）、
  `pptx-editable-check`（可编辑契约成立）。
- 暗色版按"浅主色用深字"规则翻转文字方向：浅蓝/粉强调块上的表头、节点、编号统一用深色字。

## 重新生成

```bash
npm i pptxgenjs@4
node build_perceptron.mjs        # 输出 perceptron-deepdive.pptx
```

切换配色只需替换脚本顶部 `const C = { ... }` 色板块（学术靛见 skill `references/palette-catalog.md`）。
