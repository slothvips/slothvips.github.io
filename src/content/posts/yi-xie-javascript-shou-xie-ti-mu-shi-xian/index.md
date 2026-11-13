---
title: "一些JavaScript手写题目实现"
published: 2022-08-01T18:55:16.000Z
description: ""
tags: ["手写", "基础", "JavaScript"]
category: "前端"
draft: false
---
## 开局

不按分类顺序排放,我是持续加进去的,想到一个写一个属于是~

## 浅拷贝和深拷贝(来源于某次面试的思考)

首先拷贝需要创建一个新的对象,浅拷贝即指把对象的属性拷贝一份,如果属性是基础类型,那么拷贝的是基础类型的值,如果属性是引用类型(对象),那么拷贝的是引用地址;而深拷贝与浅拷贝的区别是如果属性是引用类型,那么拷贝的是这个引用类型的浅拷贝,深拷贝的作用是创建对象完全的副本,互不影响!
其中浅拷贝需要考虑的东西相对比较简单,只需要判断一下类型即可;但是深度拷贝还需要考虑循环引用等情况

```js
const isObject = (target) => {
  return target !== null && typeof target === "object";
};

// 浅拷贝
const shallowCopy = (original) => {
  /**
   * 判断类型
   *  基础类型 > 直接返回
   *  引用类型 > copy
   *  */
  if (!isObject(original)) return original;
  const result = Array.isArray(original) ? [] : {};
  for (const key in original) {
    if (original.hasOwnProperty(key)) {
      result[key] = original[key];
    }
  }
  return result;
};


// 深拷贝
const deepCopy = (original) => {
  // 用一个缓存来解决循环依赖的问题
  const map = new Map();
  const nestedCopy = () => {
    if (!isObject(original)) return original;
    const result = Array.isArray(original) ? [] : {};
    // 设置缓存
    map.set(original, result);
    for (const key in original) {
      if (original.hasOwnProperty(key)) {
        const val = original[key];
        if (isObject(val)) {
          // TODO 还需要判断原生对象类型,比如Date,你需要new一个Date;这里就不实现了
          if (map.has(val)) {
            const cacheVal = map.get(val);
            result[key] = cacheVal;
          } else {
            const copyVal = nestedCopy(val);
            result[key] = copyVal;
          }
        } else {
          result[key] = original[key];
        }
      }
    }
    return result;
  };
  const result = nestedCopy();
  // 置空缓存
  map.clear();
  return result;
};
```

## apply,call,bind

实现其中之一即可,bind 由于需要返回一个函数,并且会缓存参数,所以稍微复杂一点点

```js
// 我们先准备一个对象以及一个函数
const _t = {
  name: 'panda'
}
function sayName(age, sex) {
  console.log(this.name)
  console.log(age)
  console.log(sex)
}
Function.prototype.myApply = function (context, args) {
  var t_obj = context || window;
  // 将fn作为对象的一个属性
  t_obj.fn = this;
  // 然后从这个对象去访问这个方法并执行
  const result = t_obj.fn(...args)
  delete t_obj.fn;
  // 别忘记返回函数返回的返回值
  return result;
};

Function.prototype.myBind = function(context, ...args) {
  const self = this;
  return function(...innerArgs) {
    return self.apply(context, args.concat(innerArgs));
  }
};

```

## 数组去重

```js
// 第一种 利用set的特性
const duplicateRemoval=(arr)=>{
  // 另外一种写法:Array.from(new Set(arr))
 return [...new Set(arr)]
}
// 第二种 双重循环,最笨方法(for+findIndex,for+find,filter+indexOf,for+includes是一样的原理)
const duplicateRemoval=(arr)=>{
  const resultArr=[]
  for(let i=0;i<arr.length;i++){
    const node=arr[i]
    let flag=false
    for(let j=0;j<resultArr.length;j++){
      const node2=resultArr[j]
      if(node===node2){
        flag=true
        break;
      }
    }
    if(!flag)resultArr.push(node)
  }
  return resultArr
}
// for + object(也可以用map)
const duplicateRemoval =(arr)=>{
  // 利用对象属性名不能重复这一特点
  const resultArr = []
  const obj = {}
  for(let i = 0;i<arr.length;i++){
    if (!obj[arr[i]]) {
      resultArr.push(arr[i])
      obj[arr[i]] = 1
    } else {
      obj[arr[i]] ++
    }
  };
  return resultArr
}
// 利用reduce
function duplicateRemoval (arr) {
  let resultArr = []
  return  arr.reduce((prev, next,index, arr) => {
    // 如果包含，就返回原数据，不包含，就把新数据追加进去
    return newArr.includes(next) ? newArr :  newArr.push(next)
  }, 0)
}
```

