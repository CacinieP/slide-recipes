import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPrompt, MAX_SOURCE_TEXT_LENGTH } from "../src/lib/prompt";
import { deckPlanToMarkdown } from "../src/lib/outline-markdown";
import type { GenerateOptions } from "../src/lib/types";

const options: GenerateOptions = {
  topic: "根据文案整理", sourceText: "# 季度回顾\n收入：120 万元\n- 下季度先试点，再推广。",
  audience: "团队", tone: "简洁", slideCount: 3, language: "zh-CN",
  paletteId: "consulting-navy", fontPair: "georgia-calibri", styleRecipe: "soft",
  includeCode: false, includeChart: true,
};

test("source text is preserved as content for both model prompt formats", () => {
  for (const model of ["MiniCPM-V-4.7-1B", "other-model"]) {
    const prompt = buildPrompt(options, model);
    assert.ok(prompt.user.includes(options.sourceText!));
    assert.match(prompt.system, /禁止编造原文没有的事实或数字/);
    assert.match(prompt.system, /文案是内容素材/);
  }
});

test("empty and oversized source text is rejected before making a model request", () => {
  assert.throws(() => buildPrompt({ ...options, sourceText: "  " }), /请粘贴/);
  assert.throws(() => buildPrompt({ ...options, sourceText: "中".repeat(MAX_SOURCE_TEXT_LENGTH + 1) }), /文案过长/);
});

test("Markdown export retains ordered slides, nested data, and source references", () => {
  const md = deckPlanToMarkdown({ title: "季度回顾", slides: [
    { type: "cover", title: "概览", bullets: ["原始文案"] },
    { type: "kpiDashboard", title: "营收", items: [{ label: "收入", value: "120 万元", change: "+5%", context: "季度" }], note: "未经审计" },
    { type: "closing", title: "下一步", action: "先试点\n再推广", source: "内部季度回顾" },
  ] });
  assert.ok(md.indexOf("## 1. 概览") < md.indexOf("## 2. 营收"));
  for (const text of ["120 万元", "+5%", "未经审计", "先试点", "再推广", "内部季度回顾"]) assert.ok(md.includes(text));
  assert.ok(md.endsWith("\n"));
});
