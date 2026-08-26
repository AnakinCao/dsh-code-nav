#!/usr/bin/env node
/**
 * dsh-code-nav — 构建脚本：把 src/*.js（纯函数模块）内联进
 * scripts/client.template.js 的 // __CN_PURE__ 标记处，生成 lib/client.js。
 *
 * 用法：node scripts/build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["lang-registry", "tokenize", "outline", "search"];
const EXPORTS = [
  "langOf", "langLabel", "LANG_EXT", "LANG_META",
  "tokenizeLines", "outlineOf", "kindGroup",
  "findMatches", "spansOfLine"
];

const parts = [];
for (const name of MODULES) {
  const src = readFileSync(join(ROOT, "src", name + ".js"), "utf8");
  const stripped = src
    .replace(/^export\s+/gm, "")
    .replace(/^import\s+[^\n]+from\s+"[^"]+";?\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  parts.push(`//#region module: ${name}\n${stripped}\n//#endregion`);
}

const wrapped = [
  "const __cn = (() => {",
  '	"use strict";',
  ...parts.map((p) => p.split("\n").map((l) => "\t" + l).join("\n")),
  `\treturn { ${EXPORTS.join(", ")} };`,
  "})();",
  ""
].join("\n");

const template = readFileSync(join(ROOT, "scripts", "client.template.js"), "utf8");
const marker = "// __CN_PURE__";
if (!template.includes(marker)) {
  console.error("[build] template marker not found:", marker);
  process.exit(1);
}
const out = template.replace(marker, wrapped);
mkdirSync(join(ROOT, "lib"), { recursive: true });
writeFileSync(join(ROOT, "lib", "client.js"), out, "utf8");
console.log(`[build] lib/client.js written (${out.length} bytes, ${EXPORTS.length} exports).`);