## 数组打平,多维数组转换为一维数组

```js
// 原生已经实现了
const expandArray=(array)=>{
 return array.flat(Infinity);
}
// 递归实现,可设置层级
const expandArray = (array, level = Infinity) => {
  const resultArr = []
  let dep = 0
  const run = (arr) => {
    // 每当需要递归调用说明层级+1了
    dep++
    arr.forEach((node) => {
      if (Array.isArray(node) && dep < level) {
        run(node)
      } else {
        resultArr.push(node)
      }
    })
    // 一轮执行完毕,应该将层级减去1,恢复到上一层级
    dep--
  }
  run(array)
  return resultArr
}
```

## instanceof

这个操作符用来判断该对象是否在某一条原型链上,通常用来判断是不是某个对象的子集

```js
const myInstanceof = (obj, { prototype }) => {
  let p = Object.getPrototypeOf(obj)
  while (true) {
    if (p === null) {
      return false
    } else if (p === prototype) {
      return true
    }
    p = Object.getPrototypeOf(p)
  }
}
```

## 解析 url 参数

这块熟悉正则的话应该能玩的 6 一点

```js
const getUrlParams = (url) => {
  const params = {}
  const paramsString = url.split('?')[1]
  const kvArray = paramsString.split('&')
  kvArray.forEach((kv) => {
    const lr = kv.split('=')
    params[lr[0]] = lr[1]
  })
  return params
}

// 使用 URLSearchParams API 实现解析 URL 参数
const getUrlParams = (url) => {
  const searchParams = new URLSearchParams(url.split('?')[1]);
  const params = {};
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  return params;
}

```

## Object.create

该函数用来创建一个干净的对象

```js
function createObj(obj){
  function Fn(){}
  Fn.prototype = obj
  return new Fn()
}
```

## 实现简易 hash 路由系统

```js
class myRoute {
  constructor() {
    // 路由映射关系
    this.routes = {}
    // 当前hash值
    this.currentHash = ''
    window.addEventListener('load', this.updateRoute, false)
    window.addEventListener('hashchange', this.updateRoute, false)
  }
  addRoute(path, cb) {
    this.routes[path] = cb || function () { }
  }
  // 更新
  updateRoute = () => {
    this.currentHash = location.hash.slice(1) || '/'
    this.routes[this.currentHash]()
  }
}
```

## 节流

通常用来稀释函数执行的次数

```js
const d = (fn, delay) => {
  let timer = null;
  return (...args) => {
    if (timer) return;
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
};
```

## 防抖

在一段时间内只会执行最后一次调用

```js
const t = (fn, delay) => {
  let timer = null;
  return (...args) => {
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};
```

## 当防抖函数遇到先发起的请求响应巨慢的问题(其实这里防不防抖无所谓,主要是前边响应慢的问题)

来源于朋友某次面试题的思考,不废话,直接模拟场景

```js
const t = (fn, delay) => {
  let timer = null;
  return (...args) => {
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

const req = () => {
  // 请求发起时间戳
  const now = Date.now();
  setTimeout(
    () => {
      console.log(`请求响应了,本次预计返回的数据:${now}`);
      // 假设返回的就是时间戳
      data.count = now;
    },
    // 模拟第一次请求慢一点,第二次立即返回
    i === 1 ? 2000 : 0
  );
};

const data = {
  count: 0,
};

// 防抖函数,间隔500
const reqT = t(req, 500);
// 分别发送两次请求,必须满足防抖下执行两次的时间间隔
let i = 0;
const timer = setInterval(() => {
  i++;
  reqT();
  i === 2 && clearInterval(timer);
}, 700);

setTimeout(
  () => {
    console.log("最终结果:" + data.count);
  },
  // 最短需要700*2+2000才能看到最终结果
  700 * 2 + 2000 + 1
);
```

