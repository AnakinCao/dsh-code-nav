/**
 * dsh-code-nav — 符号大纲解析（纯函数，浏览器/node 通用）。
 *
 * 基于 tokenizeLines 的结果剥离注释/字符串后，对"干净行"跑每语言规则，
 * 输出：{ kind, name, line, container? }（line 为 1 基）。
 * kind: class | interface | struct | enum | impl | trait | method | function |
 *       constructor | variable | field | constant
 * 构建时由 scripts/build.mjs 内联进 lib/client.js（import/export 行被剥离）。
 */

import { LANG_META } from "./lang-registry.js";
import { tokenizeLines } from "./tokenize.js";

/** kind → 筛选分组（全部 / 类 / 方法 / 变量）。 */
export function kindGroup(kind) {
  switch (kind) {
    case "class": case "interface": case "struct": case "enum": case "impl": case "trait":
      return "class";
    case "method": case "function": case "constructor":
      return "method";
    case "variable": case "field": case "constant":
      return "variable";
    default:
      return "other";
  }
}

const KWS_OF = (lang) => new Set(LANG_META[lang]?.keywords ?? []);

/** 取干净行（去掉注释与字符串片段）。 */
function cleanOf(tokens, i) {
  const segs = tokens[i].segs;
  let out = "";
  for (const s of segs) {
    if (s.cls === "c-comment" || s.cls === "c-string") continue;
    out += s.text;
  }
  return out;
}

function countBraces(s) {
  let d = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") d++;
    else if (ch === "}") d--;
  }
  return d;
}

/**
 * C 家族括号深度通用提取器。
 * rules: [{ re, kind, nameGroup, depth: 'any'|'gt0', container, endsWith }]
 */
function extractBrace(lang, tokens, rules, lineCount) {
  const out = [];
  const stack = []; // 容器 { name, depth }
  let depth = 0;
  const cleans = new Array(lineCount);
  for (let i = 0; i < lineCount; i++) cleans[i] = cleanOf(tokens, i);
  for (let i = 0; i < lineCount; i++) {
    const clean = cleans[i];
    if (clean.trim().length === 0) continue;
    const depthBefore = depth;
    let matched = null;
    for (let r = 0; r < rules.length; r++) {
      const rule = rules[r];
      if (rule.depth === "gt0" && depthBefore === 0) continue;
      const m = rule.re.exec(clean);
      if (m === null) continue;
      if (rule.endsWith !== null && rule.endsWith !== undefined && !rule.endsWith.test(clean)) {
        // 大括号另起一行（Allman 风格）：声明行不以 ; 结尾，且其后首个非空行以 { 开头
        if (clean.endsWith(";")) continue;
        let ok = false;
        const peekMax = Math.min(lineCount, i + 7);
        for (let k = i + 1; k < peekMax; k++) {
          const c2 = cleans[k];
          if (c2.trim().length === 0) continue;
          ok = /^\s*\{/.test(c2);
          break;
        }
        if (!ok) continue;
      }
      const name = m[rule.nameGroup];
      if (typeof name !== "string" || name.length === 0 || name.length > 80) continue;
      matched = { rule, name, m };
      break;
    }
    if (matched !== null) {
      const kind = typeof matched.rule.kind === "function" ? matched.rule.kind(matched.m, depthBefore) : matched.rule.kind;
      const sym = { kind, name: matched.name, line: i + 1 };
      // 方法/字段归属容器
      if ((kind === "method" || kind === "field" || kind === "constructor") && stack.length > 0) {
        sym.container = stack[stack.length - 1].name;
      }
      out.push(sym);
      if (matched.rule.container) {
        stack.push({ name: matched.name, depth: depthBefore });
      }
    }
    depth += countBraces(clean);
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) stack.pop();
  }
  return out;
}

