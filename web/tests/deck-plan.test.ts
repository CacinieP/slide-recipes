import assert from "node:assert/strict";
import { test } from "node:test";
import { requestLlmPlan } from "../src/lib/client-generator";
import { buildPrompt, normalizeModelPlan, parseModelResponse, validatePlan, healModelPlan, trimDeckPlan } from "../src/lib/prompt";
import type { DeckPlan, GenerateOptions } from "../src/lib/types";

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

function validPlan(count: number): DeckPlan {
  return {
    title: "项目交付计划",
    slides: Array.from({ length: count }, (_, index) => {
      if (index === 0) return { type: "cover", title: "项目交付计划" };
      if (index === count - 1) return { type: "closing", title: "确认交付安排", action: "团队确认下一步" };
      return { type: "content", title: `交付要点 ${index}`, body: "明确责任和验收要求" };
    }),
  };
}

function validFlatPlan(count: number): Record<string, string> {
  const raw: Record<string, string> = { title: "项目交付计划" };
  for (let page = 1; page <= count; page++) {
    raw[`page_${page}_title`] = `交付要点 ${page}`;
    raw[`page_${page}_body`] = `第 ${page} 页的具体说明`;
  }
  return raw;
}

for (const [requested, expected] of [[3, 3], [6, 6], [20, 20], [1, 3], [30, 20]] as const) {
  test(`the 1B prompt supplies flat text fields for exactly ${expected} pages (requested ${requested})`, () => {
    const { system, user } = buildPrompt({ ...options, slideCount: requested }, "MiniCPM-V-4.7-1B");
    const marker = "固定 JSON 结构：\n";
    const template = JSON.parse(system.slice(system.indexOf(marker) + marker.length)) as Record<string, unknown>;

    assert.deepEqual(Object.keys(template), Object.keys(validFlatPlan(expected)));
    assert.ok(Object.values(template).every((value) => typeof value === "string"));
    assert.match(system, new RegExp(`恰好生成 ${expected} 页`));
    assert.match(system, /不改名、不翻译、不新增、不删除、不重复键名/);
    assert.match(system, /不要输出数组或嵌套对象/);
    assert.match(system, /禁止直接返回空白模板或占位词/);
    assert.equal(system.includes("SUPPORTED SLIDE TYPES"), false);
    assert.equal(system.includes("architectureStack"), false);
    assert.match(user, /项目交付计划/);
  });
}

test("other models and unspecified models retain the full design-system prompt", () => {
  for (const model of [undefined, "gpt-4o", "MiniCPM-V-4.7-35B-A3B"]) {
    const { system } = buildPrompt(options, model);
    assert.match(system, /SUPPORTED SLIDE TYPES/);
    assert.match(system, /kpiDashboard/);
    assert.match(system, /architectureStack/);
    assert.match(system, /Target length: approximately 6 slides/);
    assert.match(system, /slides\[last\]\.type MUST be 'closing'/);
  }
});

for (const count of [3, 6]) {
  test(`validatePlan accepts a valid ${count}-page deck`, () => {
    const { plan, error } = validatePlan(validPlan(count), count);
    assert.equal(error, undefined);
    assert.equal(plan?.slides.length, count);
    assert.equal(plan?.slides[0].type, "cover");
    assert.equal(plan?.slides.at(-1)?.type, "closing");
  });
}

for (const actualCount of [5, 7, 24]) {
  test(`validatePlan flexibly accepts ${actualCount} pages when six were requested (approximate count)`, () => {
    const raw = validPlan(actualCount);
    const snapshot = structuredClone(raw);
    const { plan, error } = validatePlan(raw, 6);
    assert.equal(error, undefined);
    assert.equal(plan?.slides.length, actualCount);
    assert.deepEqual(raw, snapshot);
  });
}

