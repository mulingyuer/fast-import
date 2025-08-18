import * as vscode from "vscode";
import {
  findBracePosition,
  findImportPosition,
  findDestructuringPosition,
} from "./utils";

export function activate(context: vscode.ExtensionContext) {
  // 注册统一的快速定位命令（支持import和解构赋值）
  const disposable = vscode.commands.registerCommand(
    "fast-import.moveToBraces",
    async () => {
      // 是否在文本编辑器中
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      // 首先尝试查找import位置数据
      const importData = findImportPosition(editor);

      if (importData.isValid) {
        // 处理import引入
        const braceData = findBracePosition({
          editor: editor,
          startLine: importData.startLine,
          endLine: importData.endLine,
          type: "import",
        });

        console.table(importData);
        console.table(braceData);

        if (!braceData.isWithBrace) {
          // 不存在大括号，说明是默认引入，将光标移动到 import 后面
          const newPosition = new vscode.Position(
            importData.startLine,
            importData.import.index[1]
          );

          const newSelection = new vscode.Selection(newPosition, newPosition);
          editor.selection = newSelection;
        } else {
          // 存在大括号，将光标移动到}前面
          const newPosition = new vscode.Position(
            braceData.endBraceLine,
            braceData.endBraceIndex
          );

          const newSelection = new vscode.Selection(newPosition, newPosition);
          editor.selection = newSelection;

          // 触发建议
          vscode.commands.executeCommand("editor.action.triggerSuggest");
        }
        return;
      }

      // 如果没有找到import，尝试查找解构赋值
      const destructuringData = findDestructuringPosition(editor);

      if (destructuringData.isValid) {
        // 处理解构赋值
        const braceData = findBracePosition({
          editor: editor,
          startLine: destructuringData.startLine,
          endLine: destructuringData.endLine,
          type: "destructuring",
        });

        console.table(destructuringData);
        console.table(braceData);

        // 不存在大括号，大概率是不会触发这个if分支，因为isValid必须有大括号才会返回true
        if (!braceData.isWithBrace) return;

        // 存在大括号，将光标移动到}前面
        const newPosition = new vscode.Position(
          braceData.endBraceLine,
          braceData.endBraceIndex
        );

        const newSelection = new vscode.Selection(newPosition, newPosition);
        editor.selection = newSelection;

        // 触发建议
        vscode.commands.executeCommand("editor.action.triggerSuggest");

        return;
      }

      // 如果都没有找到，显示错误信息
      vscode.window.showErrorMessage("未找到import引入或解构赋值语句");
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  // 暂时没有任何操作
}
