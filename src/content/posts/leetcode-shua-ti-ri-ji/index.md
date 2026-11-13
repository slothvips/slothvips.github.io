---
title: "leetcode刷题日记"
published: 2022-11-13T12:04:01.000Z
description: ""
tags: ["算法", "leetcode"]
category: "编程基础"
draft: false
---
## 2022/11/13 #20 有效的括号

这道题目的核心思想理解栈的数据结构

```js
var isValid = function (s) {
  const dict = new Map([
    ["(", ")"],
    ["{", "}"],
    ["[", "]"],
  ])
  const stack = []
  const pres = [...dict.keys()]
  const ends = [...dict.values()]
  for (let i = 0; i < s.length; i++) {
    const char = s[i]
    if (pres.includes(char)) {
      stack.push(char)
    } else if (ends.includes(char)) {
      if (dict.get(stack.pop()) !== char) return false
    }
  }
  return !stack.length
};
```

## 2022/11/14 #1 两数之和

两个数字相亲记~

```js
var twoSum = function (nums, target) {
  const map = new Map()
  for (let i = 0; i < nums.length; i++) {
    const n = nums[i]
    const theHalf = target - n
    if (!map.has(theHalf)) {
      map.set(n, i)
    } else {
      return [map.get(theHalf), i]
    }
  }
};
```

## 2022/11/15 #9 回文数

其实就是两个指针靠近,直到两人亲上都还能没发生不同,那就是一个回文数

```js
var isPalindrome = function (x) {
  const n = "" + x;
  if (n.length === 1) return true;
  let p1 = 0,
    p2 = n.length - 1;
  while (p1++ < p2--) {
    if (n[p1-1] !== n[p2+1]) return false;
  }
  return true;
};
```

## 2022/11/16 #13 罗马数字

这道题我最开始写出来是这样的,能明显感觉到不是很优雅

```js
var romanToInt = function (s) {
  const dict = new Map([
    ['I', 1],
    ['V', 5],
    ['X', 10],
    ['L', 50],
    ['C', 100],
    ['D', 500],
    ['M', 1000],
  ]);
  let flag = false
  const nums = s.split('')
  return nums.reduce((p, n, i) => {
    if (dict.get(nums[i + 1]) > dict.get(n)) {
      flag = true
      return p + 0
    }
    if (flag) {
      flag = false
      return p + dict.get(n) - dict.get(nums[i - 1])
    }
    return p + dict.get(n)
  }, 0)
};
```

通过观察我们可以看出来,当右边不小于左边的时候是正常的的转换逻辑,当右边比左边大的就需要用右边减去左边,那我们可以先减再加,我们可以这样改

```js
var romanToInt = function (s) {
  const dict = new Map([
    ['I', 1],
    ['V', 5],
    ['X', 10],
    ['L', 50],
    ['C', 100],
    ['D', 500],
    ['M', 1000],
  ]);
  return s.split('').reduce((p, n, i, ns) => {
    if (dict.get(ns[i + 1]) > dict.get(n)) {
      return p - dict.get(n)
    } else {
      return p + dict.get(n)
    }
  }, 0)
};
```

## 2022/11/17 #14 最长公共前缀

```js
var longestCommonPrefix = function (strs) {
  let p = 0
  while (p > -1) {
    const uniPicks = [...new Set(strs.map((str) => str[p]))]
    if (uniPicks.includes(undefined) || uniPicks.length != 1) {
      return strs[0].substring(0, p)
    }
    p++
  }
};
```

## 2022/11/18 #26 删除有序数组中的重复项

```js
var removeDuplicates = function (nums) {
  const uniNums = [...new Set(nums)]
  nums.length = uniNums.length
  uniNums.forEach((n, i) => {
    nums[i] = n
  })
  return nums.length
};
```

## 2022/11/19 #27 移除元素

```js
var removeElement = function (nums, val) {
  let i = 0;
  while (i < nums.length) {
    if (nums[i] === val) {
      nums.splice(i, 1)
    } else {
      i++
    }
  }
  return nums.length
};
```

