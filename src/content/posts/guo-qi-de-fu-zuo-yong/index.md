---
title: "过期的副作用"
published: 2024-04-03T20:13:34.000Z
description: ""
tags: ["竞态", "异步", "副作用"]
category: "前端"
draft: false
---
## 起因

今天在工作中遇到一个问题,可以想象这样一个场景:你会连续发送两次相同的请求,你期望总是以最后发起的请求为最终结果,但是有时候发现结果不尽人意,仔细观察之后发现,这是由于有时候请求并不是按照你依次发送的时间来响应的,有时候会出现第一次请求的响应比第二次慢,那么就会出现错误的数据覆盖,我们用代码来模拟一下这个场景:

```js
// 模拟
const req = (q) => {
  return new Promise((resolve) => {
    const random = Math.random() * 10;
    setTimeout(() => {
      resolve(q);
    }, random);
  });
};
let msg = "";
const p1 = req(1).then((res) => {
  msg = res;
});
const p2 = req(2).then((res) => {
  msg = res;
});

Promise.all([p1, p2]).then(() => {
  console.log(msg);
});
```

上边的代码中,我们的`req`函数会随机时间后再解决 promise,这正是我们想要的,我们借用这个函数模拟一次网络请求;接着我们接连发送了两次请求,等两次请求全部响应之后,查看`msg`的值,会发现并不是每次都获取到了一样的结果,这完美复现了我们上边的提到的问题.

那么我们接下来尝试解决这个问题

## 解决方案一:缓存

我们可以借助缓存来解决,每次请求结束之后,我们从缓存中获取最靠后请求的结果,那么我们总是能得到正确的结果:

上代码:

```js
// 使用缓存方案来解决
const cache = {};
let id = 0;
const getLatestReqKey = () => {
  const keys = Object.keys(cache);
  if (!keys.length) return 0;
  return Math.max(...keys);
};
const cacheReq = (q) => {
  const c_id = ++id;
  return req(q).then((res) => {
    if (c_id > +getLatestReqKey()) {
      cache[c_id] = res;
      msg = res;
    }
  });
};
const p1_c = cacheReq(1);
const p2_c = cacheReq(2);
Promise.all([p1_c, p2_c]).then(() => {
  console.log(msg);
});
```

## 解决方案二:标记过期函数

这里借鉴了 vue3`watch`函数的思想,每次函数执行时,会将前边的函数直接标记为失效函数,避免过期的副作用:

```js
// 标记过期函数方式
let cleanup;
const reqExpired = (q) => {
  let expired = false;
  cleanup && cleanup();
  cleanup = () => {
    expired = true;
  };
  return req(q).then((res) => {
    if (!expired) {
      msg = res;
    }
  });
};
const p1_e = reqExpired(1);
const p2_e = reqExpired(2);
Promise.all([p1_e, p2_e]).then(() => {
  console.log(msg);
});
```

## 题外话:令牌取消思想

众所周知,`promise`是无法取消的,但是我们可以借助令牌取消思想,让其永远停在`pendding`状态,也相当于是一种取消了.下边贴一段红宝书的代码:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <button id="start">start</button>
    <button id="cancel">cancel</button>
    <script>
      class CancelToken {
        constructor(cancelFn) {
          this.promise = new Promise((resolve, reject) => {
            cancelFn(() => {
              setTimeout(console.log, 0, "delay cancelled");
              resolve();
            });
          });
        }
      }
      const startButton = document.querySelector("#start");
      const cancelButton = document.querySelector("#cancel");
      function cancellableDelayedResolve(delay) {
        setTimeout(console.log, 0, "set delay");
        return new Promise((resolve, reject) => {
          let flag = false;

          req().then((res)=>{
if(flag){
            resolve();

}

          })
          const id = setTimeout(() => {
            setTimeout(console.log, 0, "delayed resolve");
          }, delay);
          const cancelToken = new CancelToken((cancelCallback) => cancelButton.addEventListener("click", cancelCallback));
          cancelToken.promise.then(() => (flag = true));
        });
      }
      startButton.addEventListener("click", () => cancellableDelayedResolve(1000));
    </script>
  </body>
</html>
```

当我们每次点击 start 的时候,我们就会创建一个 promise,并在其执行器中实例化一个 CancelToken,当我们点击 cancel 的时候,这个 CancelToken 实例对象上的 promise 就会被立即解决,那么我们就可以借此时机来执行我们想达到的取消操作!

## 结束

bye~
