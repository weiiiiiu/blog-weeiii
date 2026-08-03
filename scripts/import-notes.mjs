// 把《价格行为学》笔记转换成博客文章格式。
// 源文件的 frontmatter 用的是中文键（讲次/标题/原书页码/校对），
// 缺少 velite 必需的 title 与 date，直接放进 content/posts 会构建失败。
//
// 用法: node scripts/import-notes.mjs <源目录>
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const srcDir = process.argv[2];
if (!srcDir) {
  console.error("用法: node scripts/import-notes.mjs <源目录>");
  process.exit(1);
}

const outDir = "content/posts";
mkdirSync(outDir, { recursive: true });

// 讲次升序 → 时间戳降序，使博客「最新在前」的排序等于课程阅读顺序
const BASE_DATE = "2026-07-28";

const files = readdirSync(srcDir)
  .filter((f) => f.endsWith(".md"))
  .sort();

const parsed = files.map((file) => {
  const raw = readFileSync(join(srcDir, file), "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: 没有 frontmatter，中止`);

  const [, fmText, bodyRaw] = m;
  const fm = {};
  for (const line of fmText.split(/\r?\n/)) {
    const kv = line.match(/^([^:]+):\s*(.*)$/);
    if (kv) fm[kv[1].trim()] = kv[2].trim().replace(/^"(.*)"$/, "$1");
  }

  const lecture = fm["讲次"];
  const title = fm["标题"];
  if (!lecture || !title) throw new Error(`${file}: 缺少 讲次 或 标题，中止`);

  // 去掉正文开头重复的 H1（文章页模板已经渲染 post.title）
  const body = bodyRaw.replace(/^\s*#\s+[^\n]*\n+/, "");

  return { file, lecture, title, pages: fm["原书页码"], body };
});

// 讲次唯一性检查——文件名即 URL slug，重复会互相覆盖
const dupes = parsed
  .map((p) => p.lecture)
  .filter((v, i, a) => a.indexOf(v) !== i);
if (dupes.length) throw new Error(`讲次重复: ${[...new Set(dupes)].join(", ")}`);

const total = parsed.length;
parsed.forEach((p, i) => {
  const secs = (total - 1 - i) * 60;
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const date = `${BASE_DATE} ${hh}:${mm}:00`;

  const desc = p.pages
    ? `Al Brooks《价格行为学》第 ${p.lecture} 讲 · 原书 p${p.pages}`
    : `Al Brooks《价格行为学》第 ${p.lecture} 讲`;

  const out = `---
title: ${p.lecture} · ${p.title}
date: ${date}
categories: 价格行为学
tags:
  - 价格行为学
description: ${desc}
---

${p.body.trim()}
`;
  writeFileSync(join(outDir, `${p.lecture}.md`), out);
});

console.log(`已转换 ${total} 篇 → ${outDir}/`);
console.log(`讲次范围: ${parsed[0].lecture} … ${parsed[total - 1].lecture}`);
