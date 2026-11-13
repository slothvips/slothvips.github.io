---
title: "记一次Vue组件循环依赖问题"
published: 2022-12-14T14:18:33.000Z
description: ""
tags: ["Vue"]
category: "前端"
draft: false
---
## 起因

事情是这样的,在工作中由于业务的演进,一个模块有了二级业务,这个任务交到了我,然后我发现一级和二级的视图和业务逻辑很相似,只是存在一些细微的区别;那这样最好了,可以直接复用一级业务的组件,然后我给这个组件定义一些props来做区分是哪一级的业务即可,合理,开干.

## 遇到的问题

就在我开开心心开发的时候,控制台突然给我抛出来一个错:

>[vue warn]: unknown custom element: XXX - did you register the component correctly? for recursive components, make sure to provide the "name" option.

没注册吗?好的,我去看一下.但是在页面里明明是注册了的,刷新了页面还是报错,我又想到会不会是拼写错误.仔细检查了下来,也没有拼写错误.然后我猛地想起,以前好像遇到过这个问题,是组件循环依赖了.官网对此有明确说明

主要原因:
>为了解释这里发生了什么，我们先把两个组件称为 A 和 B。模块系统发现它需要 A，但是首先 A 依赖 B，但是 B 又依赖 A，但是 A 又依赖 B，如此往复。这变成了一个循环，不知道如何不经过其中一个组件而完全解析出另一个组件。为了解决这个问题，我们需要给模块系统一个点，在那里“A 反正是需要 B 的，但是我们不需要先解析 B。”

## 解决方案

```js
// 解决方法一
beforeCreate: function () {
  this.$options.components.TreeFolderContents = require('./tree-folder-contents.vue').default
}
// 解决方法二
components: {
  TreeFolderContents: () => import('./tree-folder-contents.vue')
}
```
