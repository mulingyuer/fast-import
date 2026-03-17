// @ts-nocheck
/*
 * @Author: mulingyuer
 * @Date: 2026-03-17 20:00:16
 * @LastEditTime: 2026-03-17 22:51:12
 * @LastEditors: mulingyuer
 * @Description: 测试用例，演示用的
 * @FilePath: \fast-import\src\test\case-demo.ts
 * 怎么可能会有bug！！！
 */
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
// 多声明 ALT+I 在 c 上 → 只 transform c
const a = 1,
  b = 2,
  c = fetch();
// destructure assign
({ a } = foo);
// function param
function x({ a });
// for-of
for (const { a } of arr) {
}
