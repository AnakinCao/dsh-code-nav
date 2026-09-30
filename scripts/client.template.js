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
