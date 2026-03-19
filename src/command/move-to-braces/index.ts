/*
 * @Author: mulingyuer
 * @Date: 2026-03-19 19:52:34
 * @LastEditTime: 2026-03-19 22:44:45
 * @LastEditors: mulingyuer
 * @Description: 移动光标的快捷键
 * @FilePath: \fast-import\src\command\move-to-braces\index.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import { AstTool } from "../../utils/ast-tool";
import { moveCursorToImport } from "./move-cursor-import";

// export interface MoveToBracesOptions {}

export function createMoveToBracesCommand() {
	const disposable = vscode.commands.registerCommand("fast-import.moveToBraces", async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const astTool = new AstTool({ editor });
		const importInfo = astTool.getImportInfo();

		// 存在import
		if (importInfo) {
			moveCursorToImport({ importInfo, editor });
			return;
		}

		vscode.window.showInformationMessage("光标不在 import 语句范围内");
	});

	return disposable;
}
