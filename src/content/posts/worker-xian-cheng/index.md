---
title: "Worker线程"
published: 2023-02-20T12:51:08.000Z
description: ""
tags: ["worker", "线程"]
category: "前端"
draft: false
---
## Worker线程简介

js在我们的认知中一直是一门纯粹的单线程语言，但是worker线程的出现，让它的单线程特性变得不那么纯粹了~
worker线程是独立于主线程的一个线程，所以即使它遇到大量密集的计算，主线程也不会受影响。这也是我们使用它的一个原因，我们可以把比较繁重的任务交给它来执行，我们只需要等待最后的结果即可。
但是开启一个worker线程，代价也是比较大的（其实几乎任何语言，开启线程代价都是需要考量的，不频繁的创建销毁线程，会有线程池这些东西的存在都是有原因的），因为worker线程有着自己的独立的运行环境，这意味着一个js环境里有的东西，在它的环境里也需要基本具备，可想而知是这是多么巨大的代价。所以，一般我们需要长期运行的任务交给worker线程才是最合适的。

## Worker线程的分类

- 专用工作者线程 这可能是我们以后使用最多的一个类型，它可以让脚本单独创建一个JavaScript线程，用来执行我们的任务，专用的意思是他只能被创建它的页面使用

- 共享工作者线程 与专用工作者线程类似，但是它不‘专用’，它可以被不同的上下文，页面等使用

- 服务工作者线程 主要用途是拦截，重定向和修改页面发出的请求

## WorkerGlobalScope

在浏览器环境中，我们的全局对象通常是window，但是在工作者线程中是没有window对象的，它的全局对象就是`WorkerGlobalScope`,在脚本中通过self关键字暴露出来，其上会有一些和工作者线程有关的成员，它可以看作是window的子集，当然不说你也应该直到，DOM的API在它上边肯定是没有的

除了拥有window上的一些成员外，他还有一个特有的方法`importScripts`，用来动态的开启另外一个线程

## 专用工作者线程

它可以用来解决在遭遇大量计算时页面的慢响应问题。它可以与主线程交换信息，发送网络请求，执行文件输入和输出，大量的密集的计算任务等

先来一个简单使用示例

```js
const worker = new Worker("./worker.js");

```

我们在主页使用Worker构造器，导入了一个worker.js，即使这个文件是空白的，我们也已经成功的开启了一个工作者线程．注意，脚本文件只能从同源加载，否则会报错，但是使用`importScripts`加载脚本可以不用受同源的限制，因为这个时候已经脱离了父文档的上下文了。

然后我们使用了一个worker变量去接受工作者线程的代理对象，以后交流通信可都得靠它啦~

### 通信

通信我们可以使用代理对象上的事件来进行通信，下边是一个简单的示例

我们在worker.js中写入下面的代码

```js
self.addEventListener('message', function (e) {
  var data = e.data;
  console.log('从主线程收到的消息：', data);
  self.postMessage('hello,主线程');
})
setInterval(() => {
  self.postMessage('hello,主线程');
}, 1000)
```

然后在主线程中完善代码

```js
// 创建一个worker线程
const worker = new Worker("./worker.js");
worker.addEventListener("message", (e) => {
  console.log("从worker线程收到的数据", e.data);
});
worker.postMessage("hello worker");
```

这样,我们就实现了基本的通信了,我们采用事件的方式完成了通信.

worker代理对象和工作者线程全局对象上都支持下面的的事件:

- onerror 发生错误时
- onmessage 收到消息时
- onmessageerror MessageEvent

它们还有下面的方法:

- postMessage 异步发送消息
- terminate 代理对象调用,立即终止线程,几乎不会顾及任何后果,直接停止
- close 在工作者脚本内调用,立即终止线程,几乎不会顾及任何后果,直接停止

专用工作者线程的全局对象是 `DedicatedWorkerGlobalScope`,他继承自`WorkerGlobalScope`,他还有独有一个name属性,是Worker构造器可选的标识符参数,可以理解为用来给线程命名,说到这里了,顺便来看下Worker构造器可选的配置项吧

- name 线程标识符
- type 运行方式 classic | module
- credentials type为moudle时可用

