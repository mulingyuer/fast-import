## 重构计划

1. 使用vscode的ts ast解析功能，来实现对import引入和对象解构的分析和定位。
2. `alt+i` 实现光标定位。
3. `alt+o` 实现光标定位到对象解构句子的最末尾。
4. 自动补 `{}` destructure：
   - 当用户输入 `const res = await fetchData()`的时候，按下 `alt+i`，自动补全成 `const { } = await fetchData()`，并将光标定位到 `{}` 内部。至于是补`{}`还是`[]`，我们可以通过分析fetchData的返回值类型来判断，如果是对象就补`{}`，如果是数组就补`[]`。

## 技术路线

1. 使用 VSCode TS Language Service 来解析用户的代码，获取 AST（抽象语法树）。

## 附加条件

vscode必须勾选：`javascript.implicitProjectConfig.checkJs`和`typescript.disableAutomaticTypeAcquisition`，来保证我们能够正确获取到用户代码的类型信息，从而实现精准的光标定位和自动补全功能。
