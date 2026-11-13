---
title: "杂项笔记汇总"
published: 2022-07-10T21:38:40.000Z
description: ""
tags: ["工具", "杂七杂八"]
category: "笔记"
draft: false
---
## 这是一个零散的笔记汇总

好记性不如烂笔头,记一些杂乱的东西,避免了每次都要去百度的尴尬境地

## 地址收集(避免每次都要去搜一下,恼火Ï)

- [nvm win地址](https://github.com/coreybutler/nvm-windows)
- [微软wsl2](https://learn.microsoft.com/zh-cn/windows/wsl/about)
- [win镜像地址](https://msdn.itellyou.cn/)

## 设置淘宝镜像(不建议,建议使用下面的方式)

```shell
# 已经废弃
npm config set registry https://registry.npm.taobao.org
# 最新的taobao镜像地址
npm config set registry http://registry.npmmirror.com
# 恢复到npm官方镜像地址
npm config set registry https://registry.npmjs.org
```

## NRM(牛肉面)设置NPM的镜像地址

```shell
npm i nrm -g
# 列出镜像地址
nrm ls 
# 使用镜像地址
nrm use taobao
```

## 删除整个依赖库node_modules

```shell
# 如果没有安装需要先安装这个
npm install rimraf -g

# 执行删除
rimraf node_modules

# 清空npm缓存
npm cache clean --force
```

## VMware 虚拟机固定IP

1.先将虚拟机网络连接模式改为NAT
2.设置NAT网关
3.设置DHCP
4.将虚拟机系统设置为静态ip,ip要对应前边设置的网关

centos示例:

```shell
vim /etc/sysconfig/network-scripts/ifcfg-ens33

TYPE=Ethernet
PROXY_METHOD=none
BROWSER_ONLY=no
BOOTPROTO=static
DEFROUTE=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=ens33
UUID=1f6d2414-12b7-40ef-8fb1-d2e6db9c739b
DEVICE=ens33
ONBOOT=yes
IPADDR=192.168.13.130
NETMASK=255.255.255.0
GATEWAY=192.168.13.254
DNS1=114.114.114.114
```

## ubuntu22.04换源

```shell
cd /etc/apt/
cp sources.list sources.list_bak
vim sources.list #用下边内容覆盖

deb http://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ jammy main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ jammy-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ jammy-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ jammy-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ jammy-backports main restricted universe multiverse

apt update
apt upgrade
```

## debian换阿里云源

```shell
deb http://mirrors.aliyun.com/debian/ stretch main non-free contrib
deb http://mirrors.aliyun.com/debian/ stretch-updates main non-free contrib
deb http://mirrors.aliyun.com/debian/ stretch-backports main non-free contrib
deb-src http://mirrors.aliyun.com/debian/ stretch main non-free contrib
deb-src http://mirrors.aliyun.com/debian/ stretch-updates main non-free contrib
deb-src http://mirrors.aliyun.com/debian/ stretch-backports main non-free contrib
deb http://mirrors.aliyun.com/debian-security/ stretch/updates main non-free contrib
deb-src http://mirrors.aliyun.com/debian-security/ stretch/updates main non-free contrib
```

## Linux将目录设置为所有人都能读写

```shell
# <!-- 用chmod命令, 先进入要修改权限的目录abc的上一级目录 , -->
# <!-- 然后运行 -->
chmod -R o+r+w abc
# <!-- 再运行 -->
chmod o+x+w abc
```

## 乌班图防火墙开关

```shell
# 开启
ufw enable
# 关闭
ufw disable
```

## 生成ssh key

```shell
ssh-keygen -t rsa -C "919401990@qq.com"
```

## debian11 一些常见的编译环境

```shell
sudo apt install pkg-config make libpng-dev gcc patch -y
```

## 创建react typescript项目

```shell
pnpm dlx create-react-app pd-project --template typescript
```

## 解决NPM下载二进制巨慢的问题

在`.npmrc`文件内加入以下内容,从`antfu`博客上看来的,经过测试过相当快~
原文链接:<https://antfu.me/posts/npm-binary-mirrors>

```text
NODEJS_ORG_MIRROR=https://cdn.npmmirror.com/binaries/node
NVM_NODEJS_ORG_MIRROR=https://cdn.npmmirror.com/binaries/node
PHANTOMJS_CDNURL=https://cdn.npmmirror.com/binaries/phantomjs
CHROMEDRIVER_CDNURL=https://cdn.npmmirror.com/binaries/chromedriver
OPERADRIVER_CDNURL=https://cdn.npmmirror.com/binaries/operadriver
ELECTRON_MIRROR=https://cdn.npmmirror.com/binaries/electron/
ELECTRON_BUILDER_BINARIES_MIRROR=https://cdn.npmmirror.com/binaries/electron-builder-binaries/
SASS_BINARY_SITE=https://cdn.npmmirror.com/binaries/node-sass
SWC_BINARY_SITE=https://cdn.npmmirror.com/binaries/node-swc
NWJS_URLBASE=https://cdn.npmmirror.com/binaries/nwjs/v
PUPPETEER_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries
SENTRYCLI_CDNURL=https://cdn.npmmirror.com/binaries/sentry-cli
SAUCECTL_INSTALL_BINARY_MIRROR=https://cdn.npmmirror.com/binaries/saucectl
npm_config_sharp_binary_host=https://cdn.npmmirror.com/binaries/sharp
npm_config_sharp_libvips_binary_host=https://cdn.npmmirror.com/binaries/sharp-libvips
npm_config_robotjs_binary_host=https://cdn.npmmirror.com/binaries/robotj
```

## win ltsc激活

```shell
slmgr -ipk M7XTQ-FN8P6-TTKYV-9D4CC-J462D

slmgr -skms kms.03k.org

slmgr -ato

slmgr -dlv
```

## git相关的

### git一次性拉去所有分支更新组合拳

一次性采集所有分支,并进行pull更新

```shell
git fetch --all
# 项目 
git pull --all
```

### 追踪文件名大小写

由于默认的git不会追踪文件大小写,这会导致一些问题,白白浪费我们的时间来排查问题,我们可以防患于未然,执行以下命令在未来杜绝这个问题

```shell
# 全局
git config --global core.ignorecase false
# 项目 
git config core.ignorecase false
```

## 给linux文件添加可执行权限

```shell

chmod u+x xxx.sh

./xxx.sh

```

## git 只拉取最新的提交,git clone速度拉满

```shell
git clone -b develop git@xxx.org:username/repo.git --depth=1
```

## 禁用ts检查

```ts
单行忽略(添加到特定行的行前来忽略这一行的错误)
// @ts-ignore

跳过对某些文件的检查 (添加到该文件的首行才起作用)
// @ts-nocheck

对某些文件的检查
// @ts-check
```

## adb连接设备

```shell
adb connect [ip]:[port]
# 比如
adb connect 100.78.252.21:5555
# 断开
adb disconnect [ip]:[port]
# 使用adb远程控制手机
scrcpy
```

## 配置bash终端代理

```shell
# 端口一般指向你本地的代理服务器
export http_proxy=http://127.0.0.1:7890;
export https_proxy=http://127.0.0.1:7890;
```

## 收集到的测试资源

### 视频链接

```text
3秒
https://www.w3school.com.cn/i/movie.ogg
mp4

10秒
https://www.runoob.com/try/demo_source/mov_bbb.mp4

10秒
https://www.runoob.com/try/demo_source/movie.mp4

1分钟
http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4

46秒
http://vjs.zencdn.net/v/oceans.mp4

52秒
http://vjs.zencdn.net/v/oceans.mp4

小米 mix fold3
https://cdn.cnbj1.fds.api.mi-img.com/product-images/xiaomimixfold3k3zux1/video-1-1.mp4
```

### 图片上传接口url

```text
none;
```

### 直播流

```text
http://live-uat.nrbvc.com/chicken/main.flv
```

## vscode 备忘录

### 代码注释折叠标志 #region #endregion

它可以让你把相关的代码折叠到一起,而无需和语法挂钩.

```js
// #region xxx功能区域
// ...code
// #endregion
```
