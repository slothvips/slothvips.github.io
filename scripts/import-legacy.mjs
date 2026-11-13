// 从 pandabox/blog/blogs 导入旧文章到 Firefly 的 content collection
// 用法: node scripts/import-legacy.mjs 2023 2024 2025
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { pinyin } from "pinyin-pro";

const SRC = process.env.LEGACY_BLOG || "/Users/unsloth/unsloth_workspace/github/pandabox/blog/blogs";
const DEST = path.resolve("src/content/posts");
const years = process.argv.slice(2);

function toDate(raw) {
	if (raw instanceof Date) return raw;
	const s = String(raw).trim();
	if (/^\d{4}-\d{1,2}-\d{1,2}T/.test(s)) return new Date(s);
	const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
	if (!m) throw new Error(`无法解析日期: ${raw}`);
	const [, y, mo, d, h = 0, mi = 0, se = 0] = m;
	return new Date(+y, +mo - 1, +d, +h, +mi, +se);
}

function slugify(title) {
	return pinyin(title, { toneType: "none", type: "string", nonZh: "consecutive" })
		.replace(/[^a-zA-Z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.toLowerCase();
}

function convertBody(body) {
	return body
		.replace(/^```(\w+)/gm, (_m, lang) => "```" + lang.toLowerCase())
		.replace(/^::: +details(.*)$/gm, (_m, title) => `<details>\n<summary>${title.trim() || "展开"}</summary>\n`)
		.replace(/^:::$/gm, "</details>");
}

for (const year of years) {
	const dir = path.join(SRC, year);
	for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
		const raw = fs.readFileSync(path.join(dir, file), "utf8");
		const { data, content } = matter(raw.replace(/^\uFEFF?\s+/, ""));
		const slug = slugify(String(data.title || path.basename(file, ".md")));
		const outDir = path.join(DEST, slug);

		let body = convertBody(content);
		// 相对图片 ./imgs/x.png -> 复制到文章目录并保持相对路径
		for (const [, src] of body.matchAll(/\]\((\.?\/?imgs\/[^)\s]+)\)/g)) {
			const abs = path.resolve(dir, src.replace(/^\.?\//, ""));
			if (!fs.existsSync(abs)) {
				console.warn(`  图片缺失: ${src}`);
				continue;
			}
			const target = path.join(outDir, "imgs", path.basename(abs));
			fs.mkdirSync(path.dirname(target), { recursive: true });
			fs.copyFileSync(abs, target);
		}
		body = body.replace(/\]\(\.?\/(imgs\/)/g, "](./$1");

		const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
		const category = Array.isArray(data.categories)
			? String(data.categories[0] ?? "")
			: String(data.categories ?? "");
		const fm = [
			"---",
			`title: ${JSON.stringify(String(data.title || slug))}`,
			`published: ${toDate(data.date).toISOString()}`,
			`description: ""`,
			`tags: [${tags.map((t) => JSON.stringify(t)).join(", ")}]`,
			`category: ${JSON.stringify(category)}`,
			"draft: false",
			"---",
			"",
		].join("\n");

		fs.mkdirSync(outDir, { recursive: true });
		fs.writeFileSync(path.join(outDir, "index.md"), fm + body.trimStart());
		console.log(`${year}/${file} -> src/content/posts/${slug}/index.md`);
	}
}
