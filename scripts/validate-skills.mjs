#!/usr/bin/env node

import { readdir, readFile, access } from "node:fs/promises";
import { join, relative, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";

// Optional root override so tests can run the validator against fixtures.
const rootDir = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(fileURLToPath(new URL("..", import.meta.url)));
const skillsDir = join(rootDir, "skills");

const MAX_DESCRIPTION_LENGTH = 1024;

async function findSkillManifests(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const manifests = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      manifests.push(...(await findSkillManifests(path)));
    } else if (entry.isFile() && entry.name.toLowerCase() === "skill.md") {
      if (entry.name !== "SKILL.md") {
        throw new Error(
          `${relative(rootDir, path)}: manifest must be named exactly SKILL.md`,
        );
      }
      manifests.push(path);
    }
  }

  return manifests;
}

function readFrontmatter(source, path) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(`${path}: missing YAML frontmatter at the start of the file`);
  }
  return match[1];
}

/** Collect relative markdown link targets (skip URLs, anchors, mailto, $VARS). */
function relativeLinkTargets(source) {
  const targets = new Set();
  const pattern = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of source.matchAll(pattern)) {
    const target = match[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(target)) continue; // URL, anchor, absolute
    if (target.includes("$")) continue; // runtime placeholders like $SKILL_DIR
    targets.add(target.split("#")[0]);
  }
  return [...targets].filter(Boolean);
}

async function assertFileExists(path, displayPath, reason) {
  try {
    await access(path);
  } catch {
    throw new Error(`${displayPath}: ${reason} (${relative(rootDir, path)})`);
  }
}

const manifests = await findSkillManifests(skillsDir);
if (manifests.length === 0) {
  throw new Error("No canonical SKILL.md manifests found under skills/");
}

for (const manifest of manifests) {
  const displayPath = relative(rootDir, manifest);
  const source = await readFile(manifest, "utf8");
  const frontmatter = readFrontmatter(source, displayPath);
  const document = parseDocument(frontmatter, { prettyErrors: true, strict: true });

  if (document.errors.length > 0) {
    throw new Error(`${displayPath}: invalid YAML frontmatter\n${document.errors.join("\n")}`);
  }

  const metadata = document.toJS();
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error(`${displayPath}: frontmatter must be a YAML mapping`);
  }

  for (const field of ["name", "description"]) {
    if (typeof metadata[field] !== "string" || metadata[field].trim() === "") {
      throw new Error(`${displayPath}: ${field} must be a non-empty string`);
    }
  }

  // The install directory is derived from the skill name; drift breaks
  // `skills add` layouts and cross-references.
  const skillDir = dirname(manifest);
  if (metadata.name !== basename(skillDir)) {
    throw new Error(
      `${displayPath}: frontmatter name "${metadata.name}" must match its directory "${basename(skillDir)}"`,
    );
  }

  if (metadata.description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(
      `${displayPath}: description is ${metadata.description.length} characters; keep it <= ${MAX_DESCRIPTION_LENGTH} so routing layers do not truncate it`,
    );
  }

  // Bilingual mirror is a repo convention for this skill family.
  const mirrorPath = join(skillDir, "SKILL.cn.md");
  await assertFileExists(mirrorPath, displayPath, "missing bilingual mirror SKILL.cn.md");
  const mirrorSource = await readFile(mirrorPath, "utf8");

  // Every relative link in both manifests must resolve inside the skill,
  // so installed copies never point at missing references or scripts.
  for (const [file, content] of [[manifest, source], [mirrorPath, mirrorSource]]) {
    for (const target of relativeLinkTargets(content)) {
      await assertFileExists(resolve(dirname(file), target), relative(rootDir, file), `broken relative link "${target}"`);
    }
  }

  console.log(`Validated ${displayPath} (${metadata.name})`);
}