---
title: "遍历DOM节点的方式又增加咯~"
published: 2023-02-11T14:01:38.000Z
description: ""
tags: ["遍历dom", "NodeIterator", "TreeWalker"]
category: "前端"
draft: false
---
## 前情提要

假设我们现在有以下DOM结构，我们现在的需求是要去遍历li标签做一些操作，但是有一个额外条件，我们不需要遍历ol标签下的li标签

环境说明：我们所有的代码会包裹在一个异步函数内来作为顶级async支持，并提供了一个thenable接口对象，他会模拟代码暂停一秒钟，避免遍历过快，方便观察

```html
<ul>
  <li>我害怕你心碎没人帮你擦眼泪</li>
  <li>别管那是非 只要我们感觉对</li>
  <li>我害怕你心碎没人帮你擦眼泪</li>
  <li>别离开身边 拥有你我的世界才能完美</li>
</ul>
<ol>
  <li>哎呦 吉他谁教你的</li>
  <li>哎呦 我生下来就会啊 你不知道啊</li>
  <li>哎呦 屁咧</li>
</ol>
<ul>
  <li>才离开没多久就开始</li>
  <li>担心今天的你过得好不好</li>
  <li>整个画面是你</li>
  <li>想你想的睡不着</li>
</ul>
```

这简单啊，大家稍微思考一下，就可以写出下面的代码：

```js
const lis = document.querySelectorAll("li");
// OR
// const lis = document.querySelectorAll("ul li");
for (const l of lis) {
  if (l.parentNode.nodeName === "OL") continue;
  await sleepThenable;
  console.log(l.innerHTML);
}
```

很好，非常顺利的完成了任务。

我们其实也可以使用`NodeIterator`和`TreeWalker`类型来解决这个问题。他们都是DOM2定义的辅助我们来遍历DOM的类型，遍历dom的方式是使用迭代器模式。注意，这两个类型都是深度优先遍历。

## 使用NodeIterator的方式

```js
// 遍历的节点类型
const wts = NodeFilter.SHOW_ELEMENT;
// 遍历的节点过滤器
const nodeFilter = {
  acceptNode(node) {
    if (node.nodeName === "LI") {
      return node.parentNode.nodeName !== "OL" && NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
  },
};

const nodeIterator = document.createNodeIterator(
  // 从那个节点开始遍历
  document.body,
  // 遍历哪些选型的节点，可以联合多个类型
  wts,
  // 过滤器
  nodeFilter
);
let node;
while ((node = nodeIterator.nextNode())) {
  await sleepThenable;
  console.log(node.innerHTML);
}
```

你会发现得到和我们使用常规方式遍历DOM一样的结果。
说下使用流程吧：

- 我们使用document.createNodeIterator创建了NodeIterator实例
- 在创建的时候接受了三个参数分别为:根节点，遍历的节点类型，自定义过滤器，下边对后两个参数进行解释
  - 节点类型是指我们需要遍历哪些节点类型，注意这里可以使用`|`运算符进行联合，进行多个节点类型的遍历
  - 自定义过滤器可以看作是节点类型参数的一种补充，它是一个对象，他会有一个acceptNode函数作为属性，所以进行遍历的节点都会进行到这个函数，它如果返回`FILTER_SKIP`表示跳过这个节点，返回`FILTER_ACCEPT`表示接受这个节点的遍历
- 然后我们使用了NodeIterator进行迭代器式遍历

这种遍历方式将逻辑进行了抽离，更直观也更方便的进行维护。

## 使用TreeWalker的方式

TreeWalker是对NodeIterator的进一步补充。使用方式基本没有差异，不过他有以下不同

- 他的过滤器可以返回第三个值`FILTER_REJECT`,这表示这个节点以及他的子节点都将被忽略，如果你在NodeIterator里返回这个会等同于`FILTER_SKIP`
- 他提供了我们遍历节点时进行跳跃的api,非常的好用

看一下他的使用示例吧

```js
const nodeFilter2 = {
  acceptNode(node) {
    if (node.parentNode.nodeName === "OL") {
      return NodeFilter.FILTER_REJECT;
    } else if (node.nodeName === "LI") {
      return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
  },
};

// TreeWalker
const treeWalker = document.createTreeWalker(
  document.body,
  wts,
  nodeFilter2
);

while ((node = treeWalker.nextNode())) {
  await sleepThenable;
 console.log(node.innerHTML);
}
```

这里我们改写了过滤器逻辑,使用它直接过滤了ol节点下所有内容。至于他的节点跳跃能力，我们下边来说

## 需求来咯

我们有了一个新需求：当遍历到`担心今天的你过得好不好`,我们希望将焦点跳转到上一个ul列表的最后一句，也就是`别离开身边 拥有你我的世界才能完美`,然后继续遍历；接下来我们就来使用TreeWalker的跳跃能力来完成这个需求吧

我们先来介绍以下跳跃的api吧,知道了这些api我们就很好办事了~：

- parentNode() 遍历到当前节点的父节点。
- firstChild() 遍历到当前节点的第一个子节点。
- lastChild() 遍历到当前节点的最后一个子节点。
- nextSibling() 遍历到当前节点的下一个同胞节点。
- previousSibling() 遍历到当前节点的上一个同胞节点。

```js
const nodeFilter2 = {
  acceptNode(node) {
    if (node.parentNode.nodeName === "OL") {
      return NodeFilter.FILTER_REJECT;
    } else if (node.nodeName === "LI" || node.nodeName === "UL") {
      return NodeFilter.FILTER_ACCEPT;
    }
    return NodeFilter.FILTER_SKIP;
  },
};

while ((node = treeWalker.nextNode())) {
  await sleepThenable;
  node.nodeName === "LI" && console.log(node.innerHTML);
  if (node.innerHTML === "担心今天的你过得好不好") {
    treeWalker.parentNode();
    treeWalker.previousSibling();
    treeWalker.lastChild();
    treeWalker.previousSibling();
  }
}
```

由于我们需要在父节点间进行跳转，所以我们改写了过滤器的逻辑，将ul标签也放进了遍历列表

然后说一下这里迭代时发生了什么，我们在走到`担心今天的你过得好不好`这一句时，先重定向到了父级节点，然后跳到父级节点的上一个兄弟节点，然后跳到这个兄弟节点的最后一个节点，再跳到了这个节点的上一个兄弟节点，然后完成了这个回环

你或许会疑惑，这我用常规的循环也能完成啊，而且代码量更少，然后贴出了这样的代码：

```js
for (let i = 0; i < lis.length; i++) {
  if (lis[i].parentNode.nodeName === "OL") continue;
  await sleepThenable;
  console.log(lis[i].innerHTML);
  if (lis[i].innerHTML === "担心今天的你过得好不好") {
    i = 2;
  }
}
```

但是这里的问题是跳转的索引是一个魔法代码，没有api调用式的语义化，变得难以理解；而且可能还会出现DOM结构一旦更改，这个数值就不准确咯，比如如果你数错了这个节点在整个列表的位置，那就G咯，这些东西会很大程度增大你的负担。

## 总结

不错，好用，嘿嘿
