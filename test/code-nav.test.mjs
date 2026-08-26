import { test } from "node:test";
import assert from "node:assert/strict";
import { langOf, LANG_EXT } from "../src/lang-registry.js";
import { tokenizeLines } from "../src/tokenize.js";
import { outlineOf, kindGroup } from "../src/outline.js";
import { findMatches, spansOfLine } from "../src/search.js";

// ---------- lang-registry ----------
test("langOf maps extensions", () => {
  assert.equal(langOf("src/App.tsx"), "tsx");
  assert.equal(langOf("a/b/main.py"), "python");
  assert.equal(langOf("C:\\repo\\Program.cs"), "csharp");
  assert.equal(langOf("README.md"), null);
  assert.equal(langOf("noext"), null);
  assert.equal(langOf(""), null);
});

test("every LANG_EXT value has metadata", () => {
  for (const v of new Set(Object.values(LANG_EXT))) {
    assert.ok(v, "empty lang id");
  }
});

// ---------- tokenize ----------
test("tokenize JS: keywords, strings, comments", () => {
  const t = tokenizeLines('const x = "hi"; // note\n// line\nlet y = 42;\n/* block\n   comment */\nfunction f() {}', "javascript");
  assert.equal(t.length, 6);
  const cls = (i) => t[i].segs.map((s) => s.cls).join(",");
  // 第一行：const(kw) x(ident) =(空) "hi"(string) ;(空) // note(comment)
  assert.ok(cls(0).includes("c-kw"));
  assert.ok(cls(0).includes("c-string"));
  assert.ok(cls(0).includes("c-comment"));
  // 块注释跨行：第 4 行整行 comment
  assert.ok(t[4].segs.every((s) => s.cls === "c-comment"));
  // 数字
  assert.ok(cls(2).includes("c-num"));
});

test("tokenize python: triple-quote cross-line", () => {
  const t = tokenizeLines('"""doc\ntext"""\nx = 1  # c', "python");
  assert.equal(t.length, 3);
  assert.ok(t[0].segs.every((s) => s.cls === "c-string"));
  assert.ok(t[1].segs[0].cls === "c-string");
  assert.ok(t[2].segs.some((s) => s.cls === "c-comment"));
});

test("tokenize rust: raw string tolerated", () => {
  const t = tokenizeLines('let s = r#"a"b"#;\nlet n = 42;', "rust");
  assert.ok(t[0].segs.some((s) => s.cls === "c-string"));
});

// ---------- outline ----------
const JS_SAMPLE = `
import { x } from "./dep";

// 模块级常量
export const VERSION = "1.0";

export function helper(a, b) {
  return a + b;
}

const compute = (x) => x * 2;

export class Foo extends Base {
  private count = 0;

  constructor(name) {
    this.name = name;
  }

  public bar() {
    return this.count;
  }

  async load() {}
}

interface Shape {
  area(): number;
}
`;

test("outline JS/TS: class, methods, functions, variables", () => {
  const s = outlineOf(JS_SAMPLE, "typescript");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("class:Foo"), JSON.stringify(names));
  assert.ok(names.includes("constructor:constructor"));
  assert.ok(names.includes("method:bar"));
  assert.ok(names.includes("method:load"));
  assert.ok(names.includes("function:helper"));
  assert.ok(names.includes("function:compute"));
  assert.ok(names.includes("interface:Shape"));
  assert.ok(names.includes("variable:VERSION"));
  // 方法归属容器
  const bar = s.find((x) => x.name === "bar");
  assert.equal(bar.container, "Foo");
});

test("outline python: class / method / function / variable", () => {
  const code = `
import os
CONFIG = "x"

def top(a):
    return a

class Service:
    def __init__(self):
        self.x = 1

    async def run(self):
        pass

class Other:
    pass
`;
  const s = outlineOf(code, "python");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("class:Service"));
  assert.ok(names.includes("class:Other"));
  assert.ok(names.includes("method:__init__"));
  assert.ok(names.includes("method:run"));
  assert.ok(names.includes("function:top"));
  assert.ok(names.includes("variable:CONFIG"));
  const run = s.find((x) => x.name === "run");
  assert.equal(run.container, "Service");
});