通过上边的例子可以得出结果总是得到第一次响应慢的结果,而我们希望得到的最新发起请求的结果;怎么办呢?其实这里是一个典型的过期副作用问题,已在一篇文章中阐述过:https://pandavips.github.io/blogs/2024/guoqidefuzuoyong.html

## 发布订阅

```js
class EventBus {
  constructor() {
    this._map = new Map();
    this.$on = this.on;
    this.$once = this.once;
    this.$off = this.off;
    this.$emit = this.emit;
  }
  on(event, handler) {
    const eventHandlers = this._map.get(event);
    if (!eventHandlers || eventHandlers.length === 0) {
      this._map.set(event, [handler]);
    } else {
      eventHandlers.push(handler);
    }
  }
  once(event, handler) {
    this.on(event, (..args) => {
      handler(args);
      this.off(event, handler);
    });
  }
  emit(event, ...args) {
    const eventHandlers = this._map.get(event);
    if (!eventHandlers || eventHandlers.length === 0) return;
    eventHandlers.forEach((node) => {
      node(args);
    });
  }
  off(event, handler) {
    const eventHandlers = this._map.get(event);
    if (!eventHandlers || eventHandlers.length === 0) return;
    this._map.set(
      event,
      eventHandlers.filter((node) => {
        return node !== handler;
      })
    );
  }
}
```

## mini 版本的 vuex

```js
import { inject, reactive } from "vue";
// 注入时候的key,可以做当一个命名空间来理解,用户可以自行传入name做区分
const STORE_KEY = "__store__";
// hooks
function useStore(name = STORE_KEY) {
  return inject(STORE_KEY);
}
// 创建实例
function createStore(options) {
  return new Store(options);
}
class Store {
  constructor(options) {
    this.$options = options;
    this._state = reactive({
      data: options.state,
    });
    this._name = options.name || STORE_KEY;
    this._mutations = options.mutations;
    this._actions = options.actions;
  }
  get state() {
    return this._state.data;
  }
  // 触发mutation
  commit = (type, payload) => {
    const mutation = this._mutations[type];
    mutation && mutation(this.state, payload);
  };
  // 触发action
  dispatch = (type, payload) => {
    const action = this._actions[type];
    action && action(this, payload);
  };
  // 注册的时候,vue会自动调用这个方法
  install(app) {
    // 这里的app就是vue的实例,将状态注入
    app.provide(this._name, this);
  }
}
export { createStore, useStore };
```

## 封装一个最大请求数的请求函数

来源于`成都博智信息`的面试问题,他想要得是你封装一个函数,参数是一堆请求列表,然后可以设置最大同时请求数目,等待所有请求完成后返回这些列表的响应请求

```js
// 模拟请求函数,响应时间随机,抛错随机
const req = (url) => {
  const time = Date.now();
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      Math.random() > 0.5
        ? resolve({
            url,
            time,
            done_time: Date.now(),
          })
        : reject({
            url,
            time,
            done_time: Date.now(),
          });
    }, Math.random() * 3000);
  });
};
/**
 * @param {*} urls 请求列表
 * @param {*} max 同时请求数目
 */
const maxReq = (urls = [], max = 3) => {
  const result = [];
  //请求完成数目,当前操作的索引
  let count = 0,
    index = -1;
  const len = urls.length;
  return new Promise((resolve) => {
    const next = () => {
      const index2 = ++index;
      if (index2 >= len) return;
      const url = urls[index2];
      req(url)
        .then((res) => {
          result[index2] = res;
          next();
        })
        .catch((err) => {
          result[index2] = err;
          next();
        })
        .finally(() => {
          if (++count >= len) resolve(result);
        });
    };
    for (let i = 0; i < (max < len ? max : len); i++) {
      next();
    }
  });
};
const urls = ["url1", "url2", "url3", "url4", "url5", "url6", "url7"];
// test
maxReq(urls).then((res) => {
  console.log(res);
  debugger;
});
```