## 2022/11/21 #35 搜索插入位置 | #58 最后一个单词的长度

```js
// #35 搜索插入位置
var searchInsert = function (nums, target) {
  for (let i = 0; i < nums.length; i++) {
    // case1 相等
    if (nums[i] === target) return i;
    // case2 在某个节点大于它之前
    if (nums[i] > target) return i;
  }
  // case3 插入末尾
  return nums.length;
};

// #58 最后一个单词的长度
var lengthOfLastWord = function (s) {
  return s.trim().split(" ").at(-1).length;
};
```

## 2022/11/22 #66 加一

```js
var plusOne = function (digits) {
  let carry = false;
  digits[digits.length - 1] = digits.at(-1) + 1;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits[i]
    if (carry) {
      n++;
      carry = false;
    }
    if (n >= 10) {
      carry = true;
      digits[i] = n % 10;
    } else {
      digits[i] = n;
    }
  }
  if (carry) {
    digits.unshift(1)
  }
  return digits;
};
```

想了想,其实所有工作都可以在for循环里完成

```js
var plusOne = function (digits) {
  digits[digits.length - 1] = digits.at(-1) + 1;
  for (let i = digits.length - 1; i >= 0; i--) {
    if (digits[i] >= 10) {
      digits[i] = digits[i] % 10;
      // 防止下标越界
      if (i === 0) {
        digits.unshift(1);
      } else {
        digits[i - 1] = digits[i - 1] + 1;
      }
    }
  }
  return digits;
};
```

## 2022/11/23 #67 二进制求和

这道题和昨天的题神似,不过换成二进制的n+n,昨天是十进制的n+1

```js
var addBinary = function (a, b) {
  const r = [];
  const sameLen = a.length === b.length;
  // 长组
  const l = sameLen ? a : a.length > b.length ? a : b
  const lt = l.split("");
  const li = lt.length - 1;
  // 短组
  const s = sameLen ? b : a.length < b.length ? a : b
  const st = s.split("");
  let si = st.length - 1;
  // 长短差
  const di = li - si;
  // 公共进制位
  while (si >= 0) {
    const n = +lt[di + si] + +st[si]
    // 需要进位
    if (n >= 2) {
      r.unshift(n % 2);
      // 相同长度下防止下标越界
      if (si === 0 && sameLen) {
        r.unshift(1)
      } else {
        lt[si + di - 1] = +lt[si + di - 1] + 1;
      }
    }
    // 无需进位
    else {
      r.unshift(n);
    }
    si--
  }
  // 长组余下进制位,其实和上边的逻辑相似,只是不用考虑加法
  if (di) {
    let i = di - 1;
    while (i >= 0) {
      const n = lt[i];
      if (n >= 2) {
        r.unshift(n % 2)
        if (i === 0) {
          r.unshift(1)
        } else {
          lt[i - 1] = +lt[i - 1] + 1;
        }
      } else {
        r.unshift(n)
      }
      i--
    }
  }
  return r.join('');
};
```

看到评论区有同学说,长度不一样的情况下可以直接补齐之后再计算,一想的确有道理啊,但是效率应该不会有多大提升,该循环的次数一次没少,不过简洁一些

```js
var addBinary = function (a, b) {
  const r = [];
  const sameLen = a.length === b.length;
  // 长组
  const l = sameLen ? a : a.length > b.length ? a : b
  const lt = l.split("");
  let li = lt.length - 1;
  // 短组
  const s = sameLen ? b : a.length < b.length ? a : b
  const st = s.split("");
  const si = st.length - 1;
  // 长短差
  const di = li - si;
  // 补齐短组
  const ft = sameLen ? st : [...new Array(di).fill(0), ...st];
  // 公共进制位
  while (li >= 0) {
    const n = +lt[li] + +ft[li]
    // 需要进位
    if (n >= 2) {
      r.unshift(n % 2);
      // 相同长度下防止下标越界
      if (li === 0) {
        r.unshift(1)
      } else {
        lt[li - 1] = +lt[li - 1] + 1;
      }
    }
    // 无需进位
    else {
      r.unshift(n);
    }
    li--
  }
  return r.join('');
};
```

