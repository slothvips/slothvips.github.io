---
title: "基于axios的接口级防重复请求封装案例"
published: 2023-01-08T22:21:22.000Z
description: ""
tags: ["axios", "接口", "防抖", "节流"]
category: "前端"
draft: false
---
## 为什么需要防抖和节流来减少函数调用?

在工作中,我们为了避免用户的误操作,以及程序的错误设置带来的过于频繁的执行某些操作,比如数据的增删改操作,比如用户的输入操作等,这些问题除了会影响应用性能问题外,甚至会导致程序出现一些错误.我们通常会使用节流和防抖来解决该类问题,我们通常的做法是使用节流和防抖来增强我们的函数让某些操作减少执行,所以我们今儿使用axios的取消操作来实现接口级防频繁请求.

## 首先,我们需要了解axios取消请求的方式

我们首先来看一个axios的取消操作

```ts
let cancelToken;
axios.get("xxx", {
  cancelToken: new axios.CancelToken((cancel) => {
    cancelToken = cancel;
  }),
});
// 我们只需要调用这个函数就可以直接取消这个请求
cancelToken();
```

好的,前置知识已经完毕,接下来开始封装我们的axios吧

## 开搞

首先创建一个axios实例,其配置参数可以自行去看下文档,这块大部分是根据自己项目以及业务来的

```ts
const request = axios.create({
  baseURL: "xxx",
  timeout: 2000,
});

```

然后是请求和响应的拦截器,我们也是在这两个钩子里大做文章,先来个雏形吧

```ts
request.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error(error);
    return error;
  }
);
request.interceptors.response.use(
  (response) => {
    // TODO 业务处理
    return response;
  },
  (err) => {
    // TODO 业务处理
    console.error(err);
  }
);
```

我们这里只是简单的将请求参数和响应正常返回,具体的逻辑应该根据自己的业务来,我们这次的封装只关心接口的防频繁处理.

接下来就是重点了,我们应该怎么来处理呢?而且要和axios本身进行很好的整合.不卖关子了,直接上逻辑.

主要逻辑是这样的:

- 我们会维护一个Map对象,它主要用来保存该次请求所映射的axios取消函数

- 当新的请求进来的时候,我们在请求拦截器内要想办法去确定该次请求是不是重复请求
  - A.如果是重复请求,那么我们就需要取消本次请求,直到上次的请求响应返回以后,新的请求才可以正常执行
  - B.如果不是重复请求,那就是正常的请求流程,将该次请求的映射关系放到Map对象内
- 当请求响应后,我们需要从Map对象内移除自身的映射关系

很清晰明了吧,大致上就是上边的流程了

我们按照设想,首先会有一个Map类型的变量,它用来保存我们的映射关系

```ts
const url_method_paramsToReqMap = new Map();
```

然后就是请求拦截了,我们需要在这里判断是不是重复请求而做出不一样的行为

```ts
request.interceptors.request.use(
  (config) => {
    repeatRequestHandle(config);
    return config;
  },
  (error) => {
    console.error(error);
    return error;
  }
);
```

可以看到我们在钩子里放了一个`repeatRequestHandle`函数,并将axios的config放了进去,这个函数最主要的作用就是用来判断是否是重复请求,我们来实现它,这里说下我是怎么判断是否是重复请求的,你们有更好的方式当然可以用更好的方式

判断是否是重复请求的依据是该次请求的路径方法和参数序列化后所形成的字符串是否一致,这里我们统称为请求的key,这已经可以保证绝大部分情况了,毕竟这些都完全一致的情况下,那么几乎是同意来源的请求;当然,如果的确不是同意来源的请求,但是又不想受到限制,可以自行加一些参数避开这一块逻辑即可,当然这是后话;

