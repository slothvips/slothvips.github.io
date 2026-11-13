---
title: "使用TS+Vue3+element-plus封装一个命令式弹窗组件"
published: 2023-03-29T22:23:41.000Z
description: ""
tags: ["组件封装", "命令式弹窗"]
category: "前端"
draft: false
---
## 为什么要封装一个命令式弹窗?

由于在项目中有很多弹窗,但是每次开发声明式弹窗内容的时候,内心总会有一种抵触感,因为在开发弹窗的时候给人一种很强的割裂感,如果你的弹窗内的内容是放在单独的组件内,就会有一种反复横跳的感觉,还要单独去关注维护弹窗显隐的状态,以及一些额外的操作。于是就萌生了要开发一个命令式弹窗组件的想法，在使用体验过后，尽管尤大大是反对命令式这种交互 》 [链接](https://www.zhihu.com/question/35820643/answer/64646527)，但是我觉得都不是问题，用完真的回不去了。

## 那么，该如何开始呢？

相信你们应该有使用过elementui的messageBox组件，他就是典型的命令式弹窗，而且也可以支持自定义内容，他这种交互方式不正是我们需要的吗？那么我们可以借鉴一下它是如何实现的。这里就不去一一细看它的源代码了，大致说一下它的实现思路

- 创建组件容器
- 在容器内将自定义组件创建为一个Vnode
- 将容器挂载到挂载点
- 执行后续操作

## 于是

我仿照messageBox实现了一个，以下是完整代码

```ts
import { app as mainApp } from "@/main";
import { DialogProps, ElDialog } from "element-plus";
import { h, InjectionKey, nextTick, provide, ref, render, VNode } from "vue";

export const HideInject: InjectionKey<() => void> = Symbol("CommandDialogHide");
export const ShowInject: InjectionKey<() => void> = Symbol("CommandDialogShow");

export const DestroyInject: InjectionKey<() => void> = Symbol("CommandDialogDestroy");
export const ResolveDestroyInject: InjectionKey<(data?: any) => void> = Symbol("CommandDialogPromiseResolve");
export const RejectDestroyInject: InjectionKey<(err?: any) => void> = Symbol("CommandDialogPromiseReject");

// TODO 嵌套式弹窗还未实现,后续用到再说~

// 解决继承主线应用上下文之后热更新报错的问题,暂时没有找到更好的解决方案
if (import.meta.env.DEV) {
  const errorLog = console.error;
  console.error = (...args) => {
    if (args[0].toString().includes(`TypeError: Cannot read properties of null (reading 'nextSibling')`)) {
      window.location.reload();
    }
    errorLog(...args);
  };
}

// 弹窗默认属性
const defaultDialogProps = {
  // 可拖拽
  draggable: false,
  // 是否点击遮罩关闭
  closeOnClickModal: false,
  // 弹出时body锁定
  lockScroll: true
};

const visible = ref(true);
const hideFn = () => {
  visible.value = false;
};
const showFn = () => {
  visible.value = true;
};
const unmount = (container: HTMLElement) => {
  hideFn();
  render(null, container);
};
const destroyContainer = (container: HTMLElement) => {
  unmount(container);
  nextTick(() => {
    container.remove();
  });
};

export default (
  CustomComponent: VNode,
  options: Partial<DialogProps & { isProvideAppContext: boolean }> = { isProvideAppContext: false }
): Promise<any> => {
  visible.value = true;
  const { isProvideAppContext = true, ...dialogOptions } = options;
  return new Promise(async (resolve, reject) => {
    // 创建容器
    const container = document.createElement("div");

    // 单纯调用这个方法会导致promise的状态永远为pending,外部组件将无法获得后续代码的执行权
    const destroy = () => {
      destroyContainer(container);
    };

    const destroyOnResolve = (data: any) => {
      destroy();
      resolve(data);
    };
    const destroyOnReject = (reason: any) => {
      destroy();
      reject(reason);
    };

    // 弹窗主体
    const vnode = h({
      setup() {
        // 将方法注入到子孙组件内
        provide(ShowInject, showFn);
        provide(HideInject, hideFn);
        provide(DestroyInject, destroy);
        provide(ResolveDestroyInject, destroyOnResolve);
        provide(RejectDestroyInject, destroyOnReject);

        return () => (
          <ElDialog modelValue={visible.value} {...{ ...defaultDialogProps, ...dialogOptions }} onClosed={destroy}>
            {CustomComponent}
          </ElDialog>
        );
      }
    });
    isProvideAppContext && (vnode.appContext = mainApp._context);
    try {
      render(vnode, container);
    } catch (err) {
      reject(err);
    }

    document.body.appendChild(container);
  });
};
```

## 说以下开发过程中遇到的问题

开发过程并不是想象种的那么顺利。。。

### 控制显隐

首先，我们在外部没有声明控制弹窗显隐的状态，那么应该如何控制弹窗的显隐呢？答案是将控制的方法注入到子组件内，我们使用vue的api`provide`和`inject`来实现，那么这个问题就很好的被解决了

### 上下文

你可以发现我们是使用`render`方法来挂载的组件,这会有一个严重的问题,那就是意味着,在我们的组件内显示的所有内容都脱离主应用的上下文,比如我们无法接收到来自主应用顶部注入的的变量,无法访问状态管理以及路由等信息.我中间尝试过将主应用的上下文复制过来给到组件,但是发现是不可行的.
这个时候,我又想起了messageBox,它是怎么解决的呢?我发现它是直接把主应用的上下文拿过来直接给到了组件的上下文.

```ts
isProvideAppContext && (vnode.appContext = mainApp._context);
```

直接引用了上下文,我发现组件内的内容也能拿到上下文了,甚好.

但是新的问题出现了,在经过这一步之后热更新会报错,由于错误是直接被热更新插件消费了,只是用console.error打印出来了.这也导致我们无法捕获这个错误,那么没办法,我只能重写error方法了.

```ts
// 判断环境,这里我用的是vite
if (import.meta.env.DEV) {
  const errorLog = console.error;
  console.error = (...args) => {
    if (args[0].toString().includes(`TypeError: Cannot read properties of null (reading 'nextSibling')`)) {
      window.location.reload();
    }
    errorLog(...args);
  };
}
```

这样就成功解决了.

### 支持promise

这个很简单,只需要我们调用的方法返回一个promise就好了,然后将resolve,reject都给到组件内的子孙组件,由他们来决定执行的时机

### TODO 实现嵌套弹窗

这个暂时项目里还没有用到,等用到了再实现吧,大致思路是维护一个栈结构来实现

## 命令式带来的好处

如果你的vue3应用配置了jsx支持,那么下边的是两个用例,代码就变成了下边的样子,变得如此简洁!开发弹窗也可以很舒服了

```ts
const add = async () => {
  try {
    await CommandDialog(<SysDictAddEdit />, {
      title: `添加字典`
    });
  } finally {
    getList();
  }
};

const edit = async (row: IDictionaryResponseVo) => {
  try {
    await CommandDialog(<SysDictAddEdit raw={row} />, {
      title: `编辑字典`
    });
  } finally {
    getList();
  }
};
```

如果出现报错,这里的报错等信息在内容组件内就被消费了,所以外部看起如此简洁,当然如果你希望抛出来处理也是没啥问题的

=.=,除非让我遇到不适用的场景,不然再也回不去声明式了.
