---
title: "寻路算法"
published: 2025-04-28T14:27:49.000Z
description: ""
tags: ["路径规划", "寻路算法"]
category: "算法"
draft: false
---
## 何为寻路算法

如果你在玩游戏，可能会遇到一些需要寻找路径的场景，比如在一个迷宫中找到从起点到终点的路径,找到这条最短路径的算法就是寻路算法.

## 算法核心

算法的核心是采用广度优先遍历所有可能的路径,直到找到目标点为止.在这个过程中,我们需要记录每个节点的父节点,以便在找到目标点后,可以通过父节点回溯到起点.

这个算法的一个比喻,你可以想象一滴水从迷宫中某个点开始向四面八方蔓延,最先碰到终点的就是最短路径.

## code
 talk is cheap, show me the code.

<iframe
  src="/demo/find-path/"
  title="寻路算法交互演示"
  loading="lazy"
  style="width:100%;height:560px;border:1px solid var(--line-divider);border-radius:0.75rem;"
></iframe>