我们先来实现获取请求key的函数,这里我们用[qs](https://www.npmjs.com/package/qs)来序列化参数

```ts
const genRequestKey = (config: AxiosRequestConfig) => {
  const { url, method, params, data = {} } = config;
  return [url, method, qs.stringify(params), qs.stringify(data)].join("_");
};
```

好接下来就是判断逻辑了,很简单如果当前请求的key还在映射列表内,那么新请求就属于重复请求,反之就是符合放行条件的请求,这个方法还返回一个boolean来支撑外部的逻辑,比如进度条的`start`和`done`调用时机

```ts
const repeatRequestHandle = (config: AxiosRequestConfig) => {
  const key = genRequestKey(config);
  if (url_method_paramsToReqMap.has(key)) {
    cancelRequest(config, key);
    return false;
  }
  else {
    addReqList(config, key);
    return true;
  }
};
```

在这段代码中,我们再次引入了两个新函数,他们分别是`cancelRequest`,`addReqList`,以下简述他们的主要作用:

- addReqList 主要用来处理放行请求的逻辑,它主要做两件事:1.让取消函数和本次请求关联,2.将请求的key和请求取消函数放入映射列表
- cancelRequest 用来取消该次请求

解析来我们来实现他们,首先是addReqList

```ts
const addReqList = (
  config: AxiosRequestConfig,
  key = genRequestKey(config)
) => {
  config.cancelToken = new axios.CancelToken((cancel) => {
    url_method_paramsToReqMap.set(key, cancel);
  });
};
```

然后是cancelRequest,在这里你可以选择性的取消本次还是上次的请求,个人觉得最可靠的是取消新进入的请求,因为即使上次的请求未响应,但是极有可能在服务端已经做了一些操作,这个时候去取消明显很容易出问题,而且一些后端也要求前端不允许取消请求;当然也不是不行,经过我的测试,前端在取消请求后,后端也会有所反应,只要和后端商量好,在取消请求的时候做回滚操作那也不是行不通,只是做的越多出问题的概率也会更多.

```ts
const cancelRequest = (
  config: AxiosRequestConfig,
  key = genRequestKey(config)
) => {
  config.cancelToken = new axios.CancelToken((cancel) => {
    cancel();
  });
};
```

到这里,我们请求拦截这一块算是做完了,然后就是响应拦截器,这一块的逻辑很简单,在响应完成后直接移除映射关系即可

```ts
request.interceptors.response.use(
  (response) => {
     removeReqList(response.config);
    // TODO 业务处理
    return response;
  },
  (err) => {
    console.error(err);
  }
);
```

这里引入的`removeReqList`函数实现如下:

```ts
const removeReqList = (
  config: AxiosRequestConfig,
  key = genRequestKey(config)
) => {
  url_method_paramsToReqMap.delete(key);
  cancelRequest(config, key);
};
```

## 到这里我们的封装就算完成了,就可以开心的发送网络请求了

完整的源码如下:

```ts
import axios, { AxiosRequestConfig } from "axios";
import qs from "qs";

const request = axios.create({
  baseURL: "xxx",
  timeout: 2000,
});

const url_method_paramsToReqMap = new Map();

// 根据请求路径+方法+参数的子字符串来作为判断是否是同一个来源发起的请求,尽量避免误杀,但是如果真的有存在参数一致的情况下,就可能需要额外的参数来支持了
const genRequestKey = (config: AxiosRequestConfig) => {
  const { url, method, params, data = {} } = config;
  return [url, method, qs.stringify(params), qs.stringify(data)].join("_");
};

// 加入请求中列表
const addReqList = (
  config: AxiosRequestConfig,
  key = genRequestKey(config)
) => {
  config.cancelToken = new axios.CancelToken((cancel) => {
    url_method_paramsToReqMap.set(key, cancel);
  });
};

// 取消请求
const cancelRequest = (
  config: AxiosRequestConfig,
  key = genRequestKey(config)
) => {
  config.cancelToken = new axios.CancelToken((cancel) => {
    cancel();
  });
};

const removeReqList = (
  config: AxiosRequestConfig,
  key = genRequestKey(config)
) => {
  url_method_paramsToReqMap.delete(key);
  cancelRequest(config, key);
};

const repeatRequestHandle = (config: AxiosRequestConfig) => {
  const key = genRequestKey(config);
  if (url_method_paramsToReqMap.has(key)) {
    cancelRequest(config, key);
    return false;
  }else {
    addReqList(config, key);
    return true;
  }
};

request.interceptors.request.use(
  (config) => {
    repeatRequestHandle(config);

    return config;
  },
  (error) => {
    console.error(error);
    return error;
  }
);
request.interceptors.response.use(
  (response) => {
    removeReqList(response.config);

    // TODO 业务处理

    return response;
  },
  (err) => {
    console.error(err);
  }
);



```
