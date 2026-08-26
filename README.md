# dsh-code-nav

<div align="center">🌏 <a href="./README_EN.md"><b>English</b></a> · 中文</div>

DSH（DeepSeek Harness）Web 插件 —— **dsh-better-sidebar 代码预览导航**扩展。

在侧边栏打开代码文件时，自动按文件类型识别语言并接管预览，提供：

- 🎨 **按类型语法高亮** —— 扩展名 → 语言识别，轻量自研分词器（注释 / 字符串 / 关键字 / 类型 / 数字 / 函数），深浅色主题自动跟随
- 🧭 **符号大纲切换** —— 解析 class / interface / struct / enum / impl、方法 / 函数、变量 / 字段 / 常量；按「全部 / 类 / 方法 / 变量」筛选，下拉符号列表一键跳转定位（行闪烁）
- 🔍 **文件内查找** —— 高亮全部匹配、当前匹配强调、`n/m` 计数、↑/↓ 或 `Enter` / `Shift+Enter` 上下跳转、区分大小写开关

## 前置

- DSH `dsh web` 可正常运行
- 已安装 [dsh-better-sidebar](https://www.npmjs.com/package/dsh-better-sidebar)（含聚合包 `@linxin666/dsh-web-ui-all` 带入的场景）

## 安装

```sh
dsh plugin --profile web add <dsh-code-nav-0.1.0.tgz>
```

装完**重启 dsh web**（新增 bundle 需 host 侧重载），再硬刷新浏览器（Cmd/Ctrl+Shift+R）。

> 提示：better-sidebar 设置页「侧边卡片」中可看到本插件的预览器开关（代码预览导航 / Code Preview Navigator），关闭即回退到内置 CodeMirror 编辑器。

## 支持的语言

| 家族 | 扩展名 |
|---|---|
| JavaScript / TypeScript | `.js` `.mjs` `.cjs` `.ts` `.jsx` `.tsx` |
| Python | `.py` |
| Java / C# | `.java` `.cs` |
| C / C++ | `.c` `.h` `.cpp` `.cc` `.cxx` `.hpp` `.hh` `.hxx` |
| Go / Rust | `.go` `.rs` |
| PHP / Ruby | `.php` `.rb` |
| Swift / Kotlin | `.swift` `.kt` `.kts` |
| Lua / Shell | `.lua` `.sh` `.bash` `.zsh` |
| Vue / Svelte | `.vue`（取 `<script>` 块解析，行号偏移正确）`.svelte` |
| SQL | `.sql`（表 / 视图 / 函数等结构对象） |

非代码文件（markdown / html / 图片 / pdf 等）仍由 better-sidebar 内置查看器处理，不受影响。

## 开发

```sh
node test/code-nav.test.mjs   # 纯逻辑单测（25 例：分词 + 各语言大纲 + 查找）
node scripts/build.mjs        # 把 src/*.js 内联进 lib/client.js（无第三方 bundler）
node --check lib/client.js    # 语法校验
```

- `src/lang-registry.js` —— 扩展名映射 + 语言元数据（关键字 / 注释语法 / 字符串引号）
- `src/tokenize.js` —— 跨行状态机分词器（块注释、Python 三引号、C# 逐字字符串、转义）
- `src/outline.js` —— 括号深度 / 缩进驱动的大纲解析（Allman 大括号换行风格已支持）
- `src/search.js` —— 文件内查找与 token×匹配区间合并渲染
- `scripts/client.template.js` —— React 预览组件模板（构建时注入纯模块）

## 已知限制

- 高亮与大纲为轻量正则解析，非编译器级精度（复杂泛型、宏、模板元编程等场景可能漏检/误检）
- 接管代码预览为**只读**；需要编辑时可在 better-sidebar 设置中关闭本插件回退内置编辑器
- 单文件内容上限 500KB（与宿主截断一致，超出显示提示）
- Vue / Svelte 高亮按 `<script>` 内 JS/TS 处理，模板部分不高亮

## License

MIT
