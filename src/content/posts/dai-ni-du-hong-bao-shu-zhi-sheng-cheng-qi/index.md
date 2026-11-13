---
title: "带你读红宝书之生成器"
published: 2022-12-25T13:54:44.000Z
description: ""
tags: ["红宝书", "生成器"]
category: "前端"
draft: false
---
## 生成器是什么?

生成器拥有在一个函数内暂停和恢复代码执行的能力,这里值得一说,我们熟悉的异步解决方案`async`,`await`就是基于生成器实现的.

## 一个简单的生成器实例

```js
function* g(){
}
```

在function关键词之后跟上一个`*`号之后,那么这个函数就变成了一个生成器函数,在调用这个函数后,会得到一个生成器对象,这个对象实现了Iterator接口,所以具有迭代器的特性.

好的,接下来我们来看一个相对完整的生成器案例.

```js
function* g() {
  yield (() => { console.log(11); return 1 })()
  yield (() => { console.log(22); return 2 })()
  yield (() => { console.log(33); return 3 })()
}
const gn = g()
const timer = setInterval(() => {
  const val = gn.next()
  if (val.done) clearInterval(timer)
  console.log(val);
}, 1000);
```

总的来看,可以这样理解,生成器内遇到yield会暂停函数的执行,直到你调用next方法函数才会恢复执行,在遇到下一个yield时又会暂停执行,然后就是循环这个操作了.

## yield关键字还可以作为输入输出

这个关键字可以让你每一次调用next时的入参在外部传入,而且next的返回值也可以有yield指定,使用方式也很简单.

来看输入

```js
// 输入
function* gen() {
  console.log('start');
  console.log(yield);
  console.log(yield);
  console.log(yield);
}
const g = gen()
g.next()
g.next(1)
g.next(2)
g.next(3)
```

这样我们就可以在外部传入参数来执行函数,这里注意第一次调用next不会获取你的入参,它的作用是让你的生成器函数开始执行.

接下来是输出:

```js
// 输出
function* gen() {
  yield "嘿嘿嘿1"
  yield "嘿嘿嘿2"
  yield "嘿嘿嘿3"
  yield* [1,2,3,4]
}
const g = gen()
console.log(g.next().value);
console.log(g.next().value);
console.log(g.next().value);
console.log(g.next().value);
console.log(g.next().value);
console.log(g.next().value);
console.log(g.next().value);
```

这就是yield输入输出的功能了;你可能注意到了,在上边的案例中,我们使用*来增强yield,这种方式可以让yield产生出可迭代对象,其实这和多写几行yield没什么区别.

## 使用生成器来改写迭代器

我们可以使用生成器来配合迭代器

```js
class P {
  constructor() {
    this.values=[1,2,3,4]
  }
  *[Symbol.iterator]() {
   yield* this.values
  }
}
```

wow,如此的简洁

## 提前终止生成器

你可以直接在生成器对象上调用`return`这个api来提前终止,每个生成器对象上都会有这个api

```js
function* gen() {
  yield "嘿嘿嘿1"
  yield "嘿嘿嘿2"
  yield "嘿嘿嘿3"
  yield* [1,2,3,4]
}
const g=gen()
g.next()
g.return()
// g.next() 一旦生成器进入关闭状态是不能恢复的
```

## 总结

生成器具有暂停代码执行的神奇功能,我们可以用它来满足一些特殊的场景.
