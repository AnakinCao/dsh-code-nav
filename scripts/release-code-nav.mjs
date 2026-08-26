// dsh-code-nav v0.1.0 发布：建仓(如缺) → push → tag → release → 上传 tgz 资产
// 凭据经 `git credential fill` 进程内获取（沙箱阻断 GCM 凭据管道，须 danger-full-access 运行）。
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "AnakinCao/dsh-code-nav";
const TAG = "v0.1.0";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TGZ = join(ROOT, "dsh-code-nav-0.1.0.tgz");

function sh(cmd, args, opts = {}) {
  console.log("$", cmd, args.join(" "));
  return execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts });
}

// 1) token
let token;
try {
  const out = execFileSync("git", ["credential", "fill"], {
    input: "protocol=https\nhost=github.com\n\n",
    encoding: "utf8",
  });
  const m = out.match(/^password=(.+)$/m);
  if (m) token = m[1].trim();
} catch (e) {
  console.error("cred fill failed:", e.message.split("\n")[0]);
  process.exit(1);
}
if (!token) { console.error("no token"); process.exit(1); }

const GH = (path, init = {}) =>
  fetch("https://api.github.com" + path, {
    ...init,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "User-Agent": "dsh-release",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });

// 2) 确保仓库存在
const exist = await GH("/repos/" + REPO);
if (exist.status === 404) {
  const created = await GH("/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name: "dsh-code-nav",
      description: "DSH web plugin (dsh-better-sidebar companion): code preview with per-language syntax highlighting, symbol outline navigation and in-file search",
      private: false,
      has_issues: true,
      has_wiki: false,
    }),
  });
  const d = await created.json();
  if (!created.ok) { console.error("repo create failed", created.status, d.message); process.exit(1); }
  console.log("REPO CREATED:", d.html_url);
} else if (!exist.ok) {
  console.error("repo check failed", exist.status);
  process.exit(1);
} else {
  console.log("REPO EXISTS");
}

// 3) remote + push
const remote = sh("git", ["-C", ROOT, "remote", "get-url", "origin"]).trim();
const url = "https://github.com/" + REPO + ".git";
if (remote !== url) {
  if (remote) sh("git", ["-C", ROOT, "remote", "set-url", "origin", url]);
  else sh("git", ["-C", ROOT, "remote", "add", "origin", url]);
}
sh("git", ["-C", ROOT, "push", "-u", "origin", "main"]);

// 4) tag
try {
  sh("git", ["-C", ROOT, "tag", TAG]);
} catch { sh("git", ["-C", ROOT, "tag", "-f", TAG]); }
sh("git", ["-C", ROOT, "push", "-f", "origin", TAG]);

// 5) release
const body = [
  "## v0.1.0",
  "",
  "**dsh-code-nav** — DSH web plugin (dsh-better-sidebar companion): code preview navigator.",
  "",
  "### Features",
  "- 🎨 Per-language syntax highlighting (18 language families, hand-rolled tokenizer, light/dark auto)",
  "- 🧭 Symbol outline navigation: class / interface / struct / enum / impl, methods / functions, variables / fields / constants; filter All / Class / Method / Variable, dropdown jump with line flash",
  "- 🔍 In-file search: highlight all matches, current match emphasis, n/m count, ↑/↓ & Enter/Shift+Enter, match-case toggle",
  "- 中文 / English README",
  "",
  "### Install",
  "```bash",
  "dsh plugin --profile web add https://github.com/AnakinCao/dsh-code-nav.git",
  "```",
  "Then restart `dsh web` and hard-refresh the browser (Cmd/Ctrl+Shift+R). Requires [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar).",
  "",
  "### Artifacts",
  "- `dsh-code-nav-0.1.0.tgz` — pre-packed plugin tarball (local install: `dsh plugin --profile web add <tgz>`)",
  "",
  "### Verified",
  "- `node test/code-nav.test.mjs` — 25/25 unit tests pass (tokenizer + per-language outline + search)",
  "- `node --check lib/client.js` — bundle syntax OK",
].join("\n");

const rel = await GH("/repos/" + REPO + "/releases", {
  method: "POST",
  body: JSON.stringify({
    tag_name: TAG,
    target_commitish: "main",
    name: TAG,
    body,
    draft: false,
    prerelease: false,
  }),
});
const rd = await rel.json();
if (!rel.ok) { console.error("release failed", rel.status, rd.message || "", rd.errors || ""); process.exit(1); }
console.log("RELEASE CREATED:", rd.html_url);

// 6) 上传 tgz 资产
const buf = readFileSync(TGZ);
const up = await GH("/repos/" + REPO + "/releases/" + rd.id + "/assets?name=dsh-code-nav-0.1.0.tgz", {
  method: "POST",
  headers: { "Content-Type": "application/gzip" },
  body: buf,
});
const ud = await up.json();
if (!up.ok) { console.error("asset upload failed", up.status, ud.message || ""); process.exit(1); }
console.log("ASSET UPLOADED:", ud.browser_download_url);
console.log("DONE");
