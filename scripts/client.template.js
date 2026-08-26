/**
 * dsh-code-nav — client bundle（由 scripts/build.mjs 从 src/*.js 内联生成，
 * 勿手改 lib/client.js 的「pure modules」区段）。
 *
 * 依赖 dsh-better-sidebar 的 ctx.betterSidebar 服务，注册一个代码文件预览器：
 *  - 按扩展名识别语言 → 轻量语法高亮
 *  - 符号大纲（class / method / variable 筛选 + 跳转）
 *  - 文件内查找（高亮全部匹配、上/下一处、大小写切换）
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

		//#region pure modules (inlined by scripts/build.mjs)
		// __CN_PURE__
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
			".cn-shade{position:absolute;inset:0;z-index:59;background:transparent}"
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
			const { path, title, content, truncated } = props;
			const codeRef = react.useRef(null);
			const [dark, setDark] = react.useState(() => detectDark());
			const [filter, setFilter] = react.useState("all");
			const [symOpen, setSymOpen] = react.useState(false);
			const [flashLine, setFlashLine] = react.useState(null);
			const [query, setQuery] = react.useState("");
			const [caseSensitive, setCaseSensitive] = react.useState(false);
			const [cur, setCur] = react.useState(0);
			const flashTimer = react.useRef(null);

			// 主题跟随（body / html 的 class、style 变化 → 重判深浅色）
			react.useEffect(() => {
				const observer = new MutationObserver(() => setDark(detectDark()));
				const targets = [document.body, document.documentElement];
				for (const el of targets) observer.observe(el, { attributes: true, attributeFilter: ["class", "style"] });
				return () => observer.disconnect();
			}, []);

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
					jsxs("div", { className: "cn-body", ref: codeRef, children: [body] }),
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
					] }) : null
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
