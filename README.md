## 前言

在日常的编码工作中，手动输入 `import` 语句和进行对象解构时，频繁地移动光标常常会打断我们的编程体验。为了解决这一痛点，我自己开发了 `fast-import`这个VS Code 插件，旨在通过简单的快捷键操作，极大地提升代码引入与解构的效率和流畅度。

## 痛点回顾与解决方案

你是否曾因为以下场景而感到烦恼？

* **手动 `import`：** 输入 `import {} from "..."` 后，需要手动将光标移入 `{}` 中，再等待代码提示。
* **对象解构：** 键入 `const {} = object;` 后，同样需要手动定位光标以输入解构属性。

`fast-import` 插件正是为解决这些重复且繁琐的操作而生。它能够智能判断当前上下文，并通过统一的快捷键，将光标准确地定位到你需要输入的位置，并自动触发代码提示，让你专注于代码逻辑，不再为光标移动而分心。

## 轻松安装

安装 `fast-import` 插件非常简单，只需几步即可完成：

1. **通过 VS Code 扩展市场：** 在 VS Code 中，打开扩展市场，搜索 `fast-import` 并点击安装。
2. **直接访问插件市场：** 前往 [fast-import 插件页面](https://marketplace.visualstudio.com/items?itemName=mulingyuer.fast-import) 进行安装。

安装成功后，你将立即体验到开发效率的显著提升！

![安装插件](https://github.com/mulingyuer/fast-import/raw/HEAD/docs/images/安装插件01.png)

## 如何使用 `fast-import`

`fast-import` 的核心优势在于其智能和统一的快捷键操作。

### 1. `import` 快速引入

当你需要引入模块时，`fast-import` 能自动帮你完成光标定位和提示触发。

**场景一：具名导出引入**

```javascript
import {} from "module-name";
```

无论你的光标位于 `import` 语句的任何位置（甚至支持换行后的语句），例如 `import` 关键词之前或 `from` 关键词之后，只需按下快捷键 `alt+i`，光标便会自动瞬移至 `{}` 内部，并立即展示可导入的成员列表。

**场景二：默认导出引入**

```javascript
import  from "module-name";
```

对于默认导出，将光标置于该 `import` 语句的任意位置，按下 `alt+i`，光标会自动定位到 `import` 关键字之后，方便你直接输入默认导出模块的名称。

![import 快速引入](https://github.com/mulingyuer/fast-import/raw/HEAD/docs/images/import快速引入.gif)

### 2. 解构快速引入

在进行对象或数组解构时，`fast-import` 同样能为你节省大量时间。

```javascript
const { } = {age: 18, name: "Alice"};

const [ ] = [1, 2, 3];
```

将光标放置在解构语句的任意位置（例如 `const` 之前，或被解构对象内部），按下快捷键 `alt+i`，光标将精准移动到 `{}` 或者 `[]` 内部，并自动弹出可解构的属性提示。

`fast-import` 全面支持 `const`、`let`、`var` 三种声明方式，无论是解构函数返回值、普通对象还是数组，都能完美应对。

![解构快速引入](https://github.com/mulingyuer/fast-import/raw/HEAD/docs/images/解构快速引入.gif)

## 快捷键

* `Alt+I` - 智能快速定位（同时支持 `import` 引入和解构赋值）

## 🔗 相关资源

以下是一些可能对开发者有用的相关资源：

1. VS Code 内置图标库：[codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html)
2. VS Code 插件发布管理：[manage](https://marketplace.visualstudio.com/manage)
3. Open VSX 插件发布平台：[open-vsx](https://open-vsx.org/user-settings/extensions)
