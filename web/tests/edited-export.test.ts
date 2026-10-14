import assert from "node:assert/strict";
import { test } from "node:test";
import JSZip from "jszip";
import { renderDeckPlanToBlob } from "../src/lib/client-generator";
import { deckPlanToMarkdown } from "../src/lib/outline-markdown";
import type { DeckPlan } from "../src/lib/types";

test("edited content and page order reach both exports without any model request", async () => {
  const plan: DeckPlan = { title: "编辑后的演示", slides: [
    { type: "cover", title: "修改后的封面", bullets: ["修改后的副标题"] },
    { type: "content", title: "新增页面", body: "由用户补充的正文" },
    { type: "content", title: "修改后的页面", body: "预算调整为 4500 元" },
    { type: "closing", title: "确认行动", action: "用户决定的下一步" },
  ] };
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Export must not call the model or network"); };
  let blobUrl: string | undefined;
  try {
    const rendered = await renderDeckPlanToBlob(plan, {
      paletteId: "consulting-navy", fontPair: "georgia-calibri", styleRecipe: "soft", language: "zh-CN",
    });
    blobUrl = rendered.blobUrl;
    const zip = await JSZip.loadAsync(await rendered.blob.arrayBuffer());
    const markdown = deckPlanToMarkdown(plan);
    for (const [index, slide] of plan.slides.entries()) {
      const xml = await zip.file(`ppt/slides/slide${index + 1}.xml`)!.async("string");
      assert.ok(xml.includes(slide.title));
      assert.ok(markdown.includes(`## ${index + 1}. ${slide.title}`));
      for (const text of [...(slide.bullets || []), slide.body, slide.action].filter(Boolean) as string[]) {
        assert.ok(xml.includes(text));
        assert.ok(markdown.includes(text));
      }
    }
    assert.equal(rendered.fileName, "编辑后的演示.pptx");
    assert.equal(Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name)).length, 4);
  } finally {
    globalThis.fetch = previousFetch;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  }
});