其实可以封装一个调度的类,那么代码就可以改为下面的方式:

```js
class Scheduler {
  // 用于判断是否是一个promise,灵感来源于vue源码
  static isPromise(val) {
    return val !== undefined && val !== null && typeof val.then === "function" && typeof val.catch === "function";
  }
  constructor(limit = 2, callback = () => {}) {
    // 任务编号索引
    this.index = -1;
    // 任务队列
    this.queue = [];
    // 完成数目
    this.doneCount = 0;
    // 限制并发数
    this.limit = limit;
    // 结果数组
    this.resultArray = [];
    // 所有请求完成之后的回调
    this.callback = callback;
  }
  // 添加任务
  add = (task) => {
    this.index++;
    if (Scheduler.isPromise(task)) {
      console.log("任务是promise类型");
      this.queue.push(this.decoratTask(task));
    } else if (typeof task === "function") {
      console.warn("你似乎传入的不是一个promise,这种情况请查看下使用方式.");
      // 这里需要遵循一定的规范去使用,需要提前告知使用者,实际上还不如强制告诉使用者必须传入promise
      this.queue.push(
        this.decoratTask(
          new Promise((resolve, reject) => {
            task(resolve, reject);
          })
        )
      );
    }
  };
  // 开始任务
  start = () => {
    const count = this.limit > this.queue.length ? this.queue.length : this.limit;
    for (let i = 0; i < count; i++) {
      this.next();
    }
  };
  // 下一个
  next = () => {
    if (this.queue.length) {
      const task = this.queue.shift();
      this.run(task);
    }
  };
  // 装饰任务对象,其实这里的作用是为了保存结果数组的有序性
  decoratTask = (task) => {
    return {
      index: this.index,
      p: task,
    };
  };
  // 执行单次任务
  run = (task) => {
    console.log("run");
    const { index, p } = task;
    p.then((res) => {
      this.resultArray[index] = res;
    })
      .catch((err) => {
        console.log(err);
        this.resultArray[index] = err;
      })
      .finally(() => {
        console.log("will next");
        this.doneCount++;
        if (this.index + 1 === this.doneCount) {
          this.callback(this.resultArray);
        } else {
          this.next();
        }
      });
  };
}
const req = (url) => {
  const time = Date.now();
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        url,
        time,
        done_time: Date.now(),
      });
    }, Math.random() * 3000);
  });
};
const scheduler = new Scheduler(99, (res) => {
  console.log(res);
});
const urls = ["url1", "url2", "url3", "url4", "url5", "url6", "url7"];
urls.forEach((url) => {
  scheduler.add(req(url));
});
scheduler.start();
```

## 封装一个管道函数(上海通办服务面试题)

实现一个高阶函数`pipe`,让传递的函数依次执行,上一个函数的返回值是下一个函数的参数;形如这样调用:pipe(fn,fn,fn,fn,fn)(params)

```js
const pipe = (...fns) => {
  return (params) => {
    let result = params;
    [...fns].map((fn) => {
      result = fn(result);
    });
    return result;
  };
};
const res = pipe(
  (a) => {
    return a + 1;
  },
  (a) => {
    return a + 2;
  }
)(0);
console.log(res); //3
```

如果函数内有异步行为的话，那么返回的结果也会是一个 promise,稍加改造即可。

## 手写一个符合 promiseA+规范的 Promise

关于如何手写一个符合 PromiseA+ 规范的 Promise 实现，我已经在另一篇文章中详细讨论过了。你可以在以下链接中找到完整的实现和解释:

[手写一个符合 PromiseA+ 规范的 Promise](https://pandavips.github.io/blogs/2023/liaoyiliaoPromise.html)

这篇文章深入探讨了 Promise 的内部工作原理，并提供了一个完整的、符合规范的实现。我建议你查看该文章以获取更详细的信息和代码示例。
