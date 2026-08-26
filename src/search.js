/**
 * dsh-code-nav — 文件内查找匹配（纯函数，浏览器/node 通用）。
 *
 * findMatches 返回按位置排序的匹配数组（0 基 line/col，含 start/end 绝对偏移）。
 * 共享作用域约定见 lang-registry.js 文件头。
 */

const MAX_MATCHES = 2000;

/**
 * 在文本中查找 query 的全部出现位置。
 * @param {string} text
 * @param {string} query 空串返回 []
 * @param {{ caseSensitive?: boolean }} opts
 * @returns {Array<{start:number, end:number, line:number, col:number}>}
 */
export function findMatches(text, query, opts = {}) {
  if (typeof text !== "string" || typeof query !== "string" || query.length === 0) return [];
  const caseSensitive = opts.caseSensitive === true;
  const hay = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  const out = [];
  let idx = 0;
  let line = 0;
  let lineStart = 0;
  while (out.length < MAX_MATCHES) {
    const at = hay.indexOf(needle, idx);
    if (at === -1) break;
    // 计算 at 所在行（增量扫描）
    while (lineStart <= at) {
      const nl = text.indexOf("\n", lineStart);
      if (nl === -1 || nl >= at) break;
      line++;
      lineStart = nl + 1;
    }
    out.push({ start: at, end: at + needle.length, line, col: at - lineStart });
    idx = at + Math.max(needle.length, 1);
  }
  return out;
}

/**
 * 把一行文本按 token 边界与匹配区间切成渲染 span。
 * @param {string} lineText 原始行文本
 * @param {Array<{text:string, cls:string}>} segs 该行 token
 * @param {Array<{start:number, col:number, end:number}>} lineMatches 该行匹配（相对行首）
 * @param {number} currentIndex 当前匹配在该行匹配中的序号（-1 表示不在本行）
 * @returns {Array<{text:string, cls:string, match?:boolean, current?:boolean}>}
 */
export function spansOfLine(lineText, segs, lineMatches, currentIndex) {
  if (lineMatches.length === 0) {
    return segs.length > 0 ? segs : (lineText.length > 0 ? [{ text: lineText, cls: "" }] : []);
  }
  // 合并边界点
  const cuts = new Set([0, lineText.length]);
  let pos = 0;
  for (const s of segs) {
    pos += s.text.length;
    cuts.add(pos);
  }
  for (const m of lineMatches) {
    cuts.add(m.col);
    cuts.add(m.end);
  }
  const sorted = [...cuts].sort((a, b) => a - b);
  const spans = [];
  // segs 索引推进
  let si = 0;
  let segPos = 0;
  for (let k = 0; k < sorted.length - 1; k++) {
    const a = sorted[k];
    const b = sorted[k + 1];
    if (a >= b) continue;
    // 找该区间命中的 token 类别
    while (si < segs.length && segPos + segs[si].text.length <= a) {
      segPos += segs[si].text.length;
      si++;
    }
    let cls = "";
    if (si < segs.length) cls = segs[si].cls;
    const text = lineText.slice(a, b);
    if (text.length === 0) continue;
    const matchIdx = lineMatches.findIndex((m) => m.col <= a && m.end >= b);
    const span = { text, cls };
    if (matchIdx !== -1) {
      span.match = true;
      if (matchIdx === currentIndex) span.current = true;
    }
    spans.push(span);
  }
  return spans;
}
