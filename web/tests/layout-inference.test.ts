import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPrompt, inferRichLayouts } from "../src/lib/prompt";
import type { DeckPlan, GenerateOptions, SlidePlan } from "../src/lib/types";

const options: GenerateOptions = {
  topic: "项目交付计划",
  audience: "项目团队",
  tone: "专业、清晰",
  slideCount: 6,
  language: "zh-CN",
  paletteId: "consulting-navy",
  fontPair: "georgia-calibri",
  styleRecipe: "soft",
  includeCode: false,
  includeChart: false,
};

function flatDeck(middleBodies: string[]): DeckPlan {
  const slides: SlidePlan[] = [
    { type: "cover", title: "封面", bullets: ["副标题"] },
    ...middleBodies.map((body, i) => ({ type: "content" as const, title: `要点 ${i + 1}`, body })),
    { type: "closing", title: "收尾", action: "下一步" },
  ];
  return { title: "测试大纲", slides };
}

test("sequence-marked bodies become processFlow with split steps", () => {
  const plan = flatDeck([
    "第一阶段：完成基础平台搭建与核心数据接入；第二阶段：完善治理体系并推广服务化；第三阶段：深化智能应用与生态闭环。",
    "普通内容页，没有结构信号。",
    "另一段普通内容，讲述背景与意义。",
  ]);
  const out = inferRichLayouts(plan);
  const flow = out.slides[1];
  assert.equal(flow.type, "processFlow");
  assert.equal(flow.steps?.length, 3);
  assert.equal(flow.steps?.[0].title, "第一阶段");
  assert.ok(flow.steps?.[0].body.includes("基础平台"));
  assert.equal(flow.body, undefined);
  assert.equal(out.slides[2].type, "content");
});

test("a prominent number in a short body becomes statCallout", () => {
  const plan = flatDeck([
    "复购会员贡献了 62% 的营收，是门店增长的核心动力。",
    "普通内容页，没有结构信号。",
    "另一段普通内容，讲述背景与意义。",
  ]);
  const out = inferRichLayouts(plan);
  const stat = out.slides[1];
  assert.equal(stat.type, "statCallout");
  assert.equal(stat.stat, "62%");
  assert.ok(stat.takeaway?.includes("复购会员"));
  assert.equal(stat.body, undefined);
});

test("bodies without explicit signals stay untouched", () => {
  const plan = flatDeck([
    "我们重视数据治理，因为它决定了分析结论的可信度。",
    "团队协作需要统一的口径与清晰的职责边界。",
    "持续复盘才能让经验沉淀为可复用的方法。",
  ]);
  const out = inferRichLayouts(plan);
  assert.deepEqual(out, plan);
});

test("short decks, cover and closing are never modified", () => {
  const short = flatDeck(["首先明确目标与范围；其次拆解任务；最后验收复盘。"]);
  assert.deepEqual(inferRichLayouts(short), short);

  const plan = flatDeck([
    "首先明确目标与范围；其次拆解任务并分配责任人；最后验收复盘并沉淀经验。",
    "复购率达到 62% 的水平。",
    "普通内容。",
  ]);
  const out = inferRichLayouts(plan);
  assert.equal(out.slides[0].type, "cover");
  assert.equal(out.slides.at(-1)?.type, "closing");
});

test("at most two pages are upgraded per deck", () => {
  const plan = flatDeck([
    "首先明确目标与范围；其次拆解任务并分配责任人；最后验收复盘并沉淀经验。",
    "复购率达到 62% 的水平。",
    "第一阶段完成调研；第二阶段开展试点；第三阶段全面推广。",
  ]);
  const out = inferRichLayouts(plan);
  const upgraded = out.slides.filter((s) => s.type !== "content" && s.type !== "cover" && s.type !== "closing");
  assert.equal(upgraded.length, 2);
  assert.equal(out.slides[3].type, "content");
});