test("validatePlan rejects when fewer than 2 slides are provided", () => {
  const raw = { title: "单页文稿", slides: [{ type: "cover", title: "单页封面" }] };
  const { plan, error } = validatePlan(raw, 6);
  assert.equal(plan, null);
  assert.match(error || "", /大纲页面数量过少/);
});

test("validatePlan rejects the observed seven-page 1B output instead of trimming it", () => {
  const raw = {
    title: "项目交付计划",
    slides: ["cover", "section", "section", "section", "section", "section", "cover"]
      .map((type, index) => ({ type, title: `页面 ${index + 1}` })),
  };
  assert.equal(validatePlan(raw, 6).plan, null);
  assert.equal(normalizeModelPlan(raw, 6, "MiniCPM-V-4.7-1B").plan, null);
  assert.equal(raw.slides.length, 7);
});

test("validatePlan rejects a non-cover opening", () => {
  const raw = validPlan(6);
  raw.slides[0].type = "content";
  const result = validatePlan(raw, 6);
  assert.equal(result.plan, null);
  assert.match(result.error || "", /第一页必须是 cover/);
});

for (const lastType of ["cover", "summary"] as const) {
  test(`validatePlan rejects ${lastType} as the closing page`, () => {
    const raw = validPlan(6);
    raw.slides[5].type = lastType;
    const result = validatePlan(raw, 6);
    assert.equal(result.plan, null);
    assert.match(result.error || "", /最后一页必须是 closing/);
  });
}

test("validatePlan rejects an unusable interior slot rather than silently removing it", () => {
  const raw = validPlan(3);
  raw.slides[1] = { type: "content", title: "" };
  const result = validatePlan(raw, 3);
  assert.equal(result.plan, null);
  assert.match(result.error || "", /包含无效页面/);
  assert.equal(raw.slides.length, 3);
});

test("the client uses the 1B prompt and rejects wrong page counts without another model call", async (t) => {
  const calls: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(String(input));
    const body = JSON.parse(String(init?.body)) as { messages: Array<{ content: string }> };
    assert.match(body.messages[0].content, /固定 JSON 结构/);
    assert.equal(body.messages[0].content.includes("SUPPORTED SLIDE TYPES"), false);
    return Response.json({ choices: [{ message: { content: JSON.stringify(validFlatPlan(7)) } }] });
  });

  await assert.rejects(requestLlmPlan(options, {
    baseUrl: "https://api.modelbest.cn/v1",
    model: "MiniCPM-V-4.7-1B",
    apiKey: "test-api-key",
  }), /超出固定模板/);
  assert.deepEqual(calls, ["/api/proxy"]);
});

for (const count of [3, 6]) {
  test(`flat ${count}-page text becomes a fixed cover/content/closing deck without changing content`, () => {
    const raw = validFlatPlan(count);
    const snapshot = structuredClone(raw);
    const { plan, error } = normalizeModelPlan(raw, count, "MiniCPM-V-4.7-1B");
    assert.equal(error, undefined);
    assert.equal(plan?.title, raw.title);
    assert.equal(plan?.slides.length, count);
    assert.equal(plan?.slides[0].type, "cover");
    assert.deepEqual(plan?.slides[0].bullets, [raw.page_1_body]);
    for (let page = 2; page < count; page++) {
      assert.equal(plan?.slides[page - 1].type, "content");
      assert.equal(plan?.slides[page - 1].title, raw[`page_${page}_title`]);
      assert.equal(plan?.slides[page - 1].body, raw[`page_${page}_body`]);
    }
    assert.equal(plan?.slides.at(-1)?.type, "closing");
    assert.equal(plan?.slides.at(-1)?.action, raw[`page_${count}_body`]);
    assert.deepEqual(raw, snapshot);
  });
}

