/**
 * dsh-code-nav — client bundle（由 scripts/build.mjs 从 src/*.js 内联生成，
 * 勿手改 lib/client.js 的「pure modules」区段）。
 *
 * 依赖 dsh-better-sidebar 的 ctx.betterSidebar 服务，注册一个代码文件预览器：
 *  - 按扩展名识别语言 → 轻量语法高亮
 *  - 符号大纲（class / method / variable 筛选 + 跳转）
 *  - 文件内查找（高亮全部匹配、上/下一处、大小写切换）
 *  - 选中文字 → 浮动「添加到对话」按钮（插入载荷与内置查看器同一形状）
 *
 * @module dsh-code-nav/client
 */
window.__ModuleLoader__.load({
	id: "dsh-code-nav",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let jsx = react_jsx_runtime.jsx;
		let jsxs = react_jsx_runtime.jsxs;
		// 「添加到对话」浮层 portal 到 document.body：面板本身可能带 transform
		// （收起时被平移出屏），position:fixed 挂在面板里会跟着一起跑。
		let createPortal = require("react-dom").createPortal;

		//#region pure modules (inlined by scripts/build.mjs)
		const __cn = (() => {
	"use strict";
	//#region module: lang-registry
	/**
	 * dsh-code-nav — 语言注册表（纯函数，浏览器/node 通用）。
	 *
	 * 共享作用域约定：本文件与 tokenize.js / outline.js / search.js 由
	 * scripts/build.mjs 按依赖顺序拼接内联进 lib/client.js（去掉 export 前缀），
	 * 故模块间直接引用彼此声明，不写 import 语句。
	 */
	
	/** 扩展名（小写、无点）→ 语言 id。 */
	const LANG_EXT = {
	  // JavaScript / TypeScript 家族
	  js: "javascript", mjs: "javascript", cjs: "javascript",
	  ts: "typescript", jsx: "jsx", tsx: "tsx",
	  // 脚本
	  py: "python",
	  // JVM / .NET
	  java: "java", cs: "csharp",
	  // C 家族
	  c: "c", h: "c", cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hh: "cpp", hxx: "cpp",
	  // 系统 / 服务端
	  go: "go", rs: "rust", php: "php", rb: "ruby",
	  // Apple / Android
	  swift: "swift", kt: "kotlin", kts: "kotlin",
	  // 脚本 / 模板
	  lua: "lua", sh: "shell", bash: "shell", zsh: "shell",
	  vue: "vue", svelte: "svelte",
	  // 数据
	  sql: "sql"
	};
	
	/** 根据文件路径（或纯文件名）推断语言 id；未知返回 null。 */
	function langOf(path) {
	  if (typeof path !== "string" || path.length === 0) return null;
	  const slash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
	  const base = slash >= 0 ? path.slice(slash + 1) : path;
	  const dot = base.lastIndexOf(".");
	  if (dot <= 0 || dot === base.length - 1) return null;
	  return LANG_EXT[base.slice(dot + 1).toLowerCase()] ?? null;
	}
	
	/** 语言元数据：标签、注释语法、字符串引号、关键字、内建类型、额外高亮规则。 */
	const LANG_META = {
	  javascript: {
	    label: "JavaScript",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"', "`"],
	    keywords: "break case catch class const continue debugger default delete do else enum export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield async await null true false undefined NaN Infinity".split(" "),
	    types: "Array BigInt Boolean Date Error Function Map Number Object Promise Proxy RegExp Set String Symbol WeakMap WeakSet JSON Math Intl ArrayBuffer DataView Uint8Array Int8Array Uint16Array Int16Array Uint32Array Int32Array Float32Array Float64Array".split(" ")
	  },
	  typescript: {
	    label: "TypeScript",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"', "`"],
	    keywords: "break case catch class const continue debugger default delete do else enum export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield async await interface type implements declare abstract readonly namespace module satisfies keyof infer is as asserts unknown never null true false undefined NaN".split(" "),
	    types: "any boolean number string symbol object bigint void never unknown Array Boolean Error Function Map Number Object Promise RegExp Set String Symbol WeakMap WeakSet JSON Math Record Partial Required Readonly Pick Omit Exclude Extract ReturnType Parameters ConstructorParameters Awaited".split(" ")
	  },
	  jsx: {
	    label: "JSX",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"', "`"],
	    keywords: "break case catch class const continue debugger default delete do else enum export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield async await null true false undefined NaN".split(" "),
	    types: "Array Boolean Date Error Function Map Number Object Promise RegExp Set String Symbol WeakMap WeakSet JSON Math".split(" ")
	  },
	  tsx: {
	    label: "TSX",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"', "`"],
	    keywords: "break case catch class const continue debugger default delete do else enum export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield async await interface type implements declare abstract readonly namespace satisfies keyof infer is as asserts unknown never null true false undefined NaN".split(" "),
	    types: "any boolean number string symbol object bigint void never unknown Array Boolean Error Function Map Number Object Promise RegExp Set String Symbol WeakMap WeakSet JSON Math Record Partial Required Readonly Pick Omit".split(" ")
	  },
	  python: {
	    label: "Python",
	    lineComment: "#", blockComment: null,
	    strings: ["'", '"'],
	    tripleStrings: ["'''", '"""'],
	    keywords: "and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield None True False match case".split(" "),
	    types: "int float bool str bytes list tuple dict set frozenset complex object type range slice enumerate zip map filter any all min max len print super".split(" ")
	  },
	  java: {
	    label: "Java",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"'],
	    keywords: "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while record sealed permits non-sealed var yield true false null".split(" "),
	    types: "String Object Integer Long Double Float Short Boolean Byte Character Void Math System Exception RuntimeException ArrayList HashMap HashSet LinkedHashMap LinkedList Optional Stream List Map Set Collection Iterator StringBuilder".split(" ")
	  },
	  csharp: {
	    label: "C#",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"', "@\""],
	    keywords: "abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while async await record init required file partial get set value when where yield".split(" "),
	    types: "String Object Int32 Int64 Double Single Decimal Boolean Byte Char DateTime TimeSpan Guid Exception Console Math Task Task<T> IEnumerable List Dictionary HashSet StringBuilder Stream StreamReader StreamWriter HttpClient CancellationToken CancellationTokenSource".split(" ")
	  },
	  c: {
	    label: "C",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"'],
	    keywords: "auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Bool _Complex _Generic _Noreturn _Static_assert _Thread_local true false NULL".split(" "),
	    types: "size_t ssize_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t intptr_t uintptr_t FILE va_list ptrdiff_t wchar_t bool".split(" ")
	  },
	  cpp: {
	    label: "C++",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"', "R\""],
	    keywords: "alignas alignof and and_eq asm auto bitand bitor bool break case catch char char8_t char16_t char32_t class compl concept const consteval constexpr constinit const_cast continue co_await co_return co_yield decltype default delete do double dynamic_cast else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept not not_eq nullptr operator or or_eq private protected public register reinterpret_cast requires return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while xor xor_eq".split(" "),
	    types: "string vector map unordered_map set unordered_set list deque queue stack pair tuple optional variant any shared_ptr unique_ptr weak_ptr string_view size_t int8_t int16_t int32_t int64_t uint8_t uint16_t uint32_t uint64_t ostream istream fstream ifstream ofstream".split(" ")
	  },
	  go: {
	    label: "Go",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"', "`"],
	    keywords: "break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false iota nil".split(" "),
	    types: "int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 uintptr float32 float64 complex64 complex128 bool byte rune string error any comparable".split(" ")
	  },
	  rust: {
	    label: "Rust",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"', "r\""],
	    keywords: "as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type union unsafe use where while".split(" "),
	    types: "u8 u16 u32 u64 u128 i8 i16 i32 i64 i128 f32 f64 usize isize bool char str String Vec Option Some None Result Ok Err Box Rc Arc HashMap HashSet VecDeque BTreeMap BTreeSet Cow".split(" ")
	  },
	  php: {
	    label: "PHP",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"'],
	    keywords: "abstract and array as break callable case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum eval exit extends final finally fn for foreach function global goto if implements include include_once instanceof insteadof interface isset list match namespace new or print private protected public readonly require require_once return static switch throw trait try unset use var while xor yield true false null".split(" "),
	    types: "int float string bool array object iterable mixed void never resource null self parent".split(" ")
	  },
	  ruby: {
	    label: "Ruby",
	    lineComment: "#", blockComment: ["=begin", "=end"],
	    strings: ["'", '"', "`"],
	    keywords: "alias and begin break case class def defined? do else elsif end ensure false for if in module next nil not or redo rescue retry return self super then true undef unless until when while yield".split(" "),
	    types: "Array Hash String Integer Float Symbol Proc Object Class Module Range Time Date Regexp NilClass TrueClass FalseClass Exception StandardError".split(" ")
	  },
	  swift: {
	    label: "Swift",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"'],
	    keywords: "associatedtype class deinit enum extension fileprivate func import init inout internal let open operator private protocol public rethrows static struct subscript super switch throws try typealias var weak where async await actor some any guard defer repeat case default break continue fallthrough return if else for while do in is as true false nil Self".split(" "),
	    types: "Int Int8 Int16 Int32 Int64 UInt UInt8 UInt16 UInt32 UInt64 Float Double Bool String Character Array Dictionary Set Optional Error Result Void Any AnyObject".split(" ")
	  },
	  kotlin: {
	    label: "Kotlin",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"', "\"\"\""],
	    keywords: "as as? break class continue do else false for fun if in !in interface is !is null object package return super this throw true try typealias typeof val var when while by catch constructor delegate dynamic field file finally get import init param property receiver set setparam where actual abstract annotation companion const crossinline data enum expect external final infix inline inner internal lateinit noinline open operator out override private protected public reified sealed suspend tailrec vararg".split(" "),
	    types: "Int Long Short Byte Double Float Boolean Char String Any Unit Nothing Array List MutableList Map MutableMap Set MutableSet Pair Triple Result".split(" ")
	  },
	  lua: {
	    label: "Lua",
	    lineComment: "--", blockComment: ["--[[", "]]"],
	    strings: ["'", '"'],
	    keywords: "and break do else elseif end false for function goto if in local nil not or repeat return then true until while".split(" "),
	    types: "string number boolean table function thread userdata nil".split(" ")
	  },
	  shell: {
	    label: "Shell",
	    lineComment: "#", blockComment: null,
	    strings: ["'", '"', "`"],
	    keywords: "if then else elif fi case esac for while until do done function in select time coproc declare typeset local export readonly unset set shift source return break continue exit trap echo printf read test true false".split(" "),
	    types: []
	  },
	  vue: {
	    label: "Vue",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"', "`"],
	    keywords: "break case catch class const continue debugger default delete do else enum export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield async await interface type implements declare abstract readonly namespace null true false undefined NaN".split(" "),
	    types: "any boolean number string symbol object void never unknown Array Boolean Error Function Map Number Object Promise RegExp Set String Symbol WeakMap WeakSet JSON Math Record Partial Required Readonly Pick Omit".split(" ")
	  },
	  svelte: {
	    label: "Svelte",
	    lineComment: "//", blockComment: ["/*", "*/"],
	    strings: ["'", '"', "`"],
	    keywords: "break case catch class const continue debugger default delete do else enum export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield async await interface type implements declare abstract readonly namespace null true false undefined NaN".split(" "),
	    types: "any boolean number string symbol object void never unknown Array Boolean Error Function Map Number Object Promise RegExp Set String Symbol WeakMap WeakSet JSON Math Record Partial Required Readonly Pick Omit".split(" ")
	  },
	  sql: {
	    label: "SQL",
	    lineComment: "--", blockComment: ["/*", "*/"],
	    strings: ["'", '"'],
	    keywords: "select from where insert into values update set delete create table view index alter drop truncate join inner left right full outer on group by order having limit offset union all distinct as asc desc and or not null primary key foreign references unique check default constraint begin commit rollback transaction case when then else end exists in like between is cast".split(" "),
	    types: "int integer bigint smallint tinyint numeric decimal float real double money char varchar nvarchar text ntext binary varbinary bit date datetime timestamp time boolean json xml".split(" ")
	  }
	};
	
	/** 语言 id → 标签（未知语言兜底）。 */
	function langLabel(lang) {
	  const meta = LANG_META[lang];
	  return meta ? meta.label : (lang ?? "Text");
	}
	
	/** 是否为已知代码语言（有高亮元数据）。 */
	function isCodeLang(lang) {
	  return lang != null && Object.prototype.hasOwnProperty.call(LANG_META, lang);
	}
	//#endregion
	//#region module: tokenize
	/**
	 * dsh-code-nav — 轻量多语言语法高亮分词器（纯函数，浏览器/node 通用）。
	 *
	 * 逐行扫描，状态跨行保持（块注释、Python 三引号字符串）。
	 * 每行输出：{ raw, segs: [{ text, cls }] }，cls 取值为：
	 *   ""（普通）| c-comment | c-string | c-kw | c-type | c-num | c-ident | c-fn
	 * 构建时由 scripts/build.mjs 内联进 lib/client.js（import/export 行被剥离，
	 * 内联后共享同一函数作用域）。
	 */
	
	
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
	function tokenizeLines(text, lang) {
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
	//#endregion
	//#region module: outline
	/**
	 * dsh-code-nav — 符号大纲解析（纯函数，浏览器/node 通用）。
	 *
	 * 基于 tokenizeLines 的结果剥离注释/字符串后，对"干净行"跑每语言规则，
	 * 输出：{ kind, name, line, container? }（line 为 1 基）。
	 * kind: class | interface | struct | enum | impl | trait | method | function |
	 *       constructor | variable | field | constant
	 * 构建时由 scripts/build.mjs 内联进 lib/client.js（import/export 行被剥离）。
	 */
	
	
	/** kind → 筛选分组（全部 / 类 / 方法 / 变量）。 */
	function kindGroup(kind) {
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
	function outlineOf(text, lang) {
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
	//#endregion
	//#region module: search
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
	function findMatches(text, query, opts = {}) {
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
	function spansOfLine(lineText, segs, lineMatches, currentIndex) {
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
	//#endregion
	//#region module: selection
	/**
	 * dsh-code-nav — 「选中文字 → 添加到对话」的插入载荷（纯函数，浏览器/node 通用）。
	 *
	 * 载荷形状与 dsh-better-sidebar 内置查看器（markdown 预览 / CodeMirror 编辑器）
	 * 完全一致，两条入口粘出来的草稿文本无差别：
	 *  - 选区 ≤ SELECTION_LIMIT 个字符：围栏代码块，信息行为 `相对路径:起止行`，
	 *    正文为选中文本；
	 *  - 超过上限：只留一行纯文本 `相对路径:起止行`（不带围栏、不带正文）；
	 *  - 路径相对会话 cwd（与资源管理器的 @ 按钮同一投影），cwd 未知时用绝对路径；
	 *  - 行号：单行写 `path:12`，多行写 `path:12-15`，行号不可得时只写路径。
	 *
	 * 共享作用域约定见 lang-registry.js 文件头。
	 */
	
	/** 插入草稿的选区长度上限（UTF-16 码元，即 JS `.length`）。 */
	const SELECTION_LIMIT = 500;
	
	/**
	 * 会话 cwd 下的相对路径（与 better-sidebar 的 paths.relativeTo 同一语义）。
	 * @param {string} cwd 会话工作目录（绝对路径）
	 * @param {string} path 文件绝对路径
	 * @returns {string} 以 `/` 分隔的相对路径；不在 cwd 内时原样返回
	 */
	function relativeTo(cwd, path) {
	  const base = cwd.replace(/[\\/]+$/, "");
	  const norm = (value) => value.replace(/\\/g, "/");
	  const nBase = norm(base);
	  const nPath = norm(path);
	  if (nPath === nBase) return ".";
	  // 前缀比较不区分大小写：Windows 盘符大小写可能与 cwd 行不一致，
	  // 但返回的相对文本保留调用方自己的大小写。
	  if (nPath.toLowerCase().startsWith(nBase.toLowerCase() + "/")) return nPath.slice(nBase.length + 1);
	  return path;
	}
	
	/**
	 * 围栏信息行：`相对路径[:起始行[-结束行]]`；行号不可得时省略整个行号段。
	 * @param {string} path
	 * @param {string|undefined} cwd
	 * @param {{start:number, end:number}|undefined} lines 1 起闭区间
	 * @returns {string}
	 */
	function selectionHeader(path, cwd, lines) {
	  const rel = typeof cwd === "string" && cwd.length > 0 ? relativeTo(cwd, path) : path;
	  if (lines === undefined || lines === null) return rel;
	  if (lines.end > lines.start) return rel + ":" + lines.start + "-" + lines.end;
	  return rel + ":" + lines.start;
	}
	
	/**
	 * 一次选区的完整插入文本。
	 * @param {string} path 文件绝对路径
	 * @param {string|undefined} cwd 会话工作目录
	 * @param {{start:number, end:number}|undefined} lines 1 起闭区间
	 * @param {string} selected 选中文本
	 * @returns {string}
	 */
	function buildSelectionInsert(path, cwd, lines, selected) {
	  const header = selectionHeader(path, cwd, lines);
	  if (selected.length > SELECTION_LIMIT) return header;
	  return "```" + header + "\n" + selected + "\n```";
	}
	//#endregion
	return { langOf, langLabel, LANG_EXT, LANG_META, tokenizeLines, outlineOf, kindGroup, findMatches, spansOfLine, SELECTION_LIMIT, selectionHeader, buildSelectionInsert };
})();

		//#endregion

		//#region styles
		const css = [
			".cn-root{position:relative;box-sizing:border-box;display:flex;flex-direction:column;height:100%;min-height:0;font-size:13px;line-height:20px;color:var(--cn-plain);--cn-match-bg:rgba(255,213,0,.45);--cn-match-cur:rgba(255,170,0,.6)}",
			".cn-head{flex:none;display:flex;align-items:center;gap:8px;padding:8px 10px 0;min-width:0}",
			".cn-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;color:var(--cn-fg)}",
			".cn-badge{flex:none;border:1px solid var(--cn-border);background:var(--cn-badge-bg);color:var(--cn-badge-fg);border-radius:9px;padding:1px 7px;font-size:11px;line-height:16px;white-space:nowrap}",
			".cn-bar{flex:none;display:flex;align-items:center;gap:6px;padding:6px 10px 0;flex-wrap:wrap}",
			".cn-chip{border:1px solid var(--cn-border);background:transparent;color:var(--cn-dim);border-radius:8px;padding:1px 8px;font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap}",
			".cn-chip:hover{color:var(--cn-fg)}",
			".cn-chip.on{background:var(--cn-accent-bg);border-color:var(--cn-accent);color:var(--cn-accent);font-weight:500}",
			".cn-symbtn{border:1px solid var(--cn-border);background:transparent;color:var(--cn-fg);border-radius:8px;padding:1px 8px;font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap}",
			".cn-symbtn:hover{border-color:var(--cn-accent);color:var(--cn-accent)}",
			".cn-search{flex:1;min-width:80px;display:flex;align-items:center;gap:4px;border:1px solid var(--cn-border);border-radius:8px;padding:1px 4px 1px 8px;background:var(--cn-input-bg)}",
			".cn-search input{flex:1;min-width:0;border:none;outline:none;background:transparent;color:var(--cn-fg);font-size:12px;line-height:20px;padding:0}",
			".cn-search input::placeholder{color:var(--cn-dim3)}",
			".cn-count{flex:none;color:var(--cn-dim);font-size:11px;white-space:nowrap;min-width:34px;text-align:center}",
			".cn-mini{border:none;background:transparent;color:var(--cn-dim);cursor:pointer;border-radius:5px;font-size:12px;line-height:18px;padding:0 4px}",
			".cn-mini:hover{color:var(--cn-accent)}",
			".cn-mini.on{color:var(--cn-accent)}",
			".cn-ico{width:14px;height:14px;display:inline-block;vertical-align:-2px;fill:currentColor}",
			".cn-warn{flex:none;color:var(--cn-warn);background:var(--cn-warn-bg);border-radius:6px;padding:3px 10px;font-size:12px;line-height:16px;margin:6px 10px 0}",
			".cn-body{position:relative;flex:1;min-height:0;overflow:auto;margin-top:6px;border-top:1px solid var(--cn-border)}",
			".cn-code{min-width:max-content;padding:4px 0 16px}",
			".cn-line{display:flex;padding:0 10px 0 0}",
			".cn-line:hover{background:var(--cn-line-hover)}",
			".cn-line.flash{background:var(--cn-flash);animation:cn-flash 1.4s ease-out}",
			"@keyframes cn-flash{0%{background:var(--cn-flash-strong)}100%{background:var(--cn-flash)}}",
			".cn-ln{flex:none;width:44px;padding-right:10px;text-align:right;color:var(--cn-ln);user-select:none;font-size:12px;line-height:20px}",
			".cn-code-wrap{flex:1;white-space:pre;min-width:0}",
			".cn-code-wrap .cn-c{color:var(--cn-comment);font-style:italic}",
			".cn-code-wrap .cn-s{color:var(--cn-string)}",
			".cn-code-wrap .cn-k{color:var(--cn-kw)}",
			".cn-code-wrap .cn-t{color:var(--cn-type)}",
			".cn-code-wrap .cn-n{color:var(--cn-num)}",
			".cn-code-wrap .cn-f{color:var(--cn-fn)}",
			".cn-code-wrap .cn-i{color:var(--cn-ident)}",
			".cn-code-wrap .cn-m{background:var(--cn-match-bg);border-radius:2px}",
			".cn-code-wrap .cn-cu{background:var(--cn-match-cur);outline:1px solid var(--cn-match-cur);border-radius:2px}",
			".cn-plain{white-space:pre;padding:8px 12px;color:var(--cn-ident);font-family:var(--ds-font-family-code,monospace);font-size:12px;line-height:18px}",
			".cn-sympop{position:absolute;top:30px;right:10px;left:10px;z-index:60;max-height:calc(100% - 46px);overflow:auto;border:1px solid var(--cn-border);border-radius:10px;background:var(--cn-pop-bg);box-shadow:0 8px 28px rgba(0,0,0,.28);padding:4px}",
			".cn-symhead{display:flex;align-items:center;gap:8px;padding:4px 8px 6px;font-size:12px;color:var(--cn-dim);border-bottom:1px solid var(--cn-border);margin-bottom:4px}",
			".cn-symclose{margin-left:auto;border:none;background:transparent;color:var(--cn-dim);cursor:pointer;font-size:14px;line-height:16px;border-radius:5px;padding:0 6px}",
			".cn-symclose:hover{color:var(--cn-accent)}",
			".cn-symrow{display:flex;align-items:center;gap:6px;padding:3px 8px;border-radius:7px;cursor:pointer;font-size:12px;line-height:18px}",
			".cn-symrow:hover{background:var(--cn-line-hover)}",
			".cn-symkind{flex:none;font-size:10px;line-height:14px;border-radius:5px;padding:0 5px;color:var(--cn-accent);border:1px solid var(--cn-accent);opacity:.9}",
			".cn-symname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--cn-fg)}",
			".cn-symname .cn-symcont{color:var(--cn-dim)}",
			".cn-symline{flex:none;color:var(--cn-dim3);font-size:11px}",
			".cn-empty{padding:24px 16px;text-align:center;color:var(--cn-dim3);font-size:12px}",
			".cn-shade{position:absolute;inset:0;z-index:59;background:transparent}",
			// 选中文字浮层：与 better-sidebar 内置查看器的 .selectionPopup 同一观感
			// （dsw 令牌优先，缺失时回落到本插件调色板变量）。
			".cn-selpop{position:fixed;z-index:60;transform:translate(-50%,calc(-100% - 8px));display:inline-flex;align-items:center;height:28px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1,var(--cn-selpop-border));border-radius:6px;background:var(--dsw-alias-bg-layer-2,var(--cn-selpop-bg));color:var(--dsw-alias-label-primary,var(--cn-selpop-fg));font-size:11px;font-weight:500;line-height:16px;white-space:nowrap;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.24)}",
			".cn-selpop:hover{background:var(--dsw-alias-interactive-bg-hover,var(--cn-selpop-hover))}"
		].join("");
		const tagId = "dsh-code-nav/styles.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-code-nav";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion

		//#region palette
		/** 解析 CSS 颜色为 RGB 三元组。 */
		function parseCssColor(s) {
			if (typeof s !== "string") return null;
			const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(s);
			if (m !== null) return [Number(m[1]), Number(m[2]), Number(m[3])];
			const h = /^#([0-9a-f]{6})$/i.exec(s.trim());
			if (h !== null) {
				const v = parseInt(h[1], 16);
				return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
			}
			return null;
		}
		/** 依据页面背景亮度判定深浅色（跟随 dsw 令牌 / body 背景）。 */
		function detectDark() {
			try {
				const cs = getComputedStyle(document.documentElement);
				let bg = cs.getPropertyValue("--dsw-alias-bg-primary") || cs.getPropertyValue("--dsw-alias-bg-base") || cs.getPropertyValue("--dsw-alias-bg-strong") || "";
				bg = bg.trim();
				if (bg.length === 0) bg = getComputedStyle(document.body).backgroundColor;
				const rgb = parseCssColor(bg);
				if (rgb === null) return false;
				const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
				return lum < 0.5;
			} catch {
				return false;
			}
		}
		//#endregion

		//#region selection → draft
		/**
		 * 选区端点所在的行元素（`data-cn-line` 行容器）。
		 * @param {Node|null} node
		 * @param {HTMLElement} host 代码区容器
		 * @returns {HTMLElement|null}
		 */
		function lineElementOf(node, host) {
			let el = node === null || node === undefined ? null : (node.nodeType === 1 ? node : node.parentElement);
			while (el !== null && el !== host) {
				if (typeof el.getAttribute === "function" && el.getAttribute("data-cn-line") !== null) return el;
				el = el.parentElement;
			}
			return null;
		}

		/**
		 * 选区端点在某一行的代码列里的列偏移（0 起）；端点不在该列内返回 null。
		 * @param {HTMLElement} wrap 该行的 `.cn-code-wrap`
		 * @param {Node} node
		 * @param {number} offset
		 * @returns {number|null}
		 */
		function columnInLine(wrap, node, offset) {
			if (node === null || !wrap.contains(node)) return null;
			try {
				const probe = document.createRange();
				probe.selectNodeContents(wrap);
				probe.setEnd(node, offset);
				return probe.toString().length;
			} catch {
				return null;
			}
		}

		/**
		 * 选区 → 源码文本 + 行区间。文本按行的代码列（`.cn-code-wrap`，即原始
		 * 行文本）逐行切片，而不是 `Selection.toString()`：后者会把行号槽（
		 * `user-select:none`，各浏览器处理不一致）和块级换行算进来。取不到行容器
		 * （纯文本兜底视图）或端点在行号槽里时回落到 `Selection.toString()`。
		 *
		 * 端点正好落在末行行首时该行其实没被选中：丢掉这一空行并把行号收窄一行，
		 * 与编辑器里向下拖一行的观感一致。
		 *
		 * @param {HTMLElement} host 代码区容器
		 * @param {Selection} sel 非折叠选区
		 * @returns {{text:string, lines:{start:number,end:number}|undefined}}
		 */
		function selectionOfDom(host, sel) {
			const fallback = { text: sel.toString(), lines: undefined };
			const range = sel.getRangeAt(0);
			const startEl = lineElementOf(range.startContainer, host);
			const endEl = lineElementOf(range.endContainer, host);
			if (startEl === null || endEl === null) return fallback;
			const all = Array.prototype.slice.call(host.querySelectorAll("[data-cn-line]"));
			const i0 = all.indexOf(startEl);
			const i1 = all.indexOf(endEl);
			if (i0 === -1 || i1 === -1) return fallback;
			// 文档顺序上的首/末行（向上拖拽时 anchor 在 focus 之后）
			const forward = i0 <= i1;
			const firstEl = forward ? startEl : endEl;
			const lastEl = forward ? endEl : startEl;
			const firstNode = forward ? range.startContainer : range.endContainer;
			const firstOffset = forward ? range.startOffset : range.endOffset;
			const lastNode = forward ? range.endContainer : range.startContainer;
			const lastOffset = forward ? range.endOffset : range.startOffset;
			const firstNo = Number(firstEl.getAttribute("data-cn-line"));
			const lastNo = Number(lastEl.getAttribute("data-cn-line"));
			if (!Number.isFinite(firstNo) || !Number.isFinite(lastNo)) return fallback;
			const firstWrap = firstEl.querySelector(".cn-code-wrap");
			const lastWrap = lastEl.querySelector(".cn-code-wrap");
			if (firstWrap === null || lastWrap === null) return fallback;
			const startCol = columnInLine(firstWrap, firstNode, firstOffset);
			const endCol = columnInLine(lastWrap, lastNode, lastOffset);
			if (startCol === null || endCol === null) return fallback;
			const parts = [];
			for (let no = firstNo; no <= lastNo; no++) {
				const el = all[no - 1];
				const wrap = el === undefined || el.getAttribute("data-cn-line") !== String(no)
					? null
					: el.querySelector(".cn-code-wrap");
				if (wrap === null) return fallback;
				const raw = wrap.textContent;
				if (no === firstNo && no === lastNo) parts.push(raw.slice(startCol, endCol));
				else if (no === firstNo) parts.push(raw.slice(startCol));
				else if (no === lastNo) parts.push(raw.slice(0, endCol));
				else parts.push(raw);
			}
			let endLine = lastNo;
			if (parts.length > 1 && parts[parts.length - 1] === "") {
				parts.pop();
				endLine -= 1;
			}
			return { text: parts.join("\n"), lines: { start: firstNo, end: endLine } };
		}

		/**
		 * 会话输入框的 `<textarea>`：优先对话列里带 `data-phase` 标记的那个，
		 * 再退到列内任意 textarea，最后退到全页面带标记的 textarea。
		 * @returns {HTMLTextAreaElement|null}
		 */
		function findComposerTextarea() {
			if (typeof document === "undefined") return null;
			const column = document.querySelector('#root [data-slot="conversation"]');
			const find = (scope) => scope.querySelector("textarea[data-phase]") ?? scope.querySelector("textarea");
			return column !== null ? find(column) : document.querySelector("textarea[data-phase]");
		}

		/**
		 * 从输入框 DOM 读当前光标/选区（草稿 store 没有光标 API）。做值同步校验：
		 * 读到的光标必须是对着同一份草稿量的，否则丢弃（宁可追加到末尾）。
		 * @param {string} draft 当前草稿
		 * @returns {{start:number, end:number}|null}
		 */
		function probeComposerCaret(draft) {
			const el = findComposerTextarea();
			if (el === null || el.disabled || el.readOnly || el.value !== draft) return null;
			const start = el.selectionStart;
			const end = el.selectionEnd;
			if (typeof start !== "number" || typeof end !== "number") return null;
			if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
			const s = Math.max(0, Math.min(start, draft.length));
			const e = Math.max(s, Math.min(end, draft.length));
			return { start: s, end: e };
		}

		/**
		 * 把文本插进草稿（覆盖当前选区），并给出插入文本之后的光标位置；
		 * 光标未知（caret === null）时追加到末尾。两侧按需补一个空格，且不与
		 * 已有空白重复 —— 与手工在句子中间输入的手感一致。
		 * @param {string} draft
		 * @param {string} text
		 * @param {{start:number, end:number}|null} caret
		 * @returns {{draft:string, caretAfter:number}}
		 */
		function spliceInsert(draft, text, caret) {
			if (caret === null || draft === "") {
				const next = draft.trim() === "" ? text : draft + " " + text;
				return { draft: next, caretAfter: next.length };
			}
			const prefix = draft.slice(0, caret.start);
			const suffix = draft.slice(caret.end);
			if (prefix === "" && suffix === "") return { draft: text, caretAfter: text.length };
			const left = prefix === "" || /\s$/.test(prefix) ? "" : " ";
			const right = suffix === "" || /^\s/.test(suffix) ? "" : " ";
			return {
				draft: prefix + left + text + right + suffix,
				caretAfter: prefix.length + left.length + text.length
			};
		}

		/**
		 * 程序化改草稿会把受控 textarea 的光标重置到开头，于是下一次插入会以
		 * 重置位置为基准、连续插入错位。这里在值提交后（最多两帧内、且值仍然
		 * 是自己写的那份）把光标放回插入文本之后。
		 * @param {string} expectedDraft
		 * @param {number} caretIndex
		 */
		function placeCaretAfterInsert(expectedDraft, caretIndex) {
			let remaining = 2;
			let scheduled = false;
			const schedule = (fn) => {
				if (scheduled) return;
				scheduled = true;
				if (typeof requestAnimationFrame === "function") requestAnimationFrame(fn);
				else setTimeout(fn, 0);
			};
			const place = () => {
				scheduled = false;
				if (remaining <= 0) return;
				remaining -= 1;
				const el = findComposerTextarea();
				if (el === null || el.disabled || el.readOnly) return;
				if (el.value !== expectedDraft) {
					schedule(place);
					return;
				}
				const at = Math.max(0, Math.min(caretIndex, el.value.length));
				el.setSelectionRange(at, at);
			};
			schedule(place);
		}

		/**
		 * 读当前草稿（detect 坐标：引用 chip 计 1 个 U+FFFC）。
		 * @param {object} input 会话输入面板（SessionInput）
		 * @returns {string}
		 */
		function readDraft(input) {
			try {
				const snap = input.state.getSnapshot();
				return snap !== null && snap !== undefined && typeof snap.draft === "string" ? snap.draft : "";
			} catch (error) {
				return "";
			}
		}

		/**
		 * 按插入区间两侧的空白情况给载荷补分隔空格（与旧路径 spliceInsert 同规则，
		 * 只是区间来自官方 captureInsertion() 而不是 DOM 探针）。
		 * @param {string} draft
		 * @param {{start:number,end:number}} span
		 * @param {string} text
		 * @returns {string}
		 */
		function paddedInsert(draft, span, text) {
			const rawStart = typeof span.start === "number" ? span.start : 0;
			const rawEnd = typeof span.end === "number" ? span.end : rawStart;
			const start = Math.max(0, Math.min(rawStart, draft.length));
			const end = Math.max(start, Math.min(rawEnd, draft.length));
			const prefix = draft.slice(0, start);
			const suffix = draft.slice(end);
			if (prefix === "" && suffix === "") return text;
			const left = prefix === "" || /\s$/.test(prefix) ? "" : " ";
			const right = suffix === "" || /^\s/.test(suffix) ? "" : " ";
			return left + text + right;
		}

		/**
		 * 官方插入路径：DSH 的会话输入面板公开 `actions.captureInsertion()` /
		 * `actions.insertText(text, span)`（一次可撤销的纯文本编辑，带草稿版本
		 * 守卫，会保留引用 chip 与用户的后续编辑）。比 DOM 探光标 + setDraft 整串
		 * 回写稳得多，因此优先走它。
		 * @param {object} input
		 * @param {string} text
		 * @returns {boolean} 是否插入成功
		 */
		function insertViaActions(input, text) {
			const actions = input.actions;
			if (actions === undefined || actions === null) return false;
			if (typeof actions.captureInsertion !== "function") return false;
			if (typeof actions.insertText !== "function") return false;
			const attempt = () => {
				const span = actions.captureInsertion();
				if (span === undefined || span === null) return false;
				return actions.insertText(paddedInsert(readDraft(input), span, text), span) === true;
			};
			// 点击即插，正常一次就中；被拒说明捕获之后草稿又被改动、或编辑器正在
			// 提交 —— 重捕一次再试。
			return attempt() || attempt();
		}

		/**
		 * 把一段文本插进当前会话的输入框草稿：优先官方 actions 路径（见上），
		 * 只有在旧版 DSH 没有该接口时才回退到「DOM 探光标 + setDraft」的旧路径。
		 * conversation 服务按名取（与宿主自身插件同一读法），取不到只告警、不抛出
		 * —— 预览器不能因为一次插入失败而崩掉。
		 * @param {object} ctx 客户端插件上下文
		 * @param {string} sessionId
		 * @param {string} text
		 * @returns {boolean} 是否写入成功
		 */
		function appendToDraft(ctx, sessionId, text) {
			try {
				if (ctx === undefined || ctx === null || typeof sessionId !== "string") return false;
				if (typeof ctx.sessions === "undefined" || ctx.sessions === null) return false;
				const actx = ctx.sessions.scope(sessionId);
				if (actx === undefined) {
					console.warn("[dsh-code-nav] draft insert skipped: no session scope", sessionId);
					return false;
				}
				const conversation = typeof ctx.get === "function" ? ctx.get("conversation") : undefined;
				if (conversation === undefined || conversation === null) {
					console.warn("[dsh-code-nav] draft insert skipped: conversation service unavailable");
					return false;
				}
				const input = conversation.input.for(actx);
				if (typeof input !== "object" || input === null) return false;
				if (input.actions !== undefined && input.actions !== null) {
					let refused = false;
					try {
						if (insertViaActions(input, text)) return true;
						refused = true;
					} catch (error) {
						// actions 自身抛错：当作该能力不可用，继续走旧路径（不吞掉用户的插入）。
						console.warn("[dsh-code-nav] composer actions threw; falling back:", error);
					}
					if (refused) {
						// 官方接口明确拒绝：草稿正忙或被改过。不动用户的草稿，留给他自己
						// 重试（这正是 insertText 的契约：结果由调用方保留）。
						console.warn("[dsh-code-nav] draft insert refused: draft is busy or moved");
						return false;
					}
				}
				// 旧版 DSH 回退：没有 actions 时才整串回写草稿。
				const draft = readDraft(input);
				const spliced = spliceInsert(draft, text, probeComposerCaret(draft));
				input.setDraft(spliced.draft);
				placeCaretAfterInsert(spliced.draft, spliced.caretAfter);
				return true;
			} catch (error) {
				console.warn("[dsh-code-nav] draft insert failed:", error);
				return false;
			}
		}

		/**
		 * 通过官方 `SessionInput.notify(level, text)` 往该会话的输入框送一条提示
		 * （接口缺失/会话未绑定时静默跳过）。
		 * @param {object} ctx
		 * @param {string} sessionId
		 * @param {"info"|"error"} level
		 * @param {string} text
		 * @returns {boolean} 是否送达
		 */
		function notifyComposer(ctx, sessionId, level, text) {
			try {
				if (ctx === undefined || ctx === null || typeof sessionId !== "string") return false;
				if (typeof ctx.sessions === "undefined" || ctx.sessions === null) return false;
				const actx = ctx.sessions.scope(sessionId);
				if (actx === undefined) return false;
				const conversation = typeof ctx.get === "function" ? ctx.get("conversation") : undefined;
				if (conversation === undefined || conversation === null) return false;
				const input = conversation.input.for(actx);
				if (input === undefined || input === null || typeof input.notify !== "function") return false;
				input.notify(level, text);
				return true;
			} catch (error) {
				return false;
			}
		}
		//#endregion

		//#region locale
		const NS = "code-nav";
		const zh = {
			"viewer.title": "代码预览导航",
			"filter.all": "全部",
			"filter.class": "类",
			"filter.method": "方法",
			"filter.variable": "变量",
			"symbols": "符号",
			"symbols.close": "关闭符号列表 (Esc)",
			"symbols.empty": "未识别到符号",
			"search.placeholder": "在文件中查找…",
			"search.case": "区分大小写",
			"search.prev": "上一个",
			"search.next": "下一个",
			"search.noMatch": "无匹配",
			"selection.add": "添加到对话",
			"selection.conflict": "输入框正忙或草稿已改动，请再点一次",
			"truncated": "文件过大，仅显示前 500KB",
			"lang.unknown": "未知类型"
		};
		const en = {
			"viewer.title": "Code Preview Navigator",
			"filter.all": "All",
			"filter.class": "Class",
			"filter.method": "Method",
			"filter.variable": "Variable",
			"symbols": "Symbols",
			"symbols.close": "Close symbols (Esc)",
			"symbols.empty": "No symbols found",
			"search.placeholder": "Find in file…",
			"search.case": "Match case",
			"search.prev": "Previous",
			"search.next": "Next",
			"search.noMatch": "No matches",
			"selection.add": "Add to conversation",
			"selection.conflict": "The composer is busy or the draft changed — click again",
			"truncated": "File too large — showing first 500KB",
			"lang.unknown": "Unknown"
		};
		//#endregion

		//#region component
		const KIND_META = {
			class: "C", interface: "I", struct: "S", enum: "E", impl: "I",
			trait: "T", method: "M", function: "F", constructor: "C",
			variable: "V", field: "F", constant: "K"
		};
		const FILTERS = ["all", "class", "method", "variable"];

		/** 深浅色 CSS 变量组。 */
		const PALETTES = {
			dark: {
				fg: "#e8e8e8", plain: "#d4d4d4", ident: "#d4d4d4",
				comment: "#6a9955", string: "#ce9178", kw: "#569cd6",
				type: "#4ec9b0", num: "#b5cea8", fn: "#dcdcaa",
				ln: "#6e6e6e", dim: "#9a9a9a", dim3: "#6e6e6e",
				border: "rgba(255,255,255,.14)", badgeBg: "rgba(255,255,255,.08)", badgeFg: "#b8d7ff",
				accent: "#4da3ff", accentBg: "rgba(77,163,255,.14)",
				inputBg: "rgba(255,255,255,.05)", lineHover: "rgba(255,255,255,.05)",
				flash: "rgba(77,163,255,.18)", flashStrong: "rgba(77,163,255,.4)",
				popBg: "#232323", warn: "#e8b34b", warnBg: "rgba(232,179,75,.12)"
			},
			light: {
				fg: "#1f1f1f", plain: "#1f1f1f", ident: "#1f1f1f",
				comment: "#008000", string: "#a31515", kw: "#0000ff",
				type: "#267f99", num: "#098658", fn: "#795e26",
				ln: "#9c9c9c", dim: "#6f6f6f", dim3: "#a0a0a0",
				border: "rgba(0,0,0,.16)", badgeBg: "rgba(38,127,153,.1)", badgeFg: "#0b5c70",
				accent: "#0b6fd6", accentBg: "rgba(11,111,214,.1)",
				inputBg: "rgba(0,0,0,.03)", lineHover: "rgba(0,0,0,.045)",
				flash: "rgba(11,111,214,.14)", flashStrong: "rgba(11,111,214,.32)",
				popBg: "#ffffff", warn: "#9a6700", warnBg: "rgba(154,103,0,.1)"
			}
		};

		function CodePreviewView(props) {
			const { ctx, scope, path, title, content, truncated } = props;
			const codeRef = react.useRef(null);
			const [dark, setDark] = react.useState(() => detectDark());
			const [filter, setFilter] = react.useState("all");
			const [symOpen, setSymOpen] = react.useState(false);
			const [flashLine, setFlashLine] = react.useState(null);
			const [query, setQuery] = react.useState("");
			const [caseSensitive, setCaseSensitive] = react.useState(false);
			const [cur, setCur] = react.useState(0);
			const flashTimer = react.useRef(null);
			/** 选中文字浮层（视口锚定；null = 隐藏）。 */
			const [selPop, setSelPop] = react.useState(null);
			/** 浮层数据的实时镜像：全局监听器只注册一次，必须读 ref 而非闭包。 */
			const selPopRef = react.useRef(null);
			/** portal 出去的那个按钮本身（用于「按钮自己的 mousedown 不算外部点击」）。 */
			const selBtnRef = react.useRef(null);
			/** 代码区可见性观察器（切页签/收面板时浮层必须跟着消失）。 */
			const selObserverRef = react.useRef(null);

			const hideSelPop = () => {
				selPopRef.current = null;
				setSelPop(null);
			};

			const showSelPop = (insert, left, top) => {
				const next = {
					insert: insert,
					left: Math.min(Math.max(left, 80), window.innerWidth - 80),
					top: top
				};
				selPopRef.current = next;
				setSelPop(next);
			};

			/** 点击浮层：把载荷写进会话草稿，写成功才收起浮层。 */
			const commitSelPop = () => {
				const current = selPopRef.current;
				if (current === null) return;
				const sessionId = scope === undefined || scope === null ? undefined : scope.sessionId;
				if (appendToDraft(ctx, sessionId, current.insert)) {
					hideSelPop();
					return;
				}
				// 官方 insertText 拒绝（草稿正忙或被改过）时按它的契约保留载荷：浮层
				// 不收起，用户可以直接再点一次；同时把原因说出来。
				notifyComposer(ctx, sessionId, "error", t("selection.conflict"));
			};

			// 主题跟随（body / html 的 class、style 变化 → 重判深浅色）
			react.useEffect(() => {
				const observer = new MutationObserver(() => setDark(detectDark()));
				const targets = [document.body, document.documentElement];
				for (const el of targets) observer.observe(el, { attributes: true, attributeFilter: ["class", "style"] });
				return () => observer.disconnect();
			}, []);

			// 浮层的兜底关闭：侧边栏的每个页签都是常驻挂载的（切页签只是把面板
			// 格子 display:none、收面板只是把它平移出屏），portal 出去的
			// position:fixed 按钮两者都感知不到，所以除滚动/选区塌陷之外还要有
			// 这些全局信号。按钮自己的 mousedown 不算外部点击（preventDefault
			// 保住选区，等 click 提交）。
			react.useEffect(() => {
				const onMouseDown = (e) => {
					if (selPopRef.current === null) return;
					const btn = selBtnRef.current;
					if (btn !== null && (btn === e.target || btn.contains(e.target))) return;
					hideSelPop();
				};
				const onKeyDown = (e) => {
					if (e.key === "Escape" && selPopRef.current !== null) hideSelPop();
				};
				const onVisibilityChange = () => {
					if (document.hidden) hideSelPop();
				};
				const onWindowBlur = () => hideSelPop();
				document.addEventListener("mousedown", onMouseDown, true);
				document.addEventListener("keydown", onKeyDown, true);
				document.addEventListener("visibilitychange", onVisibilityChange);
				window.addEventListener("blur", onWindowBlur);
				return () => {
					document.removeEventListener("mousedown", onMouseDown, true);
					document.removeEventListener("keydown", onKeyDown, true);
					document.removeEventListener("visibilitychange", onVisibilityChange);
					window.removeEventListener("blur", onWindowBlur);
					if (selObserverRef.current !== null) selObserverRef.current.disconnect();
					selObserverRef.current = null;
				};
			}, []);

			// 浮层打开时盯住代码区：面板一离开视口（切页签的 display:none、收面板
			// 的平移）就收起来 —— 这两种路径没有自己的 DOM 事件，几何信号是唯一
			// 可靠依据。
			const selPopOpen = selPop !== null;
			react.useEffect(() => {
				if (!selPopOpen) return;
				if (selObserverRef.current !== null) selObserverRef.current.disconnect();
				selObserverRef.current = null;
				if (typeof IntersectionObserver === "undefined") return;
				const surface = codeRef.current;
				if (surface === null) return;
				const observer = new IntersectionObserver((entries) => {
					for (const entry of entries) {
						if (!entry.isIntersecting) hideSelPop();
					}
				}, { threshold: 0 });
				selObserverRef.current = observer;
				observer.observe(surface);
			}, [selPopOpen]);

			// 换文件（内容换）→ 浮层失效
			react.useEffect(() => {
				hideSelPop();
			}, [content, path]);

			/**
			 * 代码区里选中文字 → 在其上方锚定「添加到对话」按钮。行号直接读
			 * `data-cn-line` 行容器（比 markdown 预览的文本反查精确）。
			 */
			const onCodeMouseUp = () => {
				const sel = window.getSelection();
				const host = codeRef.current;
				if (sel === null || sel.isCollapsed || sel.anchorNode === null || sel.focusNode === null || host === null) {
					hideSelPop();
					return;
				}
				if (!host.contains(sel.anchorNode) || !host.contains(sel.focusNode)) {
					hideSelPop();
					return;
				}
				const text = sel.toString();
				if (text.trim() === "") {
					hideSelPop();
					return;
				}
				const rect = sel.getRangeAt(0).getBoundingClientRect();
				if (rect.width === 0 && rect.height === 0) {
					hideSelPop();
					return;
				}
				const picked = selectionOfDom(host, sel);
				showSelPop(
					__cn.buildSelectionInsert(path, scope === undefined || scope === null ? undefined : scope.cwd, picked.lines, picked.text),
					rect.left + rect.width / 2,
					rect.top
				);
			};

			const lang = react.useMemo(() => __cn.langOf(path), [path]);
			const langLabel = __cn.langLabel(lang);
			const tokens = react.useMemo(() => (typeof content === "string" ? __cn.tokenizeLines(content, lang) : null), [content, lang]);
			const symbols = react.useMemo(() => (typeof content === "string" ? __cn.outlineOf(content, lang) : []), [content, lang]);
			const matches = react.useMemo(() => (typeof content === "string" ? __cn.findMatches(content, query, { caseSensitive }) : []), [content, query, caseSensitive]);
			const curIndex = matches.length > 0 ? Math.min(cur, matches.length - 1) : -1;

			/** 行 → 该行匹配区间表。 */
			const lineMatches = react.useMemo(() => {
				const map = new Map();
				for (let i = 0; i < matches.length; i++) {
					const m = matches[i];
					let arr = map.get(m.line);
					if (arr === undefined) { arr = []; map.set(m.line, arr); }
					arr.push({ col: m.col, end: m.col + (m.end - m.start) });
				}
				return map;
			}, [matches]);

			const jumpToLine = (line) => {
				setFlashLine(line);
				if (flashTimer.current !== null) clearTimeout(flashTimer.current);
				flashTimer.current = setTimeout(() => setFlashLine(null), 1600);
				requestAnimationFrame(() => {
					const el = codeRef.current === null ? null : codeRef.current.querySelector('[data-cn-line="' + line + '"]');
					if (el !== null) el.scrollIntoView({ block: "center", behavior: "smooth" });
				});
			};

			// 当前匹配变化 → 滚动到该匹配
			react.useEffect(() => {
				if (curIndex < 0) return;
				const el = codeRef.current === null ? null : codeRef.current.querySelector('[data-cn-cur="1"]');
				if (el !== null) el.scrollIntoView({ block: "center", behavior: "smooth" });
			}, [curIndex]);

			// 下拉打开期间：全局 Esc 关闭（capture 阶段，不依赖焦点位置）
			react.useEffect(() => {
				if (!symOpen) return;
				const onGlobalKey = (e) => {
					if (e.key === "Escape") {
						e.preventDefault();
						e.stopPropagation();
						setSymOpen(false);
					}
				};
				window.addEventListener("keydown", onGlobalKey, true);
				return () => window.removeEventListener("keydown", onGlobalKey, true);
			}, [symOpen]);

			const step = (delta) => {
				if (matches.length === 0) return;
				setCur((c) => (c + delta + matches.length) % matches.length);
			};
			const onQuery = (v) => { setQuery(v); setCur(0); };
			const onKeyDown = (e) => {
				if (e.key === "Enter") { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
				else if (e.key === "Escape") { setSymOpen(false); }
			};

			const filtered = symbols.filter((s) => filter === "all" || __cn.kindGroup(s.kind) === filter);
			const t = ctxLocale(props.ctx);

			const palette = PALETTES[dark ? "dark" : "light"];
			const rootStyle = {};
			for (const k of Object.keys(palette)) {
				// 驼峰键 → kebab-case CSS 变量（popBg → --cn-pop-bg）
				const cssKey = k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
				rootStyle["--cn-" + cssKey] = palette[k];
			}

			const rows = [];
			const maxLines = Math.min(tokens !== null ? tokens.length : 0, 20000);
			for (let i = 0; i < maxLines; i++) {
				const raw = tokens[i].raw;
				const lm = lineMatches.get(i);
				const lineMatchArr = lm === undefined ? [] : lm;
				let currentHere = -1;
				if (curIndex >= 0 && matches[curIndex].line === i) {
					currentHere = lineMatchArr.findIndex((m) => m.col === matches[curIndex].col);
				}
				const spans = __cn.spansOfLine(raw, tokens[i].segs, lineMatchArr, currentHere);
				const lineNodes = [];
				for (let s = 0; s < spans.length; s++) {
					const sp = spans[s];
					const cls = sp.cls === "c-comment" ? "cn-c" : sp.cls === "c-string" ? "cn-s" : sp.cls === "c-kw" ? "cn-k" : sp.cls === "c-type" ? "cn-t" : sp.cls === "c-num" ? "cn-n" : sp.cls === "c-fn" ? "cn-f" : sp.cls === "c-ident" ? "cn-i" : "";
					const extra = sp.match ? (sp.current ? " cn-cu" : " cn-m") : "";
					lineNodes.push(jsx("span", { key: s, className: cls + extra, "data-cn-cur": sp.current ? "1" : undefined, children: sp.text }));
				}
				rows.push(jsxs("div", {
					key: i,
					className: "cn-line" + (flashLine === i + 1 ? " flash" : ""),
					"data-cn-line": i + 1,
					children: [
						jsx("span", { className: "cn-ln", children: i + 1 }),
						jsx("span", { className: "cn-code-wrap", children: lineNodes })
					]
				}));
			}

			const symNodes = [];
			if (filtered.length === 0) {
				symNodes.push(jsx("div", { key: "empty", className: "cn-empty", children: t("symbols.empty") }));
			} else {
				for (let i = 0; i < filtered.length; i++) {
					const s = filtered[i];
					symNodes.push(jsxs("div", {
						key: i,
						className: "cn-symrow",
						onClick: (e) => { e.stopPropagation(); jumpToLine(s.line); setSymOpen(false); },
						children: [
							jsx("span", { className: "cn-symkind", children: KIND_META[s.kind] ?? "?" }),
							jsx("span", { className: "cn-symname", children: s.container === undefined ? s.name : jsxs(react.Fragment, { children: [s.name, jsx("span", { className: "cn-symcont", children: " — " + s.container })] }) }),
							jsx("span", { className: "cn-symline", children: s.line })
						]
					}));
				}
			}

			const body = tokens === null
				? jsx("pre", { className: "cn-plain", children: content ?? "" })
				: jsxs("div", { className: "cn-code", children: rows });

			return jsxs("div", {
				className: "cn-root",
				style: rootStyle,
				children: [
					jsxs("div", {
						className: "cn-head",
						children: [
							jsx("span", { className: "cn-title", title: path, children: title ?? path }),
							jsx("span", { className: "cn-badge", children: langLabel })
						]
					}),
					jsxs("div", {
						className: "cn-bar",
						children: [
							...FILTERS.map((f) => jsx("button", {
								key: f,
								type: "button",
								className: "cn-chip" + (filter === f ? " on" : ""),
								onClick: () => { setFilter(f); setSymOpen(false); },
								children: t("filter." + f)
							})),
							jsx("button", {
								type: "button",
								className: "cn-symbtn",
								onClick: () => setSymOpen((v) => !v),
								children: t("symbols") + " (" + filtered.length + ")"
							})
						]
					}),
					jsxs("div", {
						className: "cn-bar",
						children: [
							jsxs("div", {
								className: "cn-search",
								children: [
									jsx("input", {
										type: "text",
										value: query,
										placeholder: t("search.placeholder"),
										onChange: (e) => onQuery(e.target.value),
										onKeyDown: onKeyDown,
										spellCheck: false
									}),
									jsx("span", {
										className: "cn-count",
										children: matches.length === 0 ? (query.length > 0 ? t("search.noMatch") : "") : (curIndex + 1) + "/" + matches.length
									}),
									jsx("button", {
										type: "button",
										className: "cn-mini" + (caseSensitive ? " on" : ""),
										title: t("search.case"),
										onClick: () => { setCaseSensitive((v) => !v); setCur(0); },
										children: "Aa"
									}),
									jsx("button", {
										type: "button",
										className: "cn-mini",
										title: t("search.prev"),
										onClick: () => step(-1),
										children: "↑"
									}),
									jsx("button", {
										type: "button",
										className: "cn-mini",
										title: t("search.next"),
										onClick: () => step(1),
										children: "↓"
									})
								]
							})
						]
					}),
					truncated === true ? jsx("div", { className: "cn-warn", children: t("truncated") }) : null,
					jsxs("div", {
						className: "cn-body",
						ref: codeRef,
						onMouseUp: onCodeMouseUp,
						// 滚动会挪走锚点（按钮是 position:fixed）→ 直接收起
						onScroll: hideSelPop,
						children: [body]
					}),
					symOpen ? jsx(react.Fragment, { children: [
						jsx("div", { className: "cn-shade", onClick: (e) => { e.stopPropagation(); setSymOpen(false); } }),
						jsx("div", {
							className: "cn-sympop",
							onClick: (e) => e.stopPropagation(),
							children: [
								jsxs("div", {
									className: "cn-symhead",
									children: [
										jsx("span", { children: t("symbols") + " (" + filtered.length + ")" }),
										jsx("button", {
											type: "button",
											className: "cn-symclose",
											title: t("symbols.close"),
											"aria-label": t("symbols.close"),
											onClick: (e) => { e.stopPropagation(); setSymOpen(false); },
											children: "✕"
										})
									]
								}),
								...symNodes
							]
						})
					] }) : null,
					selPop === null || typeof document === "undefined" ? null : createPortal(jsx("button", {
						type: "button",
						ref: selBtnRef,
						className: "cn-selpop",
						style: {
							left: selPop.left,
							top: selPop.top,
							// portal 到了 body 上，拿不到 .cn-root 的 --cn-* 变量 → 内联兜底色
							"--cn-selpop-bg": palette.popBg,
							"--cn-selpop-fg": palette.fg,
							"--cn-selpop-border": palette.border,
							"--cn-selpop-hover": palette.lineHover
						},
						// 保住选区：按钮一 mousedown 选区就塌，click 也就不用提交了
						onMouseDown: (e) => { e.preventDefault(); },
						onClick: commitSelPop,
						children: t("selection.add")
					}), document.body, "cn-selpop")
				]
			});
		}

		/** 从 ctx 读取命名空间翻译函数。 */
		function ctxLocale(ctx) {
			try {
				return ctx.locale.bind(NS);
			} catch {
				return (k) => (zh[k] ?? en[k] ?? k);
			}
		}
		//#endregion

		//#region plugin
		const inject = ["betterSidebar", "locale"];

		/**
		 * 客户端插件主体：注册代码文件预览器。
		 * @param ctx - client root context。
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-code-nav: dictionaries");
			ctx.effect(() => ctx.betterSidebar.registerFileViewer({
				id: "dsh-code-nav:outline",
				title: () => ctxLocale(ctx)("viewer.title"),
				exts: Object.keys(__cn.LANG_EXT),
				priority: 10,
				fetchStrategy: "fsRead",
				component: CodePreviewView
			}), "dsh-code-nav: viewer");
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
