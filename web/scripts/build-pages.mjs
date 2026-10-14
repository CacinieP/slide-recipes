import { cp, mkdtemp, rename, rm, symlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

// Build the static client in a disposable copy; never move the server source.
const root = process.cwd();
const staging = await mkdtemp(path.join(root, ".pages-build-"));
try {
  for (const file of ["package.json", "tsconfig.json", "next.config.ts", "postcss.config.mjs"]) {
    await cp(path.join(root, file), path.join(staging, file));
  }
  await cp(path.join(root, "src"), path.join(staging, "src"), {
    recursive: true, filter: source => source !== path.join(root, "src/app/api"),
  });
  await cp(path.join(root, "public"), path.join(staging, "public"), { recursive: true }).catch(error => {
    if (error.code !== "ENOENT") throw error;
  });
  await symlink(path.join(root, "node_modules"), path.join(staging, "node_modules"), "dir");
  const result = spawnSync(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "build", "--webpack"], {
    cwd: staging, stdio: "inherit",
    env: { ...process.env, BUILD_TARGET: "pages", NEXT_PUBLIC_MODEL_REQUEST_MODE: process.env.NEXT_PUBLIC_MODEL_PROXY_URL ? "proxy" : "direct" },
  });
  if (result.status === 0) {
    await rm(path.join(root, "out"), { recursive: true, force: true });
    await rename(path.join(staging, "out"), path.join(root, "out"));
  }
  process.exitCode = result.status ?? 1;
} finally { await rm(staging, { recursive: true, force: true }); }