### 创建线程另外的方式

其实我们可以不加载外部文件,也可以成功创建线程,下面是一个示例

```js
const worker2 = new Worker(
  URL.createObjectURL(
    new Blob(["console.log('hello worker2')"], {
      type: "application/javascript",
    })
  )
);
```

我们使用了字符串创建了Blob,然后又通过Blob创建了URL,把URL给到了Worler构造器,完成啦

但是注意这个字符串代表的函数不能引用外部的变量或者通过闭包引用的变量,因为在工作者线程中,这些引用可能不复存在,那么你的程序就会报错

### importScripts

我们可以使用`importScripts`这个api在工作者线程中动态的引入脚本,而且这些脚本源是可以不受同源策略的限制的,你甚至可以在新的脚本中开启新的工作者线程,这也是不受同源策略影响的,因为在工作者线程中已经脱离了腹肌上下文,你终于可以放开手脚去干了~

以下是一个使用实例,我们在worker.js中写入以下代码即可

```js
importScripts('./A.js')
importScripts('./B.js')
importScripts('./C.js','./D.js',)
```

你可以看到这个api可以一次引入多个脚本,他们会按照你书写的顺序来执行

### 关于错误捕获

在工作者线程中如果发生错误,是不会冒泡到主线程的,这样设计是担心其影响主线程的执行,虽然你在主线程无法捕获错误，但是在工作者线程内部错误可以像往常一样被捕获

主线程，❌

```js
const worker = new Worker("./worker.js");
try{
  worker.addEventListener("message", (e) => {
    console.log("从worker线程收到的数据", e.data);
  });
  worker.postMessage("hello worker");
}catch(err){}
```

工作者线程，✔

```js
try{
  new Error('出现异常')
}catch(err){
  console.log(err)
}
```

同时也不建议在工作者线程内捕获错误，因为在工作者线程代理对象上可以设置专门的错误处理函数，所以下方是错误捕获的最佳实践

```js
const worker = new Worker("./worker.js");
worker.addEventListener("error", (e) => {
  console.log(e)
});
```

### 工作者线程之间的通信

我们已经完成了主线程与工作者线程之间的通信,那么如何完成工作者线程之间的通信呢？

你可能会想到一种方式，那就是主线程来负责这件事情，在主线程收到来自工作者线程的信息，将其转发给对应的工作者线程，但是这样的问题是主线程会多了很多无关的逻辑代码，其实这些都是主线程没必要去关心的

为了解决这个问题，我们可以使用`MessageChannel`实例来让工作者线程之间建立一个通信道，之后他们通信会在这个信道进行，主线程是不关心的，甚至是无感的。下边是一个简单的示例：

主线程：

```js
const worker = new Worker("./worker1.js");
const worker2 = new Worker("./worker2.js");
const { port1, port2 } = new MessageChannel();

// 将信道的两个端口分别发送给两个 worker
worker.postMessage({ port: port1 }, [port1]);
worker2.postMessage({ port: port2 }, [port2]);
```

可以看到我们创建了一个`MessageChannel`实例，并拿到它的双端，然后把端口分别给到了两个工作者线程，接下来的事情就是两个工作者线程使用端口进行通信

```js
// worker1
let port
self.onmessage = function (e) {
  console.log(e);
  if (!port) {
    port = e.data.port;
    self.onmessage = null
    port.postMessage('hello world')
    port.onmessage = function (e) {
      console.log(e.data)
    }
  }
}
setInterval(() => {
  port.postMessage('hello worker2,我是worker1')
}, 1000);
// worker2
let port
self.onmessage = function (e) {
  if (!port) {
    port = e.data.port;
    self.onmessage = null
    port.postMessage('hello world')
    port.onmessage = function (e) {
      console.log(e.data)
    }
  }
}
setInterval(() => {
  port.postMessage('hello worker1,我是worker2')
}, 1000);
```

这样工作者线程之间的直接通信就完成了，主线程是不用关心的，主线程如果想要参与其中，这会涉及到一个`转移`的概念

另外使用`MessageChannel`实例来进行主线程和工作者线程之间的通信时可行的，但是这样做时没有必要的，因为这与直接调用`postmessage`没有任何差异，没必要新建一个消息信道

