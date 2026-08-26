// 设置 GitHub 仓库 topics（合并式：保留已有 + 新增缺失）。
// 凭据经 `git credential fill` 进程内获取；沙箱阻断 GCM 凭据管道，须 danger-full-access 运行。
// 用法：node scripts/repo-topics.mjs [topic...]
import { execFileSync } from "node:child_process";

const REPO = "AnakinCao/dsh-code-nav";
const DESIRED = (process.argv.slice(2).length > 0 ? process.argv.slice(2) : [
  "dsh-better-sidebar",
  "dsh",
  "dsh-plugin",
  "deepseek-harness",
  "code-preview",
  "syntax-highlighting",
  "code-outline",
  "code-navigation",
  "plugin",
]);

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

const headers = {
  Authorization: "Bearer " + token,
  Accept: "application/vnd.github+json",
  "User-Agent": "dsh-release",
  "X-GitHub-Api-Version": "2022-11-28",
};

const cur = await fetch(`https://api.github.com/repos/${REPO}/topics`, { headers });
const curData = await cur.json();
if (!cur.ok) { console.error("get topics failed", cur.status, curData.message || ""); process.exit(1); }
const existing = curData.names ?? [];
const merged = [...new Set([...existing, ...DESIRED])];
console.log("existing:", existing.join(", ") || "(none)");

const put = await fetch(`https://api.github.com/repos/${REPO}/topics`, {
  method: "PUT",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({ names: merged }),
});
const putData = await put.json();
if (!put.ok) { console.error("set topics failed", put.status, putData.message || ""); process.exit(1); }
console.log("topics now:", (putData.names ?? []).join(", "));
console.log("DONE");
