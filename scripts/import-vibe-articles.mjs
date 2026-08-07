// 把《Vibe coding 需要知道的设计术语》三篇转换成博客文章格式。
// 源文件来自 linux.do，frontmatter 带 url/author/论坛标签，正文含论坛用语与站外互链。
//
// 用法: node scripts/import-vibe-articles.mjs <源目录>
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const srcDir = process.argv[2];
if (!srcDir) {
  console.error("用法: node scripts/import-vibe-articles.mjs <源目录>");
  process.exit(1);
}

const ARTICLES = [
  {
    file: "Vibe coding需要知道的设计术语——文字排版.md",
    slug: "vibe-coding-typography",
    title: "Vibe Coding 需要知道的设计术语——文字排版",
    date: "2026-06-18 12:00:00",
    description:
      "字体分类、字号层级、行高与字距——把「排版难看」翻译成 AI 听得懂的英文术语。",
    topic: "2431084",
  },
  {
    file: "Vibe coding需要知道的设计术语——色彩系统.md",
    slug: "vibe-coding-color-system",
    title: "Vibe Coding 需要知道的设计术语——色彩系统",
    date: "2026-06-23 12:00:00",
    description:
      "主色、语义色、中性色与对比度——让 AI 明白哪些颜色该强调、哪些只做背景。",
    topic: "2454227",
  },
  {
    file: "Vibe coding需要知道的设计术语——布局排版 (1).md",
    slug: "vibe-coding-layout",
    title: "Vibe Coding 需要知道的设计术语——栅格与布局",
    date: "2026-06-26 12:00:00",
    description:
      "栅格、间距、对齐与滚动容器——描述页面结构时该用的那套词汇。",
    topic: "2480260",
  },
];

// 原帖链接 → 本站内链，用于改写文末 roadmap 的互相引用
const TOPIC_TO_SLUG = Object.fromEntries(
  ARTICLES.map((a) => [a.topic, a.slug]),
);

for (const a of ARTICLES) {
  const raw = readFileSync(join(srcDir, a.file), "utf8");
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${a.file}: 没有 frontmatter，中止`);

  let body = m[1];

  // 去掉与模板 <h1> 重复的一级标题
  body = body.replace(/^\s*#\s+[^\n]*\n+/, "");

  // 论坛用语改为中性表述
  body = body.replace(/分享给佬友们/g, "整理分享出来");

  // 站外互链改为本站内链；未收录的原帖链接保留原样
  body = body.replace(
    /https:\/\/linux\.do\/t\/topic\/(\d+)/g,
    (full, id) => (TOPIC_TO_SLUG[id] ? `/posts/${TOPIC_TO_SLUG[id]}` : full),
  );

  const credit = `> 本文转载自 linux.do，原作者 **Henry_He**，[点此查看原帖](https://linux.do/t/topic/${a.topic})。\n\n`;

  const out = `---
title: ${a.title}
date: ${a.date}
categories: 设计
tags:
  - Vibe Coding
  - 设计
description: ${a.description}
---

${credit}${body.trim()}
`;
  writeFileSync(join("content/posts", `${a.slug}.md`), out);
  console.log(`✓ ${a.slug}.md`);
}

console.log(`已转换 ${ARTICLES.length} 篇`);