/** Python：缩进驱动。 */
function extractPython(tokens, lineCount) {
  const out = [];
  let classIndent = -1;
  let currentClass = null;
  const RE_CLASS = /^\s*class\s+([A-Za-z_]\w*)/;
  const RE_DEF = /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)/;
  const RE_VAR = /^\s*([A-Za-z_]\w*)\s*=/;
  for (let i = 0; i < lineCount; i++) {
    const clean = cleanOf(tokens, i);
    if (clean.trim().length === 0) continue;
    let indent = 0;
    while (indent < clean.length && clean[indent] === " ") indent++;
    const mC = RE_CLASS.exec(clean);
    if (mC !== null) {
      out.push({ kind: "class", name: mC[1], line: i + 1 });
      classIndent = indent;
      currentClass = mC[1];
      continue;
    }
    const mD = RE_DEF.exec(clean);
    if (mD !== null) {
      const inClass = currentClass !== null && indent > classIndent;
      out.push({
        kind: inClass ? "method" : "function",
        name: mD[1],
        line: i + 1,
        ...(inClass ? { container: currentClass } : {})
      });
      continue;
    }
    if (indent === 0) {
      const mV = RE_VAR.exec(clean);
      if (mV !== null) out.push({ kind: "variable", name: mV[1], line: i + 1 });
    }
  }
  return out;
}

/** Go：func / type / var / const。 */
function extractGo(tokens, lineCount) {
  const out = [];
  const RE_TYPE = /^\s*type\s+([A-Za-z_]\w*)\s+(struct|interface)\b/;
  const RE_FUNC = /^\s*func\s+(?:\(([^)]*)\)\s+)?([A-Za-z_]\w*)\s*\(/;
  const RE_VAR = /^\s*(?:var|const)\s+([A-Za-z_]\w*)/;
  for (let i = 0; i < lineCount; i++) {
    const clean = cleanOf(tokens, i);
    if (clean.trim().length === 0) continue;
    const mT = RE_TYPE.exec(clean);
    if (mT !== null) {
      out.push({ kind: mT[2] === "struct" ? "struct" : "interface", name: mT[1], line: i + 1 });
      continue;
    }
    const mF = RE_FUNC.exec(clean);
    if (mF !== null) {
      if (mF[1] !== undefined) {
        const recv = mF[1].replace(/\*/g, "").trim();
        out.push({ kind: "method", name: mF[2], line: i + 1, container: recv.split(/\s+/).pop() });
      } else {
        out.push({ kind: "function", name: mF[2], line: i + 1 });
      }
      continue;
    }
    const mV = RE_VAR.exec(clean);
    if (mV !== null) out.push({ kind: mV[0].trim().startsWith("const") ? "constant" : "variable", name: mV[1], line: i + 1 });
  }
  return out;
}

/** Lua：function / local。 */
function extractLua(tokens, lineCount) {
  const out = [];
  const RE_FN = /^\s*(?:local\s+)?function\s+([A-Za-z_]\w*(?:[.:][A-Za-z_]\w*)*)/;
  const RE_LOCAL = /^\s*local\s+([A-Za-z_]\w*)\s*=/;
  for (let i = 0; i < lineCount; i++) {
    const clean = cleanOf(tokens, i);
    if (clean.trim().length === 0) continue;
    const mF = RE_FN.exec(clean);
    if (mF !== null) {
      const full = mF[1];
      const lastDot = Math.max(full.lastIndexOf("."), full.lastIndexOf(":"));
      const name = lastDot >= 0 ? full.slice(lastDot + 1) : full;
      out.push({ kind: lastDot >= 0 && full[lastDot] === ":" ? "method" : "function", name, line: i + 1, container: lastDot >= 0 ? full.slice(0, lastDot) : undefined });
      continue;
    }
    const mV = RE_LOCAL.exec(clean);
    if (mV !== null) out.push({ kind: "variable", name: mV[1], line: i + 1 });
  }
  return out;
}

