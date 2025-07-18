import * as vscode from "vscode";
import { findBracePosition, findImportPosition } from "./utils";

export function activate(context: vscode.ExtensionContext) {
  // 注册命令
  const disposable = vscode.commands.registerCommand(
    "fast-import.moveToBraces",
    async () => {
      // 是否在文本编辑器中
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      // 获取import位置数据
      const data = findImportPosition(editor);
      if (!data.isValid) {
        vscode.window.showErrorMessage(data.validMessage);
        return;
      }

      // 查找大括号位置数据
      const braceData = findBracePosition({
        editor: editor,
        startLine: data.startLine,
        endLine: data.endLine,
      });

      console.table(data);
      console.table(braceData);

      if (!braceData.isWithBrace) {
        // 不存在大括号，说明是默认引入，将光标移动到 import 后面
        const newPosition = new vscode.Position(
          data.startLine,
          data.import.index[1]
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
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  // 暂时没有任何操作
}
