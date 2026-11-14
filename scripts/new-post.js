/* This is a script to create a new post markdown file with front-matter */

import fs from "node:fs";
import path from "node:path";
import { pinyin } from "pinyin-pro";

function getDate() {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

const args = process.argv.slice(2);

if (args.length === 0) {
	console.error(`Error: No title argument provided
Usage: pnpm new-post "文章标题"`);
	process.exit(1); // Terminate the script and return error code 1
}

// 标题保持原样（允许中文和空格），目录名转成拼音
const title = args.join(" ").replace(/\.(md|mdx)$/i, "");

// Convert Chinese characters to pinyin, keep other chars as-is
const slug = title
	.split("/")
	.map((segment) => {
		if (!/[一-鿿]/.test(segment)) return segment;
		// Process character by character: Chinese → pinyin, others → keep
		const chars = [...segment];
		const parts = [];
		let buf = "";
		for (const ch of chars) {
			if (/[一-鿿]/.test(ch)) {
				if (buf) {
					parts.push(buf);
					buf = "";
				}
				parts.push(pinyin(ch, { toneType: "none", type: "array" })[0]);
			} else {
				buf += ch;
			}
		}
		if (buf) parts.push(buf);
		return parts
			.join("-")
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
	})
	.filter(Boolean)
	.join("/");

if (!slug) {
	console.error("Error: Title must contain at least one letter, number or Chinese character");
	process.exit(1);
}

const targetDir = "./src/content/posts/";
const postDir = path.join(targetDir, slug);
const fullPath = path.join(postDir, "index.md");

if (fs.existsSync(fullPath)) {
	console.error(`Error: File ${fullPath} already exists `);
	process.exit(1);
}

fs.mkdirSync(postDir, { recursive: true });

const content = `---
title: ${JSON.stringify(title)}
published: ${getDate()}
description: ''
image: ''
tags: []
category: ''
draft: false
lang: ''
---
`;

fs.writeFileSync(fullPath, content);

console.log(`Post ${fullPath} created`);