/** Shell：name() / name=。 */
function extractShell(tokens, lineCount) {
  const out = [];
  const RE_FN = /^\s*(?:function\s+([A-Za-z_]\w*)|([A-Za-z_]\w*)\s*\(\s*\))/;
  const RE_VAR = /^\s*([A-Za-z_]\w*)\s*=/;
  for (let i = 0; i < lineCount; i++) {
    const clean = cleanOf(tokens, i);
    if (clean.trim().length === 0) continue;
    const mF = RE_FN.exec(clean);
    if (mF !== null && (mF[1] !== undefined || mF[2] !== undefined)) {
      out.push({ kind: "function", name: mF[1] ?? mF[2], line: i + 1 });
      continue;
    }
    const mV = RE_VAR.exec(clean);
    if (mV !== null && !/^(if|then|else|fi|for|while|do|done|case|esac|function)$/.test(mV[1])) {
      out.push({ kind: "variable", name: mV[1], line: i + 1 });
    }
  }
  return out;
}

/** SQL：主要结构对象（表/视图/索引/函数）。 */
function extractSql(tokens, lineCount) {
  const out = [];
  const RE = /^\s*(?:create|drop|alter)\s+(table|view|index|function|procedure|trigger)\s+(?:if\s+exists\s+)?(?:[\w".`[\]]+\.)?([\w"`[\]]+)/i;
  for (let i = 0; i < lineCount; i++) {
    const clean = cleanOf(tokens, i);
    if (clean.trim().length === 0) continue;
    const m = RE.exec(clean);
    if (m !== null) {
      const kindMap = { table: "class", view: "interface", index: "class", function: "function", procedure: "function", trigger: "method" };
      out.push({ kind: kindMap[m[1].toLowerCase()] ?? "class", name: m[2].replace(/["`[\]]/g, ""), line: i + 1 });
    }
  }
  return out;
}

