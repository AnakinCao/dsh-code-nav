# dsh-code-nav

DSH (DeepSeek Harness) web plugin — **code preview navigator** for [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar).

When you open a code file in the sidebar, it detects the language by file type and takes over the preview with:

- 🎨 **Per-language syntax highlighting** — extension → language detection with a lightweight hand-rolled tokenizer (comments / strings / keywords / types / numbers / functions); light & dark palettes follow the app theme automatically
- 🧭 **Symbol outline navigation** — parses `class` / `interface` / `struct` / `enum` / `impl`, methods / functions, variables / fields / constants; filter by **All / Class / Method / Variable** chips, or jump from a dropdown symbol list (line flash on jump)
- 🔍 **In-file search** — highlights all matches, emphasizes the current one, shows `n/m` count, navigates with ↑/↓ buttons or `Enter` / `Shift+Enter`, with a match-case toggle

## Prerequisites

- DSH (`dsh web`) running
- [dsh-better-sidebar](https://www.npmjs.com/package/dsh-better-sidebar) installed (including the bundled scenario via the aggregate package `@linxin666/dsh-web-ui-all`)

## Install

```sh
dsh plugin --profile web add https://github.com/AnakinCao/dsh-code-nav.git
```

Then **restart `dsh web`** (a new bundle needs a host-side reload) and **hard-refresh** the browser (Cmd/Ctrl+Shift+R).

> The plugin shows up as an enable/disable card in the better-sidebar settings ("Code Preview Navigator"); disabling it falls back to the built-in CodeMirror editor.

## Supported languages

| Family | Extensions |
|---|---|
| JavaScript / TypeScript | `.js` `.mjs` `.cjs` `.ts` `.jsx` `.tsx` |
| Python | `.py` |
| Java / C# | `.java` `.cs` |
| C / C++ | `.c` `.h` `.cpp` `.cc` `.cxx` `.hpp` `.hh` `.hxx` |
| Go / Rust | `.go` `.rs` |
| PHP / Ruby | `.php` `.rb` |
| Swift / Kotlin | `.swift` `.kt` `.kts` |
| Lua / Shell | `.lua` `.sh` `.bash` `.zsh` |
| Vue / Svelte | `.vue` (parses the `<script>` block, line offsets preserved) `.svelte` |
| SQL | `.sql` (tables / views / functions etc.) |

Non-code files (markdown / html / images / pdf …) keep using the built-in viewers.

## Development

```sh
node test/code-nav.test.mjs   # unit tests (25 cases: tokenizer + per-language outline + search)
node scripts/build.mjs        # inlines src/*.js into lib/client.js (no third-party bundler)
node --check lib/client.js    # syntax check
```

- `src/lang-registry.js` — extension map + language metadata (keywords / comment syntax / string quotes)
- `src/tokenize.js` — cross-line state-machine tokenizer (block comments, Python triple quotes, C# verbatim strings, escapes)
- `src/outline.js` — brace-depth / indent driven outline parser (Allman brace-on-next-line style supported)
- `src/search.js` — in-file match finder + token×match span merging
- `scripts/client.template.js` — React preview component template (pure modules injected at build time)

## Known limitations

- Highlighting and outline are lightweight regex parsing, not compiler-grade (complex generics, macros, template metaprogramming may be missed or misdetected)
- Preview takeover is **read-only**; disable the plugin in better-sidebar settings to get the built-in editor back
- Single-file content cap 500KB (matches host truncation; a notice is shown beyond it)
- Vue / Svelte highlight the `<script>` block as JS/TS; template sections are not highlighted

## License

MIT