for (const [field, value] of [
  ["title", undefined],
  ["page_2_title", undefined],
  ["page_2_body", undefined],
  ["page_3_body", "   "],
  ["page_4_title", ""],
  ["page_5_body", 123],
] as const) {
  test(`flat output rejects a missing or empty/non-string ${field} (${String(value)})`, () => {
    const raw: Record<string, unknown> = validFlatPlan(6);
    if (value === undefined) delete raw[field];
    else raw[field] = value;
    const { plan, error } = normalizeModelPlan(raw, 6, "MiniCPM-V-4.7-1B");
    assert.equal(plan, null);
    assert.match(error || "", new RegExp(`非空文本字段 ${field}`));
  });
}

test("flat output rejects extra page fields instead of trimming them", () => {
  const raw = validFlatPlan(7);
  const { plan, error } = normalizeModelPlan(raw, 6, "MiniCPM-V-4.7-1B");
  assert.equal(plan, null);
  assert.match(error || "", /超出固定模板/);
  assert.equal(raw.page_7_title, "交付要点 7");
});

test("the observed agenda/content/closing response cannot bypass the flat 1B contract", () => {
  const raw = { title: "项目交付计划", agenda: ["安排"], content: ["说明"], closing: { action: "确认" } };
  assert.equal(normalizeModelPlan(raw, 6, "MiniCPM-V-4.7-1B").plan, null);
});

test("generic models keep the existing nested-plan validation path", () => {
  const raw = validPlan(6);
  assert.deepEqual(normalizeModelPlan(raw, 6, "gpt-4o"), validatePlan(raw, 6));
  assert.equal(normalizeModelPlan(validFlatPlan(6), 6, "gpt-4o").plan, null);
});

test("ordinary JSON and outer JSON fences preserve the complete response", () => {
  const raw = validFlatPlan(6);
  const json = JSON.stringify(raw);
  for (const model of ["MiniCPM-V-4.7-1B", "gpt-4o"]) {
    assert.deepEqual(parseModelResponse(json, model), raw);
    assert.deepEqual(parseModelResponse(`\n\`\`\`json\n${json}\n\`\`\`\n`, model), raw);
  }
});

for (const extraBraces of ["}", "}}", "} \n } \t }"]) {
  test(`1B removes only the bounded redundant closing-brace tail ${JSON.stringify(extraBraces)}`, () => {
    const raw = validFlatPlan(6);
    const repaired = parseModelResponse(`${JSON.stringify(raw)}${extraBraces}`, "MiniCPM-V-4.7-1B");
    assert.deepEqual(repaired, raw);
    assert.equal(normalizeModelPlan(repaired, 6, "MiniCPM-V-4.7-1B").plan?.slides.length, 6);
  });
}

test("brace scanning ignores quoted braces, escaped quotes and backslashes", () => {
  const raw = validFlatPlan(6);
  raw.page_2_body = '正文包含 }、{、引号 " 和反斜杠 \\，不应被截断。';
  assert.deepEqual(parseModelResponse(`${JSON.stringify(raw)}}`, "MiniCPM-V-4.7-1B"), raw);
  const nested = { title: "保留原对象", nested: { body: '}"\\' } };
  assert.deepEqual(parseModelResponse(`${JSON.stringify(nested)}}`, "MiniCPM-V-4.7-1B"), nested);
  assert.equal(normalizeModelPlan(nested, 6, "MiniCPM-V-4.7-1B").plan, null);
});

for (const tail of [" meaningful text", '{}', "[]", ",[]", "}}}}", "]}"]) {
  test(`1B syntax repair rejects meaningful or unbounded trailing content ${JSON.stringify(tail)}`, () => {
    assert.throws(() => parseModelResponse(`${JSON.stringify(validFlatPlan(6))}${tail}`, "MiniCPM-V-4.7-1B"), SyntaxError);
  });
}

test("syntax repair never invents a missing brace, quote or field", () => {
  assert.throws(() => parseModelResponse('{"title":"未闭合"', "MiniCPM-V-4.7-1B"), SyntaxError);
  assert.throws(() => parseModelResponse('{"title":"未闭合字符串}}', "MiniCPM-V-4.7-1B"), SyntaxError);
  const raw = validFlatPlan(6);
  delete raw.page_4_body;
  const parsed = parseModelResponse(`${JSON.stringify(raw)}}`, "MiniCPM-V-4.7-1B");
  assert.equal(normalizeModelPlan(parsed, 6, "MiniCPM-V-4.7-1B").plan, null);
});