/** Vue/Svelte：抽取 <script> 块交给 JS/TS 规则，行号回加偏移。 */
function extractScriptBlock(text, lang) {
  const m = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/i.exec(text);
  if (m === null) return { code: null, offset: 0 };
  const attrs = m[1] || "";
  const isTs = /lang=["']ts["']|lang=["']typescript["']/.test(attrs);
  const before = text.slice(0, m.index);
  const offset = before.split(/\r?\n/).length; // <script 起始行的上一行数
  return { code: m[2], offset, subLang: isTs ? "typescript" : "javascript" };
}

/** 主入口：文本 + 语言 id → 符号列表（失败返回 []）。 */
export function outlineOf(text, lang) {
  if (typeof text !== "string" || text.length === 0) return [];
  try {
    if (lang === "vue" || lang === "svelte") {
      const { code, offset, subLang } = extractScriptBlock(text, lang);
      if (code === null) return [];
      return outlineOf(code, subLang).map((s) => ({ ...s, line: s.line + offset }));
    }
    const tokens = tokenizeLines(text, lang);
    if (tokens === null) return [];
    const lineCount = tokens.length;
    const meta = LANG_META[lang];
    const kws = KWS_OF(lang);
    let out;
    if (lang === "python") {
      out = extractPython(tokens, lineCount);
    } else if (lang === "go") {
      out = extractGo(tokens, lineCount);
    } else if (lang === "lua") {
      out = extractLua(tokens, lineCount);
    } else if (lang === "shell") {
      out = extractShell(tokens, lineCount);
    } else if (lang === "sql") {
      out = extractSql(tokens, lineCount);
    } else {
      // C 家族括号规则（按语言细分）
      const MODS = "(?:(?:public|private|protected|internal|static|abstract|virtual|override|async|readonly|final|sealed|synchronized|native|const|volatile|transient|open|data|lateinit|external|suspend|inline|tailrec|operator|infix|mutating|nonmutating|fileprivate|set|get|\\*)\\s+)*";
      const JS_DECL = /^\s*(?:export\s+|default\s+|declare\s+)*/;
      const CLASS_RE = new RegExp(JS_DECL.source + MODS + "(class|interface|enum|struct|record|trait)\\s+([A-Za-z_$][\\w$]*)(?:\\s*<[^>]*>)?(?:\\s+extends\\s+[\\w$.<>]+)?(?:\\s+implements\\s+[\\w$.,\\s<>]+)?\\s*\\{?");
      const kindOfClass = (k) => k === "interface" ? "interface" : k === "enum" ? "enum" : k === "struct" ? "struct" : k === "trait" ? "interface" : "class";
      const rules = [
        { re: CLASS_RE, kind: (m) => kindOfClass(m[1]), nameGroup: 2, depth: "any", container: true, endsWith: null }
      ];
      // 方法：修饰符 + 可选返回类型 + 名称 + ( ；要求行内含 ") {" 或行尾 "{"（排除裸调用）
      const METHOD_RE = new RegExp("^\\s*" + MODS + "(?:[\\w<>\\[\\],\\s&*]+\\s+)?([A-Za-z_$][\\w$]*)\\s*\\(");
      const needsBody = /\)\s*\{|\{\s*$|=>/;
      rules.push({ re: METHOD_RE, kind: (m) => { const n = m[1]; return n === "constructor" ? "constructor" : "method"; }, nameGroup: 1, depth: "gt0", container: false, endsWith: needsBody });
      if (lang === "javascript" || lang === "typescript" || lang === "jsx" || lang === "tsx") {
        rules.push({
          re: /^\s*(?:export\s+|default\s+)*(?:async\s+)*function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/,
          kind: "function", nameGroup: 1, depth: "any", container: false, endsWith: needsBody
        });
        rules.push({
          re: /^\s*(?:export\s+)*const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/,
          kind: "function", nameGroup: 1, depth: "any", container: false, endsWith: null
        });
        rules.push({
          re: /^\s*(?:export\s+)*const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\b/,
          kind: "function", nameGroup: 1, depth: "any", container: false, endsWith: null
        });
        rules.push({
          re: /^\s*(?:export\s+)*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?:[,=]|\s*$)/,
          kind: (m, d) => d > 0 ? "field" : "variable", nameGroup: 1, depth: "any", container: false, endsWith: null
        });
      } else if (lang === "java" || lang === "csharp" || lang === "c" || lang === "cpp") {
        // 文件级函数（C 家族，类外）
        rules.push({
          re: /^\s*[A-Za-z_][\w:<>*&[\],\s]*?\s+([A-Za-z_][\w]*)\s*\(/,
          kind: "function", nameGroup: 1, depth: "any", container: false, endsWith: needsBody
        });
        // 字段
        rules.push({
          re: /^\s*[A-Za-z_][\w:<>*&[\],\s]*?\s+([A-Za-z_][\w]*)\s*(?:=|;)/,
          kind: "field", nameGroup: 1, depth: "gt0", container: false, endsWith: null
        });
        // 常量 / 宏
        if (lang === "c" || lang === "cpp") {
          rules.push({
            re: /^\s*#\s*define\s+([A-Za-z_][\w]*)/,
            kind: "constant", nameGroup: 1, depth: "any", container: false, endsWith: null
          });
        }
      } else if (lang === "php") {
        rules.push({
          re: /^\s*(?:public|private|protected|static|abstract|final|async)?\s*function\s+([A-Za-z_]\w*)/,
          kind: (m, d) => d > 0 ? "method" : "function", nameGroup: 1, depth: "any", container: false, endsWith: needsBody
        });
        rules.push({ re: /^\s*const\s+([A-Za-z_]\w*)/, kind: "constant", nameGroup: 1, depth: "any", container: false, endsWith: null });
        rules.push({ re: /^\s*\$([A-Za-z_]\w*)\s*=\s*(?:\[|array\s*\()/, kind: "variable", nameGroup: 1, depth: "any", container: false, endsWith: null });
      } else if (lang === "ruby") {
        rules.push({ re: /^\s*(?:class|module)\s+([A-Za-z_:][\w:]*)/, kind: "class", nameGroup: 1, depth: "any", container: true, endsWith: null });
        rules.push({ re: /^\s*def\s+(?:self\.)?([A-Za-z_]\w*[!?=]?)/, kind: "method", nameGroup: 1, depth: "any", container: false, endsWith: null });
        rules.push({ re: /^\s*attr_(?:reader|writer|accessor)\s+:?([A-Za-z_]\w*)/, kind: "field", nameGroup: 1, depth: "any", container: false, endsWith: null });
      } else if (lang === "swift") {
        rules.push({ re: /^\s*(?:public|private|internal|fileprivate|open|final|actor)?\s*(class|struct|enum|protocol|extension)\s+([A-Za-z_]\w*)/, kind: (m) => m[1] === "class" ? "class" : m[1] === "struct" ? "struct" : m[1] === "enum" ? "enum" : m[1] === "protocol" ? "interface" : "class", nameGroup: 2, depth: "any", container: true, endsWith: null });
        rules.push({ re: /^\s*(?:public|private|internal|fileprivate|static|class|mutating|nonmutating|async|open)?\s*func\s+([A-Za-z_]\w*)/, kind: (m, d) => d > 0 ? "method" : "function", nameGroup: 1, depth: "any", container: false, endsWith: needsBody });
        rules.push({ re: /^\s*(?:public|private|internal|fileprivate|static|open)?\s*(?:var|let)\s+([A-Za-z_]\w*)/, kind: (m, d) => d > 0 ? "field" : "variable", nameGroup: 1, depth: "any", container: false, endsWith: null });
      } else if (lang === "kotlin") {
        rules.push({ re: /^\s*(?:public|private|internal|protected|data|sealed|enum|abstract|open|final|annotation|value|expect|actual)?\s*(?:enum\s+)?(?:class|interface|object)\s+([A-Za-z_]\w*)/, kind: (m) => m[0].includes("interface") ? "interface" : "class", nameGroup: 1, depth: "any", container: true, endsWith: null });
        rules.push({ re: /^\s*(?:public|private|internal|protected|suspend|inline|tailrec|operator|infix|override|abstract|open|final|external)?\s*fun\s+([A-Za-z_]\w*)/, kind: (m, d) => d > 0 ? "method" : "function", nameGroup: 1, depth: "any", container: false, endsWith: null });
        rules.push({ re: /^\s*(?:public|private|internal|protected|const|lateinit)?\s*(?:val|var)\s+([A-Za-z_]\w*)/, kind: (m, d) => d > 0 ? "field" : "variable", nameGroup: 1, depth: "any", container: false, endsWith: null });
      } else if (lang === "rust") {
        rules.push({ re: /^\s*(?:pub\s+)?(?:struct|enum|trait)\s+([A-Za-z_]\w*)/, kind: (m) => m[0].includes("struct") ? "struct" : m[0].includes("enum") ? "enum" : "interface", nameGroup: 1, depth: "any", container: true, endsWith: null });
        rules.push({ re: /^\s*(?:pub\s+)?impl\s+(?:<[^>]*>\s+)?([A-Za-z_]\w*(?:::\w+)*)/, kind: "impl", nameGroup: 1, depth: "any", container: true, endsWith: null });
        rules.push({ re: /^\s*(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z_]\w*)/, kind: (m, d) => d > 0 ? "method" : "function", nameGroup: 1, depth: "any", container: false, endsWith: null });
        rules.push({ re: /^\s*(?:pub\s+)?(?:const|static)\s+([A-Za-z_]\w*)/, kind: "constant", nameGroup: 1, depth: "any", container: false, endsWith: null });
      } else {
        // 兜底：走通用 JS 规则
        rules.push({ re: METHOD_RE, kind: (m) => m[1] === "constructor" ? "constructor" : "method", nameGroup: 1, depth: "gt0", container: false, endsWith: needsBody });
        rules.push({ re: /^\s*(?:export\s+)*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?:[,=]|\s*$)/, kind: (m, d) => d > 0 ? "field" : "variable", nameGroup: 1, depth: "any", container: false, endsWith: null });
      }
      out = extractBrace(lang, tokens, rules, lineCount);
    }
    // 关键词误报过滤（函数/方法名不能是语言关键字）
    const final = [];
    for (const s of out) {
      if (s.kind === "function" || s.kind === "method" || s.kind === "constructor") {
        if (kws.has(s.name)) continue;
      }
      final.push(s);
    }
    return final.length > 500 ? final.slice(0, 500) : final;
  } catch {
    return [];
  }
}
