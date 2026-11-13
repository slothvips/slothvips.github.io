---
title: "用大白话让你明白虚拟DOM的DIFF算法"
published: 2023-06-27T11:30:37.000Z
description: ""
tags: ["diff", "虚拟dom", "双端对比"]
category: "前端"
draft: false
---
## 前文

我们先来了解一些前置的必要知识.

### 首先什么是虚拟dom?

虚拟DOM（Virtual DOM）其实就是一种存在于内存中的用来描述真实DOM的数据结构.其本质就是一堆对象,你可以通过渲染器将其渲染成真实DOM,它相比于真实的DOM数据来说更加轻量.下边用一个简单的例子来说明:

比如你有一个这样的真实DOM

```html
<div id="app">
 <div>1</div>
 <div>2</div>
<div>
```

那么,使用虚拟DOM来表示,他就是一个这样的对象

```js
const vdom = {
  type: "div",
  attr: {
    id: "app",
  },
  children: [
    {
      type: "div",
      attr: {},
      children: "1",
    },
    {
      type: "div",
      attr: {},
      children: "2",
    },
  ],
};
```

一般来说,这两者的转换的关系是单向的,即虚拟DOM转换为真实DOM;我们怎么实现这个转换呢?答案是通过渲染器,下边是一个简易的渲染器来帮助你理解:

```js
function render(vdom) {
  const el = document.createElement(vdom.type);
  for (const key in vdom.attr) {
    el.setAttribute(key, vdom.attr[key]);
  }
  if (typeof vdom.children === "string") {
    el.textContent = vdom.children;
  } else {
    vdom.children.forEach((child) => {
      el.appendChild(render(child));
    });
  }
  return el;
}
```

我们通过这个渲染器,可以很轻松的将虚拟DOM转换为真实DOM,然后将其添加到正确的挂载位置,页面可以正常显示了.这就是虚拟DOM,真实DOM,渲染器,三者的关系.虚拟DOM是更加抽象的存在,它的抽象程度脱离了渲染的平台,具体的转换后的输出内容要看你怎么实现的渲染器.

### 我们为什么需要虚拟DOM?

好了,差不多说明了虚拟DOM之后,我们就要来说明一下为什么我们需要虚拟DOM了.它给我们带来了什么好处,解决了什么问题?
虚拟DOM主要解决了一个问题,避免了频繁的操作真实DOM,进而提高了性能.因为我们使用vue,react等框架时,我们更改和视图有关的数据后,直接反应到视图层面的其实就是虚拟DOM,操作内存中的虚拟DOM成本是比较低的,而操作真实DOM成本是比较高的.如果我们每次更改数据后,都从头到尾的重新生成一次真实DOM,那无疑成本是巨大的,所以我们可以在数据更改后生成新的虚拟DOM,然后与上一次生成的虚拟DOM来对比,进而找出实际需要更新的部分,然后复用没有更改的真实DOM,那么是不是性能就更高了呢?答案是几乎肯定的.

为什么说`几乎是肯定的`?其实如果你的页面实在是太简单,你会发现直接操作真实DOM性能更高,我们通常所说的虚拟DOM性能更高是指你的应用具一定体量,因为虚拟DOM在初始渲染需要做一些操作,以及在更新过程中需要保存一份副本来进行对比,内存占用会更高,所以你的应用如果实在太简单,而直接操作真实DOM可以直接跳过这些环节,根本享受不到虚拟DOM带来的好处哦.但是另一方面来说,从跨平台以及可维护性上来讲,没有理由不上虚拟DOM.

## DIFF算法

前文我们已经提到过了,我们通过对比新旧虚拟DOM来找出实际需要更新的部分来提高性能.那么这个过程是如何实现的呢?这就是我们接下来要讨论的重点:DIFF算法.我们过程中会根据vue3源码来解释这一过程.

我们先来总结一下可能出现的情况(n1表示旧节点,n2表示新节点):

- !n1&&n2 初始挂载
- n1&&!n2 卸载
- n1&&n2 都存在,就需要进行对比了
  - n1.type!==n2.type 如果是不同类型,需要先卸载旧节点,然后挂载新节点
  - n1.type===n2.type 如果是相同类型,进行patch,然后就是对比children了

接下来就是节点孩子的对比部分了, 本文重点要将的也是相同节点类型下children的对比,抛开框架本身的逻辑,那么children的类型只会出现这几种类型[text,'array'],所以大体又会出现下面这几类情况

- !n1.children&&n2 挂载孩子节点
- n1.children&&!n2.children 卸载孩子节点
- n1.children&&n2.children 都存在,就需要进行对比了
  - n2.children.type==='text' 新节点孩子节点是文本,就需要先卸载旧的孩子节点,然后直接设置文本内容
  - n1.children.type==='text'&&n1.children.type!=='text' 如果旧节点孩子节点是文本节点,新节点孩子节点不是文本节点,那么说明是一个数组,先将文本内容情况,然后将新节点的孩子节点进行挂载
  - n1.children.type!=='text'&&n1.children.type!=='text' 都是数组类型,开启diff!

