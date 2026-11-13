---
title: "走近前端工程化-WebPackloader的入门级知识"
published: 2022-09-26T11:30:49.000Z
description: ""
tags: ["工程化", "webpack", "loader"]
category: "前端"
draft: false
---
## 什么是loader?

webpack原生只支持js,json等数据的解析,如果想要他支持其他资源的解析,那么就需要loader上场了,这也是loader的主要作用,它将资源解析成webpack能识别的形状~

通常遇到需要的loader,我们都会区社区直接找一些loader配置上去,但是你不好奇他们是怎么工作的吗?来手写一些loader,感受下吧~

## 预先知识-分类以及优先级

按照流程分类,loader可分为下面四个类型:

- pre： 前置 loader
- normal： 普通 loader
- inline： 内联 loader
- post： 后置 loader

其执行的优先级:`pre > normal > inline > post`,同等级的 loader 执行顺序为：`从右到左，从下到上`,可通过`enforce`来配置该loader属于哪种类型:

```js
  rules: [
    {
      enforce: "pre",
      test: /\.js$/,
      loader: "loader1",
    },
  ]
```

### inline loader的前缀

- `!` 跳过 normal loader。
- `-!` 跳过 pre 和 normal loader。
- `!!` 跳过 pre、 normal 和 post loader。

示例:

```js
import Styles from '-!style-loader!css-loader?modules!./styles.css';`
```

## pitch loader的执行流程

pitch是loader上的一个方法,可以更方便我们进行流程控制;如果pitch有返回值,那么将触发熔断机制;如果触发熔断机制,那么这个pitch执行完成之后,流程会返回到上一个loader的主函数,这样更利于在代码中来控制流程,而不是通过固定的配置

流程可以看下图
<img src="./imgs/20220924104436.png" />

```js
module.exports = function (source) {  
    console.log('normal excution');   
    return source;
}
// loader上的pitch方法，非必须
module.exports.pitch =  function() { 
    console.log('pitching graph');
    // todo
    return ""
}
```

## 异步loader

异步loader通过调用`async`方法返回一个回调,通过回调完成异步操作,后续loader会被该loader阻塞

```js
module.exports = function(source) {
    let cb = this.async();
    setTimeout(() => {
      // 在异步回调中手动调用 cb 返回处理结果;第一个参数为错误信息
      cb(null, source);
    }, 3000);
}
```

## raw-loader

其实与其他loader没有什么差异,只因为它的内容是Buffer流,特别适合处理静态资源,比如图片,视频等,需要通过raw属性来告知webpack,该loader进行接受的是二进制数据

```js
// loaders/simple-raw-loader.js
module.exports = function(source) {
  // 将输出 buffer 类型的二进制数据
  console.log(source);
  return source
}
// 告诉 wepack 这个 loader 需要接收的是二进制格式的数据
module.exports.raw = true;
```

## 接下来,我们自己开发一个loader

我们来为每一个js文件前边加上一句`console.log('hello')`

那么代码下面这样写,这个loader就完成了

```js
/**
 * @param {*} content 文件内容
 * @param {*} map sourcemap
 * @param {*} meta 别的loader传递的参数
 */
module.exports = function loaderHello(content, map, meta) {
  console.log([content, map, meta]);
  const pre = `console.log('hello')\n`;
  return pre + content;
};
```

配置好就可以愉快打包啦~

```js
rules: [
  {
    test: /\.js$/i,
    loader: resolve(__dirname, "../loader/hello/index.js"),
  },
],
```

我们这个前缀是硬编码,我们希望这部分内容是动态可选的,所以我们需要配置我们的loader,那我们需要`getOptions`这个api来帮助我们;开搞~

配置格式需要指定一个`JsonSchema`来固定配置的形状,那么我们可以这样写

```json
{
  "type": "object",
  "properties": {
    "code": {
      "description": "pre code content,allow null",
      "type": "string"
    }
  },
  "additionalProperties": false
}
```

接下来对loader进行改造

```js
/**
 * @param {*} content 文件内容
 * @param {*} map sourcemap
 * @param {*} meta 别的loader传递的参数
 */
const schema = require("./schema.json");
module.exports = function loaderHello(content, map, meta) {
  const option = this.getOptions(schema);
  console.log({ content, map, meta, option });
  const pre = `${option.code}
  `;
  return pre + content;
};
```

配置项

```js
rules: [
  {
    test: /\.js$/i,
    loader: resolve(__dirname, "../loader/hello/index.js"),
    options: {
      code: "console.log('msg from config')",
    },
  },
],
```

这样,一个`hello world`级别的loader就完成啦~

## 其它loader示例

来手动创建一些loader感受下

### babel-loader

```js
const babel = require("@babel/core");
const schema = require("./schema.json");
module.exports = function (content) {
  const call = this.async();
  const options = this.getOptions(schema);
  babel.transform(content, options, function (err, result) {
    if (err) {
      call(err);
    } else {
      call(null, result.code);
    }
  });
};
```

### file-loader

这里用到的`loader-utils`可以自行去看一下:<https://github.com/webpack/loader-utils>

```js
const loaderUtils = require("loader-utils");
module.exports = function (content) {
  // 生成文件名
  const filename = loaderUtils.interpolateName(this, "[hash].[ext]", {
    content,
  });
  // 输出文件
  this.emitFile(filename, content);
  // 暴露出去,众所周知webpack眼里所有资源都是模块
  return `export default '${filename}'`;
};
```

配置:

```js
{
  test: /\.(png|jpe?g|gif)$/,
  loader: "./loaders/file-loader.js",
  type: "javascript/auto", // 解决图片重复打包问题,否则webpack会自己再去打包一次(如果不配置,你的输出目录将会出现双倍资源)
},
```

## 结语

就使用上来说,还是挺简单的,但是这种东西挺注重实战的,只有在实战中才能真正有更深入的理解.
