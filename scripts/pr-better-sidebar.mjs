// 向 omdsh-dev/DSH-better-sidebar 提交「推荐文件预览插件目录」PR（dsh-code-nav）。
// 流程：fork（api.github.com）→ fetch 完整历史 → feat 分支提交 → push fork → 创建 PR。
// 凭据经 git credential fill 进程内获取；须 danger-full-access 运行。
import { execFileSync } from "node:child_process";

const UPSTREAM = "omdsh-dev/DSH-better-sidebar";
const FORK = "AnakinCao/DSH-better-sidebar";
const BRANCH = "feat/dsh-code-nav-catalog";
const CLONE = "F:/GIT/dsh-plugins/.tmp-bs-clone";

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

const H = {
  Authorization: "Bearer " + token,
  Accept: "application/vnd.github+json",
  "User-Agent": "dsh-pr",
  "X-GitHub-Api-Version": "2022-11-28",
};
const gh = (path, init = {}) =>
  fetch("https://api.github.com" + path, {
    ...init,
    headers: { ...H, ...(init.headers ?? {}) },
  });
function sh(cmd, args) {
  console.log("$", cmd, args.join(" "));
  return execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe" });
}

// 1) fork（已存在则忽略 422）
{
  const r = await gh(`/repos/${UPSTREAM}/forks`, { method: "POST" });
  const d = await r.json();
  if (r.ok) console.log("FORKED:", d.full_name);
  else if (r.status === 422) console.log("FORK EXISTS (or already forked)");
  else { console.error("fork failed", r.status, d.message || ""); process.exit(1); }
}

// 2) 完整历史 + feat 分支
sh("git", ["-C", CLONE, "fetch", "--unshallow", "origin"]);
sh("git", ["-C", CLONE, "fetch", "origin", "main"]);
try { sh("git", ["-C", CLONE, "checkout", "-b", BRANCH, "origin/main"]); }
catch { sh("git", ["-C", CLONE, "checkout", BRANCH]); sh("git", ["-C", CLONE, "reset", "--hard", "origin/main"]); }
// 4 个改动文件应已在工作区（未提交修改随 checkout 保留）
sh("git", ["-C", CLONE, "add", "src/client/plugins-viewers.ts", "src/client/locales.ts", "src/client/locales-ja.ts"]);
sh("git", ["-C", CLONE, "commit", "-m", "Add dsh-code-nav to the file-viewer plugin catalog"]);

// 3) push 到 fork
const forkUrl = "https://github.com/" + FORK + ".git";
try { sh("git", ["-C", CLONE, "remote", "add", "fork", forkUrl]); }
catch { sh("git", ["-C", CLONE, "remote", "set-url", "fork", forkUrl]); }
sh("git", ["-C", CLONE, "push", "-u", "fork", BRANCH]);

// 4) PR
const body = [
  "Adds **dsh-code-nav** to the built-in file-viewer plugin catalog (the \"add preview plugin\" modal).",
  "",
  "### Entry",
  "- **id**: `dsh-code-nav` — code preview navigator for the better-sidebar editor",
  "- **url**: https://github.com/AnakinCao/dsh-code-nav",
  "- **description** (zh/en/ja): per-language syntax highlighting + symbol outline (class/method/variable filter & jump) + in-file search; takes over code file preview",
  "- **install**: `dsh plugin --profile web add https://github.com/AnakinCao/dsh-code-nav.git`",
  "",
  "### Files",
  "- `src/client/plugins-viewers.ts` — new catalog entry (alphabetical order)",
  "- `src/client/locales.ts` — `pluginCodeNavDesc` in zh + en (key-set kept equal)",
  "- `src/client/locales-ja.ts` — `pluginCodeNavDesc` in ja",
  "",
  "### Notes",
  "- The repo is tagged `dsh-better-sidebar` (GitHub topic) for ecosystem discoverability",
  "- `tests/plugin-list.spec.ts` shape rules are satisfied: unique id, GitHub URL, non-empty localized description, install starts with `cd ~/.dsh` and contains `dsh plugin`",
].join("\n");

const pr = await gh(`/repos/${UPSTREAM}/pulls`, {
  method: "POST",
  body: JSON.stringify({
    title: "Add dsh-code-nav to the file-viewer plugin catalog",
    head: FORK.split("/")[0] + ":" + BRANCH,
    base: "main",
    body,
  }),
});
const pd = await pr.json();
if (!pr.ok) { console.error("PR failed", pr.status, pd.message || "", pd.errors || ""); process.exit(1); }
console.log("PR CREATED:", pd.html_url);
console.log("DONE");