这里再说以下另外一种通信，`BroadcastChannel`,他的行为更直接，没有端口所有权的概念，更像是一个订阅发布中心。他的使用方式可以去了解一下：[MDN-BroadcastChannel](https://developer.mozilla.org/zh-CN/docs/Web/API/BroadcastChannel)

### 数据传递

在前边我们传递的数据都是字符串，而且看起来工作正常，这是因为序列化字符串是会被直接复制交给目标上下文的，但是在遇到一些复杂的数据类型，情况就不是那么正常了。

在工作者线程传输数据中，有三种转移信息的方式:

- 可转移对象 可转移对象是指将该对象转交给目标上下文，当然转交后自身线程就不再拥有该对象的控制权了，必须等到这个对象再次被转移回来才能再次拥有控制权；将对象转移的方式是postmessage的第二个参数，他是一个数组，包裹着即将转移的对象。即使你的转移对象嵌套在其他数据类型中也没有关系，嵌套的可转移对象还是会被转移，而嵌套的数据会被结构化克隆
  - ArrayBuffer
  - MessagePort
  - ImageBitmap
  - OffscreenCanvas 一个非常有意思的可转移对象，这也是我们日常口中所说的canvas
- 结构化克隆算法 该方式会克隆一个副本，除了DOM节点以及error，function之外几乎都可以克隆，使用前可以先进行测试下该数据是否可以被克隆，但是红宝书中有提到在某些情况下可能会得到并不是完全一致的数据，注意原型链不会被克隆
- 共享缓冲区 这种方式既不克隆，也不会转移，可以在所有上下文中使用，SharedArrayBuffer在传递的过程中始终是引用传递。这种方式虽然简单粗暴，但是这会导致一个严重的线程安全问题。这就需要我们引入线程锁的概念！

这里我们重点演示共享缓冲区，因为其余两个你只需要知道他们的工作方式即可，但是共享缓冲区的线程安全问题是不容忽视的。

main.js

```js
const works = Array(4)
  .fill(0)
  .map(() => new Worker("./worker.js"));
const sabf = new SharedArrayBuffer(4);
const view = new Uint32Array(sabf);
view[0] = 1;
works.forEach((w) => w.postMessage(sabf));
```

worker.js

```js
self.addEventListener("message", function (e) {
  const view = new Uint32Array(data);
  // 执行 100 万次加操作
  for (let i = 0; i < 1e6; ++i) {
    // 使用Atomics来解决线程安全问题
    Atomics.add(view, 0, 1);
  }
});

```

如果你有兴趣打印出view的值,你会发现是如期所示的40001,这段代码都摘抄自红宝书,可以自行验证(注意SharedArrayBuffer,由于当年的幽灵漏洞等问题,被禁止过一段时间,如果你现在想使用,则必须遵守同源策略,或者设置跨域响应头)

### 关于线程池

为了避免频繁的创建销毁线程,一般我们会采用线程池来管理我们的线程,这一段在红宝书里有着详细的代码,依据封装行为的不同,代码的表现形式可能不太一样.但是基本思路如下:

- 我们会拓展我们的线程对象,让其有一个空闲和繁忙的两个状态
- 我们还会有一个调度对象,用来管理线程池中的线程,以及维护一个待执行的任务队列

下边直接贴红宝书的代码,红宝书这里采用了类似于promise的风格来表示线程的状态

```js
class TaskWorker extends Worker {
  constructor(notifyAvailable, ...workerArgs) {
    super(...workerArgs);
    // 初始化为不可用状态
    this.available = false;
    this.resolve = null;
    this.reject = null;
    // 线程池会传递回调
    // 以便工作者线程发出它需要新任务的信号
    this.notifyAvailable = notifyAvailable;
    // 线程脚本在完全初始化之后
    // 会发送一条"ready"消息
    this.onmessage = () => this.setAvailable();
  }
  // 由线程池调用，以分派新任务
  dispatch({ resolve, reject, postMessageArgs }) {
    this.available = false;
    this.onmessage = ({ data }) => {
      resolve(data);
      this.setAvailable();
    };
    this.onerror = (e) => {
      reject(e);
      this.setAvailable();
    };
    this.postMessage(...postMessageArgs);
  }
  setAvailable() {
    this.available = true;
    this.resolve = null;
    this.reject = null;
    this.notifyAvailable();
  }
}

class WorkerPool {
  constructor(poolSize, ...workerArgs) {
    this.taskQueue = [];
    this.workers = [];
    // 初始化线程池
    for (let i = 0; i < poolSize; ++i) {
      this.workers.push(
        new TaskWorker(() => this.dispatchIfAvailable(), ...workerArgs)
      );
    }
  }
  // 把任务推入队列
  enqueue(...postMessageArgs) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ resolve, reject, postMessageArgs });
      this.dispatchIfAvailable();
    });
  }
  // 把任务发送给下一个空闲的线程（如果有的话）
  dispatchIfAvailable() {
    if (!this.taskQueue.length) {
      return;
    }
    for (const worker of this.workers) {
      if (worker.available) {
        let a = this.taskQueue.shift();
        worker.dispatch(a);
        break;
      }
    }
  }
  // 终止所有工作者线程
  close() {
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}
```

在某些情况,我们可能希望不同的线程去执行不同的任务类型,红宝书这里的实现是任务来了直接推给空闲的线程,如果你希望按照任务的类型来选择不同的线程,你可以给线程池中的线程进行一些分类,将他们放到不同的组或者是怎样.

另外在线程池中的线程数量多少为最佳的问题,我们一般直接采用`navigator.hardware Concurrency`返回的核心数量来决定,当然这些都不是绝对的哈

至此,你其实已经可以开心的当一个多线程js boy/girl了.接下来要说的共享工作者线程,以及服务工作者线程你可以选择性的进行观看.

## 共享工作者线程

共享工作者线程大体上和专用工作者线程是相似的,但是共享工作者线程是可以被同源的不同上下文,页面,标签,内嵌框架(ifram)使用的,而且会根据URL来创建唯一的共享工作者线程,这意味着你使用同样的URL第二次创建的共享工作者线程是同一个,第二次创建只是帮你链接到了第一次创建的线程.这里值得一说的是,即使你使用了不同的字符串路径来创建线程,如果最终定位到的文件是同一个,依然会遵循唯一的原则,只会创建一次.共享工作者线程是否新创建线程取决于线程标识符是否唯一,线程标识符=URL+可选参name.比如下方,即使URL一致,还是会开启两个共享工作者线程.

```js
const w1=new Worker('./sworker.js',{name:'a'})
const w2=new Worker('./sworker.js',{name:'b'})
```

他的使用方式其实也和专用工作者线程有着一些细微的区别,不管是第一次创建还是被连接到该线程,都会在线程内部触发`connect`事件,这会隐式的创建MessageChannel实例对象,并将端口放置在`connect`事件对象的`ports`数组中,你可以使用`ports[0]`来将该端口保存下来,一个端口代表一个被链接进来的通信链接.

注意由于共享工作者线程工作的特性,可能不会因为你这个页面关闭而销毁,所以会导致内部端口越来越多,如果长期没有关闭浏览器,就会导致连接事件保存起来的端口越来越多,会造成严重的端口污染.推荐做法是某个时刻,比如关闭页面的时候通知线程清理对应的端口.

## 服务工作者线程

服务工作者线程是一种类似于代理的线程,可以拦截请求和缓存响应.可以让网页在断网的情况下依然可用,可以像一个原生的App一样,这就是因为他的缓存功效.

这里不去做更多的关于服务工作者线程的阐述,因为他可以看作是一种应用增强的技术,然我们的应用具备更多的原生特性.不过如果你有兴趣,可以尝试去研究下他的请求拦截等方式,还是比较有意义的.

## 总结

我相信,在工作者线程落地的那一瞬间,整个js社区是兴奋的,因为我们js也有了多线程能力!虽然不如其他多线程语言那般强大,但是我们也已经很知足了!像Egg.js等框架就已经实装了工作者线程.

最后,希望在以后的工作中有机会就多实践一下工作者线程,来切切实实的感受到它的魅力所在吧!