确实少了很多代码哈.

## 2022/11/27 #69 X的平方根 | #70 爬楼梯 | # 83 删除排序链表中的重复元素

```js
// #69
var mySqrt = function (x) {
  if (x == 0 || x == 1) return x;
  let left = 1, right = x;
  // 只要左边没超过右边就需要一直去查找
  while (left < right) {
    // 如果只相隔1,直接返回左边
    if (right - left == 1) return left;
    // 向下取整中位数
    let mid = left + Math.floor((right - left) / 2);
    // 除以中位数
    let res = x / mid;
    // 如果刚好结果相等,中位数就是想要的数字
    if (res === mid) return mid;
    // 如果结果小于中位数,说明应该向左缩小范围
    if (res < mid) {
      right = mid;
    }
    // 如果结果大于中位数,说明应该向右缩小范围
    else {
      left = mid;
    }
  }
};

// #70 这是一道经典的动态规划的算法题目,你需要做的最关键的一点是总结出前后节点的规律,或者说是一个公式
var climbStairs = function (n) {
  if (n < 2) return 1;
  // 用来保存每个台阶的方法数目
  const dp = [1, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
};

// #83
var deleteDuplicates = function (head) {
  let p = head;
  while (p && p.next) {
    // 下个节点
    const next = p.next;
    // 如果重复,将当前节点的next指向下个节点的next
    if (next.val === p.val) {
      p.next = next.next;
    } else {
      // 将当前指针往后移动
      p = p.next;
    }
  }
  return head;
};
```

## 2023/1/19 #88 合并两个有序数组

这个题依然算是简单的指针题,两个指针在自己的合适的情况前进,直到走到目标位置即可

不知道为啥今天leetcode抽疯测试和提交出问题了,但是在本地测试是没问题的,没有测试所有测试用例,可能会有边角料问题,小case~

```js
var merge = function (nums1, m, nums2, n) {
  const res = [];
  let i = 0, j = 0;
  while (i < m || j < n) {
    const n1 = nums1[i]
    const n2 = nums2[j]
    // 是否越界
    if (i >= m) {
      res.push(n2)
      j++
    }
    // 是否越界
    else if (j >= n) {
      res.push(n1)
      i++
    }
    // 判断大小
    else if (n1 < n2) {
      res.push(n1)
      i++
    } else if (n1 > n2) {
      res.push(n2)
      j++
    }
    // 相等 
    else {
      res.push(n1, n2)
      i++
      j++
    }
  }
  return res
};
```

原来leetcode那天并没有抽风,其实是我没注意到题目,是合并到num1数组,不是返回一个新数组 =.=

```js
var merge = function (nums1, m, nums2, n) {
  // 从后往前遍历，避免覆盖
  let i = m - 1, j = n - 1, k = m + n - 1;
  while (i >= 0 && j >= 0) {
    if (nums1[i] > nums2[j]) {
      nums1[k--] = nums1[i--];
    } else {
      nums1[k--] = nums2[j--];
    }
  }
  // nums2还有剩余
  while (j >= 0) {
    nums1[k--] = nums2[j--];
  }
  return nums1;
};
```

## 2023/1/19 #112 合并两个有序数组

<!-- TODO -->

## 2023/4/11 #104 二叉树的最大深度

```js
var maxDepth = function (root) {
  if (root === null) return 0;
  return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1;
};
```

## 20230/6/7

### 189 轮转数组

```js
var rotate = function (nums, k) {
  for (let i = 0; i < k; i++) {
    nums.unshift(nums.pop());
  }
};
```

### 724 寻找数组的中心下标

这道题目难度是中等？我感觉就很简单啊~

```js
var pivotIndex = function (nums) {
  let index = -1;
  for (let i = 0; i < nums.length; i++) {
    const leftSum = nums.slice(0, i).reduce((a, b) => a + b, 0);
    const rightSum = nums.slice(i + 1).reduce((a, b) => a + b, 0);
    if (leftSum === rightSum) {
      index = i;
      break;
    }
  }
  return index
};
```
