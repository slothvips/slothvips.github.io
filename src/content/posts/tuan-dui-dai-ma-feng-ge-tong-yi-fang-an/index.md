---
title: "团队代码风格统一方案"
published: 2023-09-25T21:30:25.000Z
description: ""
tags: ["规范", "团队", "代码风格", "工具"]
category: "前端"
draft: false
---
## 今天碰到一个不大不小的问题

前排提示：本片文章内容较为浅显，只适合作为一个抛砖引玉的作用，如果你希望得到一个较为详细的指南，那么本文可能不适合。

在平时工作中，如果大家的代码风格不统一，那么会出现的一个问题是，git记录会出现混乱的情况，导致合并代码变得较为困难，其难度呈指数型上升。所以，在日常工作中我们都会进行一些工程化配置来约束我们的代码风格，进而避免出现上述情况。

## 话不多说,直接上方案

目前在前端主流方案中,通常是`prettier`和`eslint`,以及`editorconfig`三剑客来约束代码风格

## prettier

它是一个代码格式化工具,在一致的配置下,使用它格式化可以获得统一的代码风格.

使用也很简单,vscode安装它
<https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode>

然后在根目录创建`prettier.config.js`配置文件,将编辑器的默认格式化工具设置为prettier(这个总不用教吧 =.=)

简单的配置方案示例:

```js
// https://www.prettier.cn/docs/install.html
module.exports = {
 // 一行最多多少个字符
 printWidth: 150,
 // 指定每个缩进级别的空格数
 tabWidth: 2,
 // 使用制表符而不是空格缩进行
 useTabs: true,
 // 在语句末尾打印分号
 semi: true,
 // 使用单引号而不是双引号
 // 在对象文字中的括号之间打印空格
 bracketSpacing: true,
 // jsx 标签的反尖括号需要换行
 jsxBracketSameLine: false,
 // 在单独的箭头函数参数周围包括括号 always：(x) => x \ avoid：x => x
 arrowParens: 'always',
 // 这两个选项可用于格式化以给定字符偏移量（分别包括和不包括）开始和结束的代码
 rangeStart: 0,
 rangeEnd: Infinity,
 // 指定要使用的解析器，不需要写文件开头的 @prettier
 requirePragma: false,
 // 不需要自动在文件开头插入 @prettier
 insertPragma: false,
 // 使用默认的折行标准 always\never\preserve
 proseWrap: 'preserve',
 // 指定HTML文件的全局空格敏感度 css\strict\ignore
 htmlWhitespaceSensitivity: 'css',
 singleQuote: true,
 // 更改引用对象属性的时间 可选值"<as-needed|consistent|preserve>"
 quoteProps: 'as-needed',
 // 在JSX中使用单引号而不是双引号
 jsxSingleQuote: false,
 // 多行时尽可能打印尾随逗号。（例如，单行数组永远不会出现逗号结尾。） 可选值"<none|es5|all>"，默认none
 trailingComma: 'none',
 // Vue文件脚本和样式标签缩进
 vueIndentScriptAndStyle: false,
 // 换行符使用 lf 结尾是 可选值"<auto|lf|crlf|cr>"
 endOfLine: 'lf'
};
```

## eslint

通常我们不会自己去配置这个工具,因为规则实在是太多了,所以我们一般是直接使用社区的配置。
而在我们日常的开发中,一般脚手架都会默认帮我们创建这些内容,所以此处略过。

通常我们也会安装它的vscode拓展来更好的支持它
<https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint>

## editorconfig

有人喜欢用vscode，有人喜欢用webstorm，那怎么保持代码风格统一呢？那就要祭出这个大杀器

使用也很简单

安装拓展（webstorm插件商店也会有它，放心~）

<https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig>

在项目根目录创建`.editorconfig`文件，下边是一个简单的配置方案

```text
# Editor configuration, see http://editorconfig.org

# 表示是最顶层的 EditorConfig 配置文件
root = true

[*] # 表示所有文件适用
charset = utf-8 # 设置文件字符集为 utf-8
indent_style = space # 缩进风格（tab | space）
indent_size = 2 # 缩进大小
end_of_line = lf # 控制换行类型(lf | cr | crlf)
trim_trailing_whitespace = true # 去除行首的任意空白字符
insert_final_newline = true # 始终在文件末尾插入一个新行

[*.md] # 表示仅 md 文件适用以下规则
max_line_length = off
trim_trailing_whitespace = false

```

## 有了这三剑客

不用关心代码风格问题了,可以专心编码了！
