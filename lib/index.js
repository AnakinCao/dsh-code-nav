/**
 * dsh-code-nav — host half（占位插件）。
 *
 * 本插件是纯浏览器端扩展：所有逻辑在 lib/client.js，通过
 * dsh-better-sidebar 暴露的 ctx.betterSidebar 服务注册一个代码文件预览器
 * （语法高亮 + 符号大纲 + 文件内查找）。
 *
 * 宿主侧只需要一个能正常 import 的空插件，让 loader entry 挂载成功
 * （client-modules 依据 entry.name 注册并下发客户端 bundle）。
 *
 * @module dsh-code-nav
 */

export const name = "dsh-code-nav";
export const inject = [];
export function apply() {}
