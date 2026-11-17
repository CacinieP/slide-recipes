#!/usr/bin/env node

/** Fixture-based tests for validate-skills.mjs (run: node scripts/validate-skills-test.mjs). */

import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const validator = resolve(fileURLToPath(new URL("../scripts/validate-skills.mjs", import.meta.url)));

const VALID_FRONTMATTER = `---
name: demo-skill
description: A compact demo skill used by validator tests.
---
`;

async function makeFixture({ name = "demo-skill", frontmatter, body = "", mirror = "# 镜像\n", files = {} } = {}) {
  const root = await mkdtemp(join(tmpdir(), "validate-skills-test-"));
  const skillDir = join(root, "skills", name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, "SKILL.md"), (frontmatter ?? VALID_FRONTMATTER) + body);
  if (mirror !== null) await writeFile(join(skillDir, "SKILL.cn.md"), mirror);
  for (const [rel, content] of Object.entries(files)) {
    const path = join(skillDir, rel);
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, content);
  }
  return root;
}

async function runValidator(root) {
  try {
    const { stdout } = await execFileAsync(process.execPath, [validator, root]);
    return { ok: true, stdout };
  } catch (error) {
    return { ok: false, message: String(error.stderr || error.message) };
  }
}

let passed = 0;
async function check(label, fn) {
  await fn();
  passed += 1;
  console.log(`✅ ${label}`);
}

const roots = [];
async function fixture(options) {
  const root = await makeFixture(options);
  roots.push(root);
  return root;
}

try {
  await check("valid skill with resolvable links passes", async () => {
    const root = await fixture({
      body: "\nSee [rules](references/rules.md) and [中文](SKILL.cn.md).\n",
      mirror: "# 镜像\n\n见 [规则](references/rules.md)。\n",
      files: { "references/rules.md": "# rules\n" },
    });
    const result = await runValidator(root);
    if (!result.ok) throw new Error(result.message);
  });

  await check("external URLs, anchors and $PLACEHOLDERS are ignored", async () => {
    const root = await fixture({
      body: '\n[a](https://example.com/x) [b](#section) [c](mailto:x@y.z) [d]($SKILL_DIR/scripts/tool.mjs) [e](/absolute/path)\n',
    });
    const result = await runValidator(root);
    if (!result.ok) throw new Error(result.message);
  });

  await check("name/directory mismatch fails", async () => {
    const root = await fixture({ name: "other-dir" });
    const result = await runValidator(root);
    if (result.ok || !result.message.includes("must match its directory")) {
      throw new Error(`expected directory mismatch error, got: ${JSON.stringify(result)}`);
    }
  });

  await check("over-long description fails", async () => {
    const root = await fixture({
      frontmatter: `---\nname: demo-skill\ndescription: ${"x".repeat(1025)}\n---\n`,
    });
    const result = await runValidator(root);
    if (result.ok || !result.message.includes("1024")) {
      throw new Error(`expected description length error, got: ${JSON.stringify(result)}`);
    }
  });

  await check("missing bilingual mirror fails", async () => {
    const root = await fixture({ mirror: null });
    const result = await runValidator(root);
    if (result.ok || !result.message.includes("SKILL.cn.md")) {
      throw new Error(`expected mirror error, got: ${JSON.stringify(result)}`);
    }
  });

  await check("broken relative link in SKILL.md fails", async () => {
    const root = await fixture({ body: "\n[missing](references/nope.md)\n" });
    const result = await runValidator(root);
    if (result.ok || !result.message.includes("broken relative link")) {
      throw new Error(`expected broken link error, got: ${JSON.stringify(result)}`);
    }
  });

  await check("broken relative link in SKILL.cn.md fails", async () => {
    const root = await fixture({ mirror: "# 镜像\n\n[缺失](references/nope.md)\n" });
    const result = await runValidator(root);
    if (result.ok || !result.message.includes("broken relative link")) {
      throw new Error(`expected broken mirror link error, got: ${JSON.stringify(result)}`);
    }
  });

  await check("missing frontmatter fails", async () => {
    const root = await fixture({ frontmatter: "" });
    const result = await runValidator(root);
    if (result.ok || !result.message.includes("frontmatter")) {
      throw new Error(`expected frontmatter error, got: ${JSON.stringify(result)}`);
    }
  });

  await check("empty description fails", async () => {
    const root = await fixture({ frontmatter: '---\nname: demo-skill\ndescription: "  "\n---\n' });
    const result = await runValidator(root);
    if (result.ok || !result.message.includes("description")) {
      throw new Error(`expected description error, got: ${JSON.stringify(result)}`);
    }
  });

  console.log(`validate-skills: ${passed} fixture checks PASS`);
} finally {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
}