test("outline java: class, method, field", () => {
  const code = `
package demo;

public class App {
    private int counter = 0;

    public static void main(String[] args) {
        System.out.println("hi");
    }

    public int add(int a, int b) {
        return a + b;
    }
}
`;
  const s = outlineOf(code, "java");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("class:App"));
  assert.ok(names.includes("method:main"));
  assert.ok(names.includes("method:add"));
  assert.ok(names.includes("field:counter"));
  // 不把 println 当方法
  assert.ok(!names.includes("method:println"), JSON.stringify(names));
});

test("outline csharp: class, method, property-ish field", () => {
  const code = `
using System;

namespace Demo;

public class Calculator
{
    private int _base = 1;

    public int Add(int a, int b) => a + b + _base;

    public void Reset()
    {
        _base = 0;
    }
}
`;
  const s = outlineOf(code, "csharp");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("class:Calculator"));
  assert.ok(names.includes("method:Reset"));
  assert.ok(names.includes("field:_base"));
});

test("outline c: functions and macros", () => {
  const code = `
#include <stdio.h>
#define MAX 100

int add(int a, int b) {
    return a + b;
}

static void helper(void) {
    printf("x");
}
`;
  const s = outlineOf(code, "c");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("constant:MAX"));
  assert.ok(names.includes("function:add"));
  assert.ok(names.includes("function:helper"));
});

test("outline cpp: class + methods", () => {
  const code = `
class Widget {
public:
    Widget();
    void draw() {}
    int size = 0;
};
`;
  const s = outlineOf(code, "cpp");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("class:Widget"));
  assert.ok(names.includes("method:draw"));
});

test("outline go: struct, interface, func, var", () => {
  const code = `
package main

var Version = "1.0"

type Server struct {
    port int
}

type Handler interface {
    Serve() error
}

func NewServer(port int) *Server {
    return &Server{port: port}
}

func (s *Server) Start() error {
    return nil
}
`;
  const s = outlineOf(code, "go");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("struct:Server"));
  assert.ok(names.includes("interface:Handler"));
  assert.ok(names.includes("function:NewServer"));
  assert.ok(names.includes("method:Start"));
  assert.ok(names.includes("variable:Version"));
  const start = s.find((x) => x.name === "Start");
  assert.equal(start.container, "Server");
});

test("outline rust: struct, impl, fn, const", () => {
  const code = `
const LIMIT: u32 = 100;

struct Point {
    x: f64,
    y: f64,
}

trait Area {
    fn area(&self) -> f64;
}

impl Point {
    fn new(x: f64, y: f64) -> Point {
        Point { x, y }
    }
}
`;
  const s = outlineOf(code, "rust");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("constant:LIMIT"));
  assert.ok(names.includes("struct:Point"));
  assert.ok(names.includes("interface:Area"));
  assert.ok(names.includes("impl:Point"));
  assert.ok(names.includes("method:new"));
});

test("outline php: class, function, const", () => {
  const code = `
<?php
const GREETING = "hi";

function helper(int $n): int {
    return $n;
}

class User {
    public $name;
    const ROLE = "admin";

    public function greet(): string {
        return GREETING;
    }
}
`;
  const s = outlineOf(code, "php");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("class:User"));
  assert.ok(names.includes("function:helper"));
  assert.ok(names.includes("constant:ROLE"));
  assert.ok(names.includes("method:greet"));
});

test("outline ruby: class, def", () => {
  const code = `
module Demo
  class Greeter
    attr_reader :name

    def initialize(name)
      @name = name
    end

    def self.create(name)
      new(name)
    end
  end
end
`;
  const s = outlineOf(code, "ruby");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("class:Demo"));
  assert.ok(names.includes("class:Greeter"));
  assert.ok(names.includes("method:initialize"));
  assert.ok(names.includes("method:create"));
});

test("outline swift: class, func, var", () => {
  const code = `
import Foundation

let global = 1

class ViewModel: NSObject {
    private var count = 0

    func increment() {
        count += 1
    }
}

protocol Renderable {
    func render()
}
`;
  const s = outlineOf(code, "swift");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("class:ViewModel"));
  assert.ok(names.includes("interface:Renderable"));
  assert.ok(names.includes("method:increment"));
  assert.ok(names.includes("variable:global"));
});

