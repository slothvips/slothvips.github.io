---
title: "React class 组件的生命周期"
published: 2022-08-09T09:08:59.000Z
description: ""
tags: ["React", "React生命周期"]
category: "前端"
draft: false
---
先提一下,只有class组件才会又声明周期,而函数式组件虽然可以通过hooks来模拟,但是并不能称之为生命周期,因为函数式组件不会创建对应的实例.

这里贴一个官方文档的链接:[React中文官方对生命周期的解释](https://react.docschina.org/docs/react-component.html)

然后还有一张图:<img src="./imgs/react组件生命周期.png">

由图上的逻辑来看,我们可以分为三个大的部分来展开讲述这个生命周期,分别是:`挂载时`,`更新时`,`卸载时`.

## 挂载时

在图中可以看到,当一个组件从被创建到挂载到视图,生命周期调用如下:

- constructor()
- static getDerivedStateFromProps()
- render()
- componentDidMount()

其实在`componentDidMount()`之前还有一`UNSAFE_componentWillMount()`,但是由于react在引入切片后,这些钩子很可能被其他优先级更高的事物打断,导致重复执行,这是比较危险的.

## 更新时

- static getDerivedStateFromProps()
- shouldComponentUpdate()
- render()
- getSnapshotBeforeUpdate()
- componentDidUpdate()

废弃,原因同上:

- UNSAFE_componentWillUpdate()
- UNSAFE_componentWillReceiveProps()

## 卸载时

- componentWillUnmount()

## 错误处理

- static getDerivedStateFromError()
- componentDidCatch()

## 函数介绍

### constructor

这个钩子通常用来初始化state以及为事件函数绑定实例.形如下边的代码

```js
  this.state = { counter: 0 };
  this.handleClick = this.handleClick.bind(this);
```

不要在这个钩子里调用setState,你应该直接进行赋值操作,官方的意思这个钩子里应该避免引入任何副作用和订阅,如果有此需求,你应该放到componentDidMount里完成.

### static getDerivedStateFromProps(不常用)

如果你想要在初始化之后和更新之后都需要进行一段逻辑处理,那么这个钩子就很好用了.

```js
static getDerivedStateFromProps(props, state)
```

会在调用 render 方法之前调用,在组件挂载或者更新后都会调用.它应返回一个对象来更新 state,如果返回 null 则不更新任何内容.

### render

是唯一必须去实现的方法,毕竟视图怎么显示是需要自己去定义的对吧.它是一个纯函数,他的返回值可以依赖于props和state进行变化.可以返回以下类型:

- React 元素。通常通过 JSX 创建。例如，`<div />` 会被 React 渲染为 DOM 节点，`<MyComponent />` 会被 React 渲染为自定义组件，无论是 `<div />` 还是 `<MyComponent />` 均为 React 元素。
- 数组或 fragments。 使得 render 方法可以返回多个元素。欲了解更多详细信息，请参阅 fragments 文档。
- Portals。可以渲染子节点到不同的 DOM 子树中。欲了解更多详细信息，请参阅有关 portals 的文档
- 字符串或数值类型。它们在 DOM 中会被渲染为文本节点
- 布尔类型或 null。什么都不渲染。（主要用于支持返回 `test && <Child />` 的模式，其中 test 为布尔类型。)

如果shouldComponentUpdate()方法里返回false的情况下,则不会去调用render.

### componentDidMount

会在组件挂载后（插入 DOM 树中）立即调用。依赖于 DOM 节点的初始化应该放在这里。如需通过网络请求获取数据，此处是实例化请求的好地方。相当于是vue的mounted钩子.
