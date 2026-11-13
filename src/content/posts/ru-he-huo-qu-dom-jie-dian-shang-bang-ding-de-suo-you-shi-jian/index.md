---
title: "如何获取dom节点上绑定的所有事件"
published: 2024-10-07T02:04:39.000Z
description: ""
tags: ["前端", "事件"]
category: "前端"
draft: false
---
# 如何获取一个 dom 节点上绑定的所有事件

没有需求,突发奇想,我们应该怎么获取一个 dom 节点上绑定的事件呢?查看了一下,好像没有原生相关的 api 接口来提供这样的功能.

## devtool

可以在浏览器控制台使用`getEventListeners`这个 api 来获取和查看一个节点绑定的所有事件.

形如下边的代码:

```js
getEventListeners(window);
```

控制台就会输出这个几点绑定的所有事件列表.

但是这个 api 只在控制台提供,所以我们没办法在我们的应用中进行使用.那我们只能另辟蹊径.我们可以从绑定事件的入口着手,只要经过这些入口来注册的事件,我们就有办法进行收集管理了.我们可以通过重写这些入口来实现我们的需求.

## 我们要重写哪些东西呢?

首先我们要明确要重写哪些入口?这就要涉及到 DOM 的演进历史了,他们就是 `DOM0,DOM1,DOM2,DOM3`,我们就绑定事件的区别来谈一下他们之间的区别:

`DOM0`和`DOM1`:主要依赖于 `onXX` 的属性来控制事件的监听和移除,你可以在标签上绑定和使用 `js`代码来绑定;这种方式最大的缺陷是会覆盖掉之前绑定的事件,然后就是不可配置事件触发的相关选项,比如是采用`冒泡`还是`捕获`等.

```html
<div id="box" onclick="alert(1)"></div>
<script>
  const box = document.getElementById("box");
  // DOM0 事件绑定
  box.onclick = () => {
    console.log("click");
  };
</script>
```

删除事件就比较简单了,直接将这个属性置为`null`即可.

而`DOM2`和`DOM3`就算是一个大升级了!对事件的绑定和移除依赖于`addEventListener`和`removeEventListener`这两个 api,相信大家都比较熟悉了,这里就不过多展示了;通过这种方式绑定的事件,不会覆盖之前绑定的事件,而且由于有第三个参数的存在,我们可以对事件的触发方式做一些控制

所以,由于 DOM0 和 DOM1 级别的事件只是一个属性,那么我们可以得出我们需要重写的只有`addEventListener`和`removeEventListener`这两个 api,那么我们接下来开始动工.

### 重写 addEventListener 和 removeEventListener

实现思路:

- 我们会使用一个 WeakMap 来映射 dom 到事件列表的集合
- 当元素节点使用我们重写的`addEventListener`方法绑定事件时,我们就会`push`对应的事件到节点对应的事件列表中
- 当元素节点使用我们重写的`removeEventListener`方法移除事件时,我们就会从节点对应的事件列表中删除掉这个事件

下边是实现:

```js
(function () {
  // 用来存储每个 DOM 元素的事件及其监听器
  const eventMap = new WeakMap();

  // 判断options是否相等
  const optionsEquals = (o1, o2) => {
    if (o1 === o2) return true;

    if (typeof o1 !== "object" || o1 === null || typeof o2 !== "object" || o2 === null) return false;

    const keys1 = Object.keys(o1);
    const keys2 = Object.keys(o2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every((key) => o1[key] === o2[key]);
  };

  // 保存原始的 addEventListener 方法
  const originalAddEventListener = EventTarget.prototype.addEventListener;

  // 保存原始的 removeEventListener 方法
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

  // 重写 addEventListener
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (!eventMap.has(this)) {
      eventMap.set(this, []);
    }

    // 如果这个函数被注册过,就不再注册
    if (eventMap.get(this).some((item) => item.type === type && item.listener === listener && optionsEquals(item.options, options))) {
      return;
    }

    // 记录事件
    eventMap.get(this).push({ type, listener, options });

    // 调用原始的 addEventListener 方法
    return originalAddEventListener.call(this, type, listener, options);
  };

  // 重写 removeEventListener
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    if (eventMap.has(this)) {
      const events = eventMap.get(this);
      // 查找并移除匹配的事件
      for (let i = 0; i < events.length; i++) {
        if (events[i].type === type && events[i].listener === listener && optionsEquals(events[i].options, options)) {
          events.splice(i, 1); // 移除事件
          break; // 找到匹配的事件后停止
        }
      }
    }

    // 调用原始的 removeEventListener 方法
    return originalRemoveEventListener.call(this, type, listener, options);
  };

  // 提供一个获取元素上的所有事件的方法
  window.getRegisteredEvents = function (element) {
    return eventMap.get(element) || [];
  };
})();
```

