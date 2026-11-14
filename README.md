# slothluo

[slothluo](https://slothvips.github.io) 的个人博客，AI 全栈工程师，随便分享点东西。

基于 [Astro](https://astro.build) 与 [Firefly](https://github.com/CuteLeaf/Firefly) 主题搭建，静态生成，部署在 GitHub Pages。

## 环境要求

- Node.js >= 22.23
- pnpm >= 11

## 本地开发

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # 构建到 dist/
pnpm preview  # 预览构建产物
```

常用辅助命令：

```bash
pnpm new-post      # 新建文章
pnpm new-dynamic   # 新建动态
pnpm check         # Astro 类型与内容检查
pnpm lint          # Biome 检查并修复
```

## 目录结构

```
src/
├── config/          # 站点配置，改功能基本都在这里
├── content/
│   ├── posts/       # 文章，一篇一个目录，目录名就是 URL
│   ├── dynamic/     # 动态（页面当前关闭）
│   ├── projects/    # 项目（页面当前关闭）
│   └── spec/        # 关于页、友链页等独立页面内容
├── components/      # 组件（layout、widget、comment 等）
├── layouts/         # 页面整体布局
├── pages/           # 路由，新增页面时改这里
├── styles/          # 全局样式
├── i18n/            # 界面文案翻译
└── utils/           # 工具函数

public/              # 静态资源，原样拷贝到产物根目录
scripts/             # 构建、新建内容、图片处理脚本
deploy.sh            # 构建并发布到 gh-pages 分支
```

主要配置文件：

| 文件 | 作用 |
|---|---|
| `src/config/siteConfig.ts` | 站点标题、URL、导航、页面开关、主题色、分页 |
| `src/config/profileConfig.ts` | 头像、昵称、签名、社交链接 |
| `src/config/navBarConfig.ts` | 导航栏菜单 |
| `src/config/sidebarConfig.ts` | 左右侧栏组件与顺序 |
| `src/config/backgroundWallpaper.ts` | 壁纸、首页横幅文案、背景视频 |
| `src/config/commentConfig.ts` | 评论系统（当前未启用） |
| `src/config/licenseConfig.ts` | 文章底部版权协议 |

当前未启用的模块：友链、留言板、动态、项目、相册、书签、Bilibili、Bangumi、VNDB、MyAnimeList、打赏；评论、音乐播放器、看板娘也处于关闭状态。需要时在对应配置里打开即可。

## 写一篇新文章

### 1. 建文件

推荐一篇一个目录，目录名用英文或拼音，它直接决定文章 URL：

```bash
mkdir -p src/content/posts/wo-de-wen-zhang/imgs
```

然后创建 `src/content/posts/wo-de-wen-zhang/index.md`，访问地址就是：

```
https://slothvips.github.io/posts/wo-de-wen-zhang/
```

也可以用脚本快速生成（标题保持中文，目录自动转拼音）：

```bash
pnpm new-post "文章标题"
# → src/content/posts/wen-zhang-biao-ti/index.md
```

### 2. 写 frontmatter

```yaml
---
title: "文章标题"
published: 2026-11-14
description: "一句话摘要，用于列表卡片和 SEO"
image: ""
tags: ["Vue", "源码"]
category: "前端"
draft: false
pinned: false
series: ""
---

正文从这里开始……
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 文章标题 |
| `published` | 是 | 发布日期，`YYYY-MM-DD` 或完整时间 |
| `description` | 否 | 摘要，缺省时列表里没有简介 |
| `image` | 否 | 封面图，留空则不显示 |
| `tags` | 否 | 标签数组，可多个 |
| `category` | 否 | 分类，只能一个；用于分类页和顶部导航 |
| `draft` | 否 | `true` 时生产构建不输出，本地预览仍可见 |
| `pinned` | 否 | `true` 时在文章列表置顶 |
| `series` | 否 | 合集名称，见下一节 |
| `seriesOrder` | 否 | 合集内顺序，从 1 开始，数字越小越靠前 |

### 3. 插图片

图片放在同目录的 `imgs/` 下，用相对路径引用：

```markdown
![截图](./imgs/screenshot.png)
```

封面图同理：

```yaml
image: "./cover.webp"
```

也可以直接用网络图片，或放一张到 `public/` 后用 `/xxx.png` 引用。

### 4. 本地检查

```bash
pnpm dev      # 看效果
pnpm check    # 检查 frontmatter 和类型
pnpm build    # 确认生产构建通过
```

## 合集（系列）

合集用于把多篇有先后顺序的文章串起来，比如「Vue 源码笔记」「手写 Promise」。

### 怎么加

在每篇文章的 frontmatter 里写同一个 `series`，再用 `seriesOrder` 排顺序：

```yaml
# 第一篇
series: "Vue 源码笔记"
seriesOrder: 1
```

```yaml
# 第二篇
series: "Vue 源码笔记"
seriesOrder: 2
```

### 效果

- 文章页内会出现可展开的合集目录，并标出当前是第几篇
- `/series/` 页面按合集汇总所有文章
- 导航栏「文章 → 系列」可进入

### 注意

- `series` 字符串必须完全一致（包括空格和大小写），否则会被当成两个合集
- `seriesOrder` 不填的文章排在合集最后，再按发布日期倒序
- 修改合集名称时，要同步改所有相关文章
- 不写 `series` 的文章不会进入任何合集

## 发布

```bash
./deploy.sh
```

脚本会执行 `pnpm build`，把 `dist/` 推送到 `gh-pages` 分支。发布前请确认本地改动已提交。

## License

站点代码遵循 [MIT](./LICENSE)；文章版权归作者所有，非特别说明采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。