终于来到重点了,其实这部分才是主角,前边再多的情况无非是多开几个代码行进的分支,这部分才是最具含金量的~
那么children同样是数组的情况下,我们又来思考,会出现几种情况呢,大致会分为以下几类情况(我们只会讨论绑定了key值的孩子节点哈,没有绑定key值的节点可以使用简单粗暴的方式来解决):

尾部新增节点,那么这种我们就可以将左侧范围缩减

- (a b c d)
- (a b c d) e f

头部新增节点,那这种我们可以将右侧范围缩减

- (a b c d)
- x y (a b c d)

缩减之后,就是中间乱序的部分了,可能是新增,也可能是删除,还可能是交换了顺序,我们使用一个将所有情况都包含的例子

- (a b ) c d e f (g)
- (a b ) d c x y f (g)
这个例子中我们交换了 c d 节点的位置,并添加了 x y两个节点,还删除掉了e节点

接下来就是diff流程了,直接开始解读源代码哈(这一块的源码在patchKeyedChildren这个函数下,你可以自行搜索)

我们会定义个三个指针变量(问:为什么不是四个指针呢?因为左侧就算定义两个指针,也总是从0开始,而右侧则是不固定的.)

```js
let i = 0
const l2 = c2.length
let e1 = c1.length - 1
let e2 = l2 - 1
```

先通过左侧和右侧对比来压缩我们需要diff的范围,这块直接贴源代码可能会更好理解哈,我会将源码做一定修改,只关注核心逻辑

左侧的对比,通过对比是否是同一个节点,来通过将i指针项右推动来压缩范围

```js
while (i <= e1 && i <= e2) {
  const n1 = c1[i]
  const n2 = c2[i] 
  if (isSameVNodeType(n1, n2)) {
    patch(
      n1,
      n2,
      container,
      null,
      parentComponent
    )
  } else {
    break
  }
  i++
}
```

右侧是同理的

```js
while (i <= e1 && i <= e2) {
  const n1 = c1[e1]
  const n2 =c2[e2]
  if (isSameVNodeType(n1, n2)) {
    patch(
      n1,
      n2,
      container,
      null,
      parentComponent
    )
  } else {
    break
  }
  e1--
  e2--
}
```

到这里双端对比就结束了,接下来我们需要根据三个指针的比较来判断现在是哪一种情况

- i > e1 && i <= e2 i指针超过了e1指针,这种情况说明只是尾部添加了新节点,那我们只需要按顺序将节点进行挂载就可以了

```js
if (i > e1) {
  if (i <= e2) {
    const nextPos = e2 + 1
    const anchor = nextPos < l2 ? (c2[nextPos] as VNode).el : parentAnchor
    while (i <= e2) {
      patch(
        null,
        c2[i],
        container,
        anchor,
        parentComponent
      )
      i++
    }
  }
}
```

- i > e2 && i <= e1 i大于e2却小于等于e1,说明有节点被删除掉了,那我们需要删除掉这些节点

```js
else if (i > e2) {
  while (i <= e1) {
    unmount(c1[i], parentComponent, parentSuspense, true)
    i++
  }
}
```

- 最后一种情况,i没有与右端任何指针相交,就是情况最复杂的时候了,这部分直接上源码吧,我会在源码中加入自己的见解说明,最后再大致说一下这之间的流程