test("other models do not receive redundant-brace repair", () => {
  assert.throws(() => parseModelResponse(`${JSON.stringify(validPlan(6))}}`, "gpt-4o"), SyntaxError);
});

test("the client repairs the observed double-closing-brace 1B response locally without a second call", async (t) => {
  const calls: string[] = [];
  const raw = validFlatPlan(6);
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return Response.json({ choices: [{ message: { content: `${JSON.stringify(raw)}}` } }] });
  });
  const result = await requestLlmPlan(options, {
    baseUrl: "https://api.modelbest.cn/v1",
    model: "MiniCPM-V-4.7-1B",
    apiKey: "test-api-key",
  });
  assert.equal(result.slides.length, 6);
  assert.equal(result.slides[1].body, raw.page_2_body);
  assert.deepEqual(calls, ["/api/proxy"]);
});

test("healModelPlan gracefully recovers 24 slides when 20 were requested", () => {
  const raw = validPlan(24);
  const healed = healModelPlan(raw, 20);
  assert.ok(healed);
  assert.equal(healed.slides.length, 24);
  assert.equal(healed.slides[0].type, "cover");
  assert.equal(healed.slides.at(-1)?.type, "closing");
});

test("healModelPlan corrects missing cover opening and missing closing tail", () => {
  const raw = {
    title: "自愈测试演示",
    slides: [
      { type: "content", title: "第一页本应为封面", body: "导言内容" },
      { type: "kpiDashboard", title: "核心指标", items: [{ label: "ARR", value: "10M" }] },
      { type: "content", title: "最后一页本应为结语", body: "后续行动" },
    ],
  };
  const healed = healModelPlan(raw, 3);
  assert.ok(healed);
  assert.equal(healed.slides[0].type, "cover");
  assert.equal(healed.slides[2].type, "closing");
});

test("trimDeckPlan trims 24 slides to 20 slides while preserving cover and closing", () => {
  const raw = validPlan(24);
  const trimmed = trimDeckPlan(raw, 20);
  assert.equal(trimmed.slides.length, 20);
  assert.equal(trimmed.slides[0].type, "cover");
  assert.equal(trimmed.slides[19].type, "closing");
  assert.equal(trimmed.slides[0].title, raw.slides[0].title);
  assert.equal(trimmed.slides[19].title, raw.slides[23].title);
});

test("requestLlmPlan recovers and returns full deck when generic model outputs 24 slides for 20 requested", async (t) => {
  const raw = validPlan(24);
  t.mock.method(globalThis, "fetch", async () => {
    return Response.json({ choices: [{ message: { content: JSON.stringify(raw) } }] });
  });

  const result = await requestLlmPlan({ ...options, slideCount: 20 }, {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o",
    apiKey: "test-openai-key",
  });

  assert.equal(result.slides.length, 24);
  assert.equal(result.slides[0].type, "cover");
  assert.equal(result.slides[23].type, "closing");
});

test("requestLlmPlan recovers and returns valid deck when 1B response is missing page_6_title", async (t) => {
  const raw: Record<string, unknown> = validFlatPlan(6);
  delete raw.page_6_title;
  t.mock.method(globalThis, "fetch", async () => {
    return Response.json({ choices: [{ message: { content: JSON.stringify(raw) } }] });
  });

  const result = await requestLlmPlan(options, {
    baseUrl: "https://api.modelbest.cn/v1",
    model: "MiniCPM-V-4.7-1B",
    apiKey: "test-api-key",
  });

  assert.ok(result.slides.length >= 5);
  assert.equal(result.slides[0].type, "cover");
  assert.equal(result.slides.at(-1)?.type, "closing");
});

