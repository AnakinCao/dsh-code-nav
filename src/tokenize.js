/**
 * dsh-code-nav — 轻量多语言语法高亮分词器（纯函数，浏览器/node 通用）。
 *
 * 逐行扫描，状态跨行保持（块注释、Python 三引号字符串）。
 * 每行输出：{ raw, segs: [{ text, cls }] }，cls 取值为：
 *   ""（普通）| c-comment | c-string | c-kw | c-type | c-num | c-ident | c-fn
 * 构建时由 scripts/build.mjs 内联进 lib/client.js（import/export 行被剥离，
 * 内联后共享同一函数作用域）。
 */

import { LANG_META } from "./lang-registry.js";

const RE_IDENT = /[A-Za-z_$][\w$]*/y;
const RE_NUM = /\d[\w.]*|0[xX][0-9a-fA-F]+|\.\d[\w.]*/y;

const _kwSets = new Map();
const _typeSets = new Map();

function wordSet(meta, key) {
  if (!_kwSets.has(key)) _kwSets.set(key, new Set(meta.keywords || []));
  return _kwSets.get(key);
}
function typeSet(meta, key) {
  if (!_typeSets.has(key)) _typeSets.set(key, new Set(meta.types || []));
  return _typeSets.get(key);
}

/** 把一段"代码 run"切成带类别的片段。 */
function tokenizeRun(code, meta, key) {
  const segs = [];
  const n = code.length;
  let i = 0;
  const kws = wordSet(meta, key);
  const tys = typeSet(meta, key);
  const hasTypeHeuristic = (meta.types || []).length > 0;
  while (i < n) {
    const ch = code[i];
    if (ch === "_" || ch === "$" || (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z")) {
      RE_IDENT.lastIndex = i;
      const m = RE_IDENT.exec(code);
      const word = m[0];
      let cls = "c-ident";
      if (kws.has(word)) cls = "c-kw";
      else if (tys.has(word)) cls = "c-type";
      else if (hasTypeHeuristic && word.length > 1 && word[0] >= "A" && word[0] <= "Z") cls = "c-type";
      segs.push({ text: word, cls });
      i = RE_IDENT.lastIndex;
    } else if (ch >= "0" && ch <= "9") {
      RE_NUM.lastIndex = i;
      const m = RE_NUM.exec(code);
      segs.push({ text: m[0], cls: "c-num" });
      i = RE_NUM.lastIndex;
    } else {
      let j = i;
      while (j < n && !(code[j] === "_" || code[j] === "$" || (code[j] >= "a" && code[j] <= "z") || (code[j] >= "A" && code[j] <= "Z") || (code[j] >= "0" && code[j] <= "9"))) j++;
      segs.push({ text: code.slice(i, j), cls: "" });
      i = j;
    }
  }
  // 标识符紧跟 ( → 视为函数（声明与调用都上色，便于扫读）
  for (let k = 0; k < segs.length - 1; k++) {
    if (segs[k].cls === "c-ident" && /^\s*\(/.test(segs[k + 1].text)) segs[k].cls = "c-fn";
  }
  return segs;
}

/**
 * 分词整个文件。
 * @param {string} text 文件内容
 * @param {string} lang 语言 id（LANG_META 键）
 * @returns {Array<{raw:string, segs:Array<{text:string, cls:string}>}> | null} 每行结果；语言未知或内容非法返回 null
 */
export function tokenizeLines(text, lang) {
  const meta = LANG_META[lang];
  if (!meta || typeof text !== "string") return null;
  if (text.length > 500000) text = text.slice(0, 500000); // 防御性上限
  const lines = text.split(/\r?\n/);
  const out = new Array(lines.length);
  const key = lang;
  const lineC = meta.lineComment;
  const bStart = meta.blockComment ? meta.blockComment[0] : null;
  const bEnd = meta.blockComment ? meta.blockComment[1] : null;
  const strings = meta.strings || [];
  const triples = meta.tripleStrings || [];
  let inBlock = false;          // 块注释进行中
  let inTriple = false;         // 三引号字符串进行中
  let tripleDelim = "";
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const segs = [];
    let code = "";
    const flush = () => {
      if (code.length > 0) {
        const run = tokenizeRun(code, meta, key);
        for (const s of run) segs.push(s);
        code = "";
      }
    };
    let j = 0;
    while (j < raw.length) {
      if (inBlock) {
        const e = raw.indexOf(bEnd, j);
        if (e === -1) {
          segs.push({ text: raw.slice(j), cls: "c-comment" });
          j = raw.length;
        } else {
          segs.push({ text: raw.slice(j, e + bEnd.length), cls: "c-comment" });
          j = e + bEnd.length;
          inBlock = false;
        }
        continue;
      }
      if (inTriple) {
        const e = raw.indexOf(tripleDelim, j);
        if (e === -1) {
          segs.push({ text: raw.slice(j), cls: "c-string" });
          j = raw.length;
        } else {
          segs.push({ text: raw.slice(j, e + tripleDelim.length), cls: "c-string" });
          j = e + tripleDelim.length;
          inTriple = false;
        }
        continue;
      }
      // 块注释开始
      if (bStart !== null && raw.startsWith(bStart, j)) {
        flush();
        const e = raw.indexOf(bEnd, j + bStart.length);
        if (e === -1) {
          segs.push({ text: raw.slice(j), cls: "c-comment" });
          j = raw.length;
          inBlock = true;
        } else {
          segs.push({ text: raw.slice(j, e + bEnd.length), cls: "c-comment" });
          j = e + bEnd.length;
        }
        continue;
      }
      // 行注释
      if (lineC !== null && raw.startsWith(lineC, j)) {
        flush();
        segs.push({ text: raw.slice(j), cls: "c-comment" });
        j = raw.length;
        continue;
      }
      // 三引号字符串开始（Python 等）
      let tripled = false;
      for (let t = 0; t < triples.length; t++) {
        const delim = triples[t];
        if (raw.startsWith(delim, j)) {
          flush();
          const e = raw.indexOf(delim, j + delim.length);
          if (e === -1) {
            segs.push({ text: raw.slice(j), cls: "c-string" });
            j = raw.length;
            inTriple = true;
            tripleDelim = delim;
          } else {
            segs.push({ text: raw.slice(j, e + delim.length), cls: "c-string" });
            j = e + delim.length;
          }
          tripled = true;
          break;
        }
      }
      if (tripled) continue;
      // 普通字符串
      let strd = false;
      for (let q = 0; q < strings.length; q++) {
        const quote = strings[q];
        if (quote.length === 0 || !raw.startsWith(quote, j)) continue;
        flush();
        const verbatim = quote === "@\""; // C# 逐字字符串："" 转义、反斜杠不转义
        let k = j + quote.length;
        if (verbatim) {
          for (; k < raw.length; k++) {
            if (raw[k] === '"') {
              if (raw[k + 1] === '"') { k++; continue; }
              break;
            }
          }
        } else {
          let esc = false;
          for (; k < raw.length; k++) {
            const ch = raw[k];
            if (esc) { esc = false; continue; }
            if (ch === "\\") { esc = true; continue; }
            if (ch === quote) break;
          }
        }
        const end = k < raw.length ? k + 1 : raw.length;
        segs.push({ text: raw.slice(j, end), cls: "c-string" });
        j = end;
        strd = true;
        break;
      }
      if (strd) continue;
      code += raw[j];
      j++;
    }
    flush();
    out[i] = { raw, segs };
  }
  return out;
}