test("long number-bearing bodies are not turned into stat cards", () => {
  const longBody = "本季度营收增长 62%，主要来自会员复购与早餐组合的扩大供应；同时门店人效提升明显，排班优化减少了高峰等待，顾客满意度随之改善，后续将继续扩大储值优惠覆盖，并把成功经验复制到新开门店。";
  const plan = flatDeck([longBody, "普通内容一。", "普通内容二。"]);
  const out = inferRichLayouts(plan);
  assert.equal(out.slides[1].type, "content");
});

test("the upgraded 1B prompt enforces depth, audience consistency and cover rules", () => {
  const { system } = buildPrompt(options, "MiniCPM-V-4.7-1B");
  assert.match(system, /2–3 句具体信息/);
  assert.match(system, /禁止.*空话/);
  assert.match(system, /受众以主题描述为准/);
  assert.match(system, /禁止写“目录”“封面”“简介”/);
  assert.match(system, /深度示例/);
  assert.match(system, /不夹杂其他语言词汇/);
  assert.match(system, /具体的下一步行动/);
});

test("the recommended 35B-A3B model receives the full 27-type design system", () => {
  const { system } = buildPrompt(options, "MiniCPM-V-4.7-35B-A3B");
  assert.match(system, /SUPPORTED SLIDE TYPES/);
  assert.match(system, /architectureStack/);
  assert.match(system, /kpiDashboard/);
});

test("1B responses with raw newlines inside string values are repaired", async () => {
  const { parseModelResponse, normalizeModelPlan } = await import("../src/lib/prompt");
  const broken = '{"title":"测试","page_1_title":"封面","page_1_body":"第一行\n第二行","page_2_title":"要点","page_2_body":"结论一。\n结论二。","page_3_title":"收尾","page_3_body":"下一步行动"}';
  const parsed = parseModelResponse(broken, "MiniCPM-V-4.7-1B") as Record<string, string>;
  assert.equal(parsed.page_1_body, "第一行\n第二行");
  const { plan } = normalizeModelPlan(parsed, 3, "MiniCPM-V-4.7-1B");
  assert.ok(plan);
  assert.equal(plan.slides.length, 3);
});

test("raw-control repair combines with redundant trailing braces", async () => {
  const { parseModelResponse } = await import("../src/lib/prompt");
  const broken = '{"title":"测试","page_1_title":"封面","page_1_body":"行一\n行二"}}';
  const parsed = parseModelResponse(broken, "MiniCPM-V-4.7-1B") as Record<string, string>;
  assert.equal(parsed.page_1_body, "行一\n行二");
});

test("non-1B models are not silently repaired", async () => {
  const { parseModelResponse } = await import("../src/lib/prompt");
  const broken = '{"title":"测试","body":"行一\n行二"}';
  assert.throws(() => parseModelResponse(broken, "gpt-4o"));
});

test("flat cover subtitle and closing action are capped to single-line boxes", async () => {
  const { normalizeModelPlan, healModelPlan, capFlatField } = await import("../src/lib/prompt");
  const long = "中台负责整合企业级数据，支持跨部门协同。核心功能包括数据清洗、建模与可视化，最终支撑业务决策。";
  const raw = {
    title: "测试",
    page_1_title: "封面", page_1_body: long,
    page_2_title: "要点", page_2_body: "正常正文。",
    page_3_title: "收尾", page_3_body: long,
  };
  const { plan } = normalizeModelPlan(raw, 3, "MiniCPM-V-4.7-1B");
  assert.ok(plan);
  assert.ok((plan.slides[0].bullets?.[0] ?? "").length <= 28);
  assert.ok((plan.slides[2].action ?? "").length <= 28);

  const healed = healModelPlan(raw);
  assert.ok(healed);
  assert.ok((healed.slides[0].bullets?.[0] ?? "").length <= 28);
  assert.ok((healed.slides.at(-1)?.action ?? "").length <= 28);

  assert.equal(capFlatField("短文本"), "短文本");
  assert.ok(capFlatField(long).length <= 28);
});