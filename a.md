## 起因

我想要编写一个vscode插件，功能是当用户按下快捷键：`ALT+I` 的时候，会自动将光标进行定位移动，有以下两个支持范围：

1. 支持import引入的光标定位。
2. 支持对象解构的光标定位。


## 具体功能描述：

### import引入的光标定位：

1. 默认import导入的时候，如果存在默认导入值的情况下，光标定位到这个值的最末尾，例：`import a[光标定位到这] from "a";` 。
2. 没有默认导入值的情况下，如：`import [光标定位到这，并往右增加一个空格]from "a";`。
3. 具名import引入，光标定位到大括号里，例：`import {[光标定位到这]} from "a";` 不管`{}`中有多少值，换了几行，光标定位固定在`}`的左侧。
4. 如果同时存在默认导入和具名导入，光标定位到具名导入的`}`的左侧，例：`import a, {[光标定位到这]} from "a";`。


### 对象解构的光标定位：

1. 支持键值对对象`{}`的光标定位，例：`const {a[光标定位到这]} = obj;`。
2. 支持数组对象`[]`的光标定位，例：`const [光标定位到这] = arr;`。
3. 对象的解构光标定位统一都在`}`或者`]`的左侧，不管解构的对象有多少值，换了几行，光标定位固定在`}`或者`]`的左侧。
4. 支持复杂对象的解构。


## 测试代码

我提供了一份用于测试效果的代码，包含了上述两种情况：

```javascript
// 把光标放在下面 const { } = res; 这一行，按下 alt+i，应该忽略上方的 import.meta，精准定位到 { | }
const testImportMetaContext = () => {
  const appId = import.meta.env.VITE_CAPTCHA_APP_ID;

  const callback = (res: any) => {
    const {} = res;
  };

  return { appId, callback };
};
// ==========================================
// 测试用例 2: 基础 import 测试
// ==========================================
// 1. 光标放在下面这行，按下 alt+i，光标应该定位在 import 之后： import | Vue from 'vue';
import Vue from "vue";
// 2. 光标放在下面这行，按下 alt+i，光标应该定位在 { | } 内部
import { ref, reactive } from "vue";
// 3. 混合导入（默认和解构），光标放在下面这行，按下 alt+i，应该定位到 { | }
import React, { useState, useEffect } from "react";
// 4. 多行导入的检测，光标停留在 onMounted 这一行，按下 alt+i，应该跑到 { ... } 的右括号前面
import { computed, watch, onMounted, onUnmounted } from "vue";
// ==========================================
// 测试用例 3: 各种干扰环境下的解构赋值测试
// ==========================================
// 5. 光标放在下面这行，应该进入 { | } 中
const {} = Object.assign({}, { a: 1, b: 2 });
const mockRes = { data: { list: [], total: 0 }, code: 200, msg: "success" };
// 6. 连缀调用并附带对象解构，光标放在下面这一行，应该定位到 { | } 内部
const {} = [1, 2, 3]
  .map((item) => ({ test: item }))
  .reduce((acc, cur) => Object.assign(acc, cur), {});
// 7. 解构中带默认值和重命名，光标放在下面这行，应该定位在 } 前面
const { code: statusCode = 200, data, msg } = mockRes;
// 8. 嵌套对象解构，光标放在下面这行，应该跑进最外层的 { ... | } 结束前
const {
  data: { list, total },
} = mockRes;
// ==========================================
// 测试用例 4: 数组解构测试
// ==========================================
// 9. 数组解构，光标放在下面这行，应该进入 [ | ]
const [] = [1, 2, 3, 4, 5];
// 10. 函数返回值的数组解构，光标放在下面这行，应该进入 [ | ]
const [state, setState] = useState(false);
// ==========================================
// 测试用例 5: 跨越多行的解构赋值
// ==========================================
// 11. 光标放在 firstName 这一行，应该跑倒 } 的前面
const {
  user: { firstName, lastName },
  permissions,
} = { user: { firstName: "muling", lastName: "yuer" }, permissions: ["admin"] };
// ==========================================
// 测试用例 6: let 和 var 关键字测试
// ==========================================
// 12. 用 let 解构，光标在下面这行，应该进入 { | }
let { tempValue } = { tempValue: "test" };
// 13. 用 var 解构，光标在下面这行，应该进入 { | }
var { legacyVar } = { legacyVar: "old" };
```


## 结果

你能提供该功能的实现思路吗？我们是通过正则匹配还是vscode本身有提供相关的API来实现这个功能，作为一名专业的vscode插件开发者，我们该如何设计这个处理的数据对象和逻辑呢？