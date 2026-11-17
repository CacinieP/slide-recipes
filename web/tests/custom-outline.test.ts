import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCustomOutlineJson } from "../src/lib/prompt";
import { SLIDE_TYPES } from "../src/lib/types";

const validDeck = {
  title: "自定义商业全景汇报",
  slides: [
    { type: "cover", title: "自定义商业全景汇报", subtitle: "让结构与数据说话" },
    { type: "kpiDashboard", title: "关键业务指标", items: [{ label: "ARR", value: "120M" }] },
    { type: "closing", title: "感谢关注", action: "推进落地" },
  ],
};

test("a well-formed custom outline passes through unchanged", () => {
  const plan = parseCustomOutlineJson(JSON.stringify(validDeck));
  assert.equal(plan.title, validDeck.title);
  assert.equal(plan.slides.length, 3);
  assert.equal(plan.slides[1].type, "kpiDashboard");
});

test("unknown slide types fall back to content instead of crashing the renderer", () => {
  const deck = {
    title: "类型容错",
    slides: [
      { type: "cover", title: "封面" },
      { type: "totally-made-up", title: "未知类型页", body: "正文" },
      { type: "closing", title: "收尾", action: "下一步" },
    ],
  };
  const plan = parseCustomOutlineJson(JSON.stringify(deck));
  assert.equal(plan.slides[1].type, "content");
});

test("structural drift is healed: first/last pages normalized, missing titles filled", () => {
  const deck = {
    title: "结构自愈",
    slides: [
      { type: "content", title: "其实是封面" },
      { type: "content", body: "只有正文没有标题" },
      { type: "content", title: "其实是收尾" },
    ],
  };
  const plan = parseCustomOutlineJson(JSON.stringify(deck));
  assert.equal(plan.slides[0].type, "cover");
  assert.equal(plan.slides.at(-1)?.type, "closing");
  assert.ok(plan.slides[1].title.trim().length > 0);
});

test("every declared slide type is accepted by the custom JSON path", () => {
  const slides = [
    { type: "cover", title: "封面" },
    ...SLIDE_TYPES.filter((t) => t !== "cover" && t !== "closing").map((t) => ({ type: t, title: `${t} 页`, body: "内容" })),
    { type: "closing", title: "收尾", action: "行动" },
  ];
  const plan = parseCustomOutlineJson(JSON.stringify({ title: "全类型", slides }));
  assert.equal(plan.slides.length, SLIDE_TYPES.length);
});

test("empty input, broken JSON and non-object payloads raise friendly errors", () => {
  assert.throws(() => parseCustomOutlineJson("   "), /填入自定义大纲/);
  assert.throws(() => parseCustomOutlineJson("{broken"), /自定义 JSON 解析失败/);
  assert.throws(() => parseCustomOutlineJson("[1,2,3]"), /JSON 对象/);
  assert.throws(() => parseCustomOutlineJson('"text"'), /JSON 对象/);
});

test("missing or unusable slides arrays are rejected with guidance", () => {
  assert.throws(() => parseCustomOutlineJson(JSON.stringify({ title: "无页" })), /自定义大纲无效/);
  assert.throws(() => parseCustomOutlineJson(JSON.stringify({ title: "单页", slides: [{ type: "cover", title: "仅一页" }] })), /自定义大纲无效/);
});