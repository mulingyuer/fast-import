# Fast Import

Fast Import 是一款专为提升开发效率量身打造的 VS Code 插件。它基于 TypeScript AST（抽象语法树）解析技术，通过智能的光标定位与自动化重构功能，极大地减少了在编写 `import` 语句和对象解构时的琐碎光标移动，让您的编码流程更加顺畅。

## 核心功能

### 1. 智能 Import 定位 (Alt + I)

在编写 `import` 语句时，插件能够根据当前的语句结构智能判断光标的最佳落点，并自动触发代码补全提示。

- **默认导入**：光标自动定位至导入名称末尾。例如：`import moduleName| from "module"`。
- **具名导入**：光标精准跳转至 `{}` 内部。例如：`import { | } from "module"`。
- **混合导入**：同时存在默认与具名导入时，光标定位至 `{}` 内部。例如：`import defaultVal, { | } from "module"`。
- **无导入值**：当仅输入 `import from "module"` 时，按下快捷键将自动补全必要的空格并定位光标。

插件全面支持多行 `import` 语句，无论光标位于该语句的何处，均能准确识别。

### 2. 解构赋值定位 (Alt + I)

在进行对象或数组解构时，Fast Import 能够快速定位光标至解构括号内部。

- **对象解构**：`const { | } = object`。
- **数组解构**：`const [ | ] = array`。
- **嵌套解构**：支持复杂嵌套结构的解析，光标始终定位在最相关的输入位置。
- **跨行支持**：完美支持跨多行的解构声明。

### 3. 变量声明自动转换为解构 (Alt + I)

这是 Fast Import 的一项进阶功能。当您在普通的变量声明语句上按下 `Alt + I` 时，插件会尝试将其重构为解构赋值形式。

- **自动识别**：插件通过分析右侧表达式的类型（基于 TypeScript 语言服务），智能判断应补全 `{}` 还是 `[]`。
- **代码重构**：例如将 `const res = await fetchData()` 快速转换为 `const { | } = await fetchData()`，并自动将光标移入解构块中。

### 4. 快速跳出语句 (Alt + O)

当您完成解构或导入输入后，无需通过方向键繁琐移动，只需按下 `Alt + O`，光标即可瞬间跳转至当前语句的最末尾，直接开始下一行的编写。

## 键盘快捷键

| 功能 | 快捷键 | 备注 |
| :--- | :--- | :--- |
| **智能定位 / 转换** | `Alt + I` | 核心功能，支持 Import、解构及自动转换 |
| **跳出当前语句** | `Alt + O` | 将光标移至语句行尾 |

## 配置项

您可以在 VS Code 的设置中对插件行为进行自定义：

- `fast-import.enableMoveToBraces`: 是否启用 `Alt + I` 快速定位功能（默认：启用）。
- `fast-import.enableOutToBraces`: 是否启用 `Alt + O` 快速跳出功能（默认：启用）。

## 技术特性

- **AST 解析**：采用 TypeScript AST 解析替代简单的正则匹配，极大地提升了在复杂代码场景下的识别准确率。
- **多语言支持**：完美适配 TypeScript 及 JavaScript 环境。

## 轻松安装

1. **通过 VS Code 扩展市场**：在 VS Code 中，打开扩展市场，搜索 `fast-import` 并点击安装。
2. **直接访问VS Code 官方插件市场**：前往 [fast-import 插件页面](https://marketplace.visualstudio.com/items?itemName=mulingyuer.fast-import) 进行安装。
3. **通过 Open VSX 插件市场**：前往 [fast-import 插件页面](https://open-vsx.org/extension/mulingyuer/fast-import) 进行安装。

## 相关资源

1. [VS Code 内置图标库](https://microsoft.github.io/vscode-codicons/dist/codicon.html)
2. [VS Code 插件发布管理](https://marketplace.visualstudio.com/manage)
3. [Open VSX 插件发布平台](https://open-vsx.org/user-settings/extensions)