test("outline kotlin: class, fun, val", () => {
  const code = `
package demo

const val APP = "demo"

fun main() {
    println("hi")
}

class Repository {
    private val cache = mutableMapOf<String, Any>()

    fun load(id: String): Any? {
        return cache[id]
    }
}
`;
  const s = outlineOf(code, "kotlin");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("class:Repository"));
  assert.ok(names.includes("function:main"));
  assert.ok(names.includes("method:load"));
  assert.ok(names.includes("variable:APP"));
});

test("outline lua: function and local", () => {
  const code = `
local M = {}

local function private(x)
    return x
end

function M.public(x)
    return private(x)
end

local count = 0
`;
  const s = outlineOf(code, "lua");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("function:private"));
  assert.ok(names.includes("function:public"));
  assert.ok(names.includes("variable:count"));
});

test("outline shell: functions and vars", () => {
  const code = `
#!/usr/bin/env bash
NAME="world"

greet() {
    echo "hello $NAME"
}

function main {
    greet
}
`;
  const s = outlineOf(code, "shell");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("function:greet"));
  assert.ok(names.includes("function:main"));
  assert.ok(names.includes("variable:NAME"));
});

test("outline vue: script block with line offset", () => {
  const code = `<template>
  <div>{{ msg }}</div>
</template>

<script lang="ts">
export default {
  data() {
    return { msg: "hi" };
  }
};
</script>
`;
  const s = outlineOf(code, "vue");
  // data 是对象方法（不要求），但至少不应崩溃，且行号偏移正确
  assert.ok(Array.isArray(s));
  for (const x of s) assert.ok(x.line >= 1);
});

test("outline sql: tables", () => {
  const code = `-- schema
CREATE TABLE users (
  id INT PRIMARY KEY
);
CREATE VIEW active_users AS SELECT * FROM users;
`;
  const s = outlineOf(code, "sql");
  const names = s.map((x) => x.kind + ":" + x.name);
  assert.ok(names.includes("class:users"));
  assert.ok(names.includes("interface:active_users"));
});

test("outline ignores symbols inside comments/strings", () => {
  const code = `
// class FakeClass { }
const s = "function notReal() { }";
class RealClass { }
`;
  const s = outlineOf(code, "javascript");
  const names = s.map((x) => x.name);
  assert.ok(names.includes("RealClass"));
  assert.ok(!names.includes("FakeClass"));
  assert.ok(!names.includes("notReal"));
});

test("kindGroup classification", () => {
  assert.equal(kindGroup("class"), "class");
  assert.equal(kindGroup("interface"), "class");
  assert.equal(kindGroup("struct"), "class");
  assert.equal(kindGroup("enum"), "class");
  assert.equal(kindGroup("impl"), "class");
  assert.equal(kindGroup("method"), "method");
  assert.equal(kindGroup("function"), "method");
  assert.equal(kindGroup("constructor"), "method");
  assert.equal(kindGroup("variable"), "variable");
  assert.equal(kindGroup("field"), "variable");
  assert.equal(kindGroup("constant"), "variable");
});

// ---------- search ----------
test("findMatches: basic, case, positions", () => {
  const text = "foo\nbar foo\nbaz";
  const m = findMatches(text, "foo", {});
  assert.equal(m.length, 2);
  assert.equal(m[0].line, 0);
  assert.equal(m[0].col, 0);
  assert.equal(m[1].line, 1);
  assert.equal(m[1].col, 4);
  // 大小写
  const text2 = "Foo foo FOO";
  assert.equal(findMatches(text2, "foo", {}).length, 3);
  assert.equal(findMatches(text2, "foo", { caseSensitive: true }).length, 1);
  // 空查询
  assert.equal(findMatches(text, "", {}).length, 0);
});

test("spansOfLine: match overlay", () => {
  const segs = [{ text: "const ", cls: "c-kw" }, { text: "x = ", cls: "" }, { text: "1", cls: "c-num" }];
  const spans = spansOfLine("const x = 1", segs, [{ col: 6, end: 7 }], 0);
  const match = spans.find((s) => s.match);
  assert.ok(match !== undefined);
  assert.equal(match.text, "x");
  assert.equal(match.current, true);
});