```js
else {
  const s1 = i // 旧列表开始索引
  const s2 = i // 新列表开始索引

  // 构建一个新的索引表，用于记录新节点的key和索引的对应关系
  const keyToNewIndexMap: Map<string | number | symbol, number> = new Map()
  for (i = s2; i <= e2; i++) {
    const nextChild = c2[i]
    if (nextChild.key != null) {
      keyToNewIndexMap.set(nextChild.key, i)
    }
  }

  let j
  // 用于记录已经被patch的节点的数量
  let patched = 0
  // 用于记录新节点中需要处理的数量,这里其实就是新节点的数量
  const toBePatched = e2 - s2 + 1
  // 这个主要是用来检测旧节点可复用时,在新节点列表中索引是否是升序,如果是升序说明不需要移动
  let maxNewIndexSoFar = 0
  // 用于记录是否有节点被移动过
  let moved = false

  // 构建一个新的索引表,用于记录可复用新旧节点的索引的对应关系
  const newIndexToOldIndexMap = new Array(toBePatched)
  for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

  // 遍历旧节点
  for (i = s1; i <= e1; i++) {
    const prevChild = c1[i]

    // 如果已经处理的节点数量大于等于需要处理的节点数量，说明已经处理完毕，直接跳出循环,这种情况是旧节点的数量大于新节点的数量时才会出现
    if (patched >= toBePatched) {
      // all new children have been patched so this can only be a removal
      unmount(prevChild, parentComponent, parentSuspense, true)
      continue
    }

    let newIndex
    // 如果旧节点存在key，那么就根据key去新节点中查找对应的索引
    if (prevChild.key != null) {
      newIndex = keyToNewIndexMap.get(prevChild.key)
    } else {
      // 如果旧节点不存在key，那么就从新节点的最左侧开始查找与旧节点相同的节点
      for (j = s2; j <= e2; j++) {
        if (
          newIndexToOldIndexMap[j - s2] === 0 &&
          isSameVNodeType(prevChild, c2[j] as VNode)
        ) {
          newIndex = j
          break
        }
      }
    }
    // 如果没有找到相同的节点，说明旧节点已经被移除了，直接卸载
    if (newIndex === undefined) {
      unmount(prevChild, parentComponent, parentSuspense, true)
    } else {
      // 如果找到了相同的节点，那么就将新节点的索引记录到索引表中,这里+1是避开索引为0的情况,因为我们初始值是0嘛
      newIndexToOldIndexMap[newIndex - s2] = i + 1
      // 这里我们主要是判断节点是否需要移动,如果说新节点一直是升序排列的,那么说明节点是不需要移动的,否则就是移动过的,方便后续进行优化
      if (newIndex >= maxNewIndexSoFar) {
        maxNewIndexSoFar = newIndex
      } else {
        moved = true
      }

      patch(
        prevChild,
        c2[newIndex] as VNode,
        container,
        null,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized
      )

      patched++
    }
  }

  // 构建一个最长递增子序列的索引表,如果列表没有被移动过,那么说明根本不需要进行计算
  // 构建这个列表的目的是尽可能多的找出不需要移动的节点,反之也就是说尽可能最少的移动节点来完成更新操作
  const increasingNewIndexSequence = moved
    ? getSequence(newIndexToOldIndexMap)
    : EMPTY_ARR

  j = increasingNewIndexSequence.length - 1

  // 接下来的思路是:遍历整个新节点,如果这个新节点在旧节点中不存在,那么我们会执行挂载操作,如果存在,我们就直接进行移动操作以达到复用的目的

  // 这里倒序循环是因为锚点的问题
  for (i = toBePatched - 1; i >= 0; i--) {
    const nextIndex = s2 + i
    const nextChild = c2[nextIndex] as VNode
    // 对应的锚点一定要找准
    const anchor =
      nextIndex + 1 < l2 ? (c2[nextIndex + 1] as VNode).el : parentAnchor

    // 如果索引表中的索引为0,说明这个节点在旧节点中不存在,那么我们就执行创建挂载操作
    if (newIndexToOldIndexMap[i] === 0) {
      patch(
        null,
        nextChild,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized
      )
    } else if (moved) {
      // 然后是移动操作
      // 判断一:如果j小于0,说明最长递增子序列已经遍历完了,那么剩下的都是需要移动的节点,可以不用判断这个,但这是个优化点
      // 判断二:看一下当前索引是否能匹配到最长递增子序列中的索引,如果能匹配上,说明这个节点不需要移动,否则就需要移动
      if (j < 0 || i !== increasingNewIndexSequence[j]) {
        move(nextChild, container, anchor, MoveType.REORDER)
      } else {
        // 如果能匹配上,说明我们就不需要进行移动操作了,直接跳过即可,由于我们是倒序,而且j初始值是最长递增子序列的长度-1,所以每次匹配上索引时j都会减1,直到小于0时,说明最长递增子序列已经遍历完了
        j--
      }
    }
  }
}
```

好了源码注释已经写完了,我们再来梳理以下这个步骤和流程:

- 我们首先构建了一个新节点列表上的`key>index`的map映射集,方便后续通过key来快速获取该节点在新列表中的索引
- 然后我们通过需要处理的新列表的长度来创建了一个数组,并全部填充为0,在将来能在旧列表中找到可复用节点是,索引上的值会被改变为在旧列表中的索引,后续如果索引上的值是0表示未找到复用的节点,即是一个新出现的节点,则需要创建进行挂载;依照这个逻辑我们对旧列表进行了遍历,通过绑定的key值来查找是否有对应key值的节点在新列表中,如果有就会进行记录,如果没有,说明这个节点需要被卸载(在这个遍历过程中,我们顺手将其卸载掉了)
- 然后我们通过新旧节点索引的数组构建出了一个最长递增子序列的数组,使用它能帮我们确定最长的不需要的移动的节点列表,关于最长递增子序列可自行去了解一下哦
- 数据都已经构建完毕了,开始干活吧,接下来我们就需要遍历新节点列表,我们进行了倒序遍历,这是因为锚点的缘故,根据前边构建数据时的逻辑,当新旧列表索引映射表中在当前索引为0时,表示需要创建挂载,然后就是在在旧列表中找到了对应节点,就看需不需要移动了,如果需要移动就移动,不需要移动就直接下一个.

至此,整个diff过程就完成啦!

## wow,终于结束了~

可以很明显的感受到,最需要思考的一部分也即是我们讨论的最后一部分了,这个过程值得细细回味,太经典了~

结束,拜拜~

这部分内容在vue3源码位置

[diff源码位置](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/renderer.ts)