这样我们就能获取到一个节点上所有使用`addEventListener`注册的事件了

### DOM0 和 DOM1 事件的收集

由于 DOM0 和 DOM1 只是一个属性,那么我们就需要遍历事件列表来获取这些属性是不是为 null 就可以了,我们只需要完善一下我们的代码即可:

```js
(function () {
  // 用来存储每个 DOM 元素的事件及其监听器
  const eventMap = new WeakMap();

  // 判断options是否相等
  const optionsEquals = (o1, o2) => {
    if (o1 === o2) return true;

    if (typeof o1 !== "object" || o1 === null || typeof o2 !== "object" || o2 === null) return false;

    const keys1 = Object.keys(o1);
    const keys2 = Object.keys(o2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every((key) => o1[key] === o2[key]);
  };

  // 保存原始的 addEventListener 方法
  const originalAddEventListener = EventTarget.prototype.addEventListener;

  // 保存原始的 removeEventListener 方法
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

  // 重写 addEventListener
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (!eventMap.has(this)) {
      eventMap.set(this, []);
    }

    // 如果这个函数被注册过,就不再注册
    if (eventMap.get(this).some((item) => item.type === type && item.listener === listener && optionsEquals(item.options, options))) {
      return;
    }

    // 记录事件
    eventMap.get(this).push({ type, listener, options });

    // 调用原始的 addEventListener 方法
    return originalAddEventListener.call(this, type, listener, options);
  };

  // 重写 removeEventListener
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    if (eventMap.has(this)) {
      const events = eventMap.get(this);
      // 查找并移除匹配的事件
      for (let i = 0; i < events.length; i++) {
        if (events[i].type === type && events[i].listener === listener && optionsEquals(events[i].options, options)) {
          events.splice(i, 1); // 移除事件
          break; // 找到匹配的事件后停止
        }
      }
    }

    // 调用原始的 removeEventListener 方法
    return originalRemoveEventListener.call(this, type, listener, options);
  };

  // 获取DOM0 和 DOM1 事件
  function getDOM0AndDOM1Events(element) {
    const events = [];
    for (let key in element) {
      const isFN = typeof element[key] === "function";
      if (key.startsWith("on") && isFN) {
        events.push({
          type: key.slice(2).toLowerCase(),
          listener: element[key],
        });
      }
    }
    return events;
  }

  // 提供一个获取元素上的所有事件的方法
  window.getRegisteredEvents = function (element) {
    return [...(eventMap.get(element) || []), ...getDOM0AndDOM1Events(element)];
  };
})();
```

我们补充了`getDOM0AndDOM1Events`这个函数来获取`DOM0`和`DOM1`的事件,这样这个函数就算大功告成了~

## 总结

我们使用一下三步来实现了我们的需求:

1. 重写 addEventListener 和 removeEventListener 方法：通过重写这两个方法，我们可以追踪所有通过 DOM2 级事件绑定的事件。

2. 获取 DOM0 和 DOM1 级事件：我们编写了 getDOM0AndDOM1Events 函数来获取这些较早的事件绑定方式。

3. 提供全局方法 getRegisteredEvents：这个方法结合了上述所有技术，可以获取一个元素的所有绑定事件。

需要保证这个函数优先执行,避免我们还没有重写 addEventListener 和 removeEventListener 方法之前就已经注册了事件.
ok,bye~
