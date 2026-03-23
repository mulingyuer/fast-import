/*
 * @Author: mulingyuer
 * @Date: 2026-03-23 19:38:25
 * @LastEditTime: 2026-03-23 19:38:25
 * @LastEditors: mulingyuer
 * @Description: 移动光标到解构赋值
 * @FilePath: \fast-import\src\command\move-to-braces\move-cursor-destructuring.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import type { DestructuringInfo } from "../../utils/ast-tool";

export interface MoveCursorToDestructuringOptions {
	/** 解构信息 */
	destructuringInfo: DestructuringInfo;
	/** 编辑器 */
	editor: vscode.TextEditor;
}

export async function moveCursorToDestructuring(options: MoveCursorToDestructuringOptions) {
	const { destructuringInfo, editor } = options;
	const { node } = destructuringInfo;

	// getEnd() 返回的是 } 或 ] 之后的位置，所以 -1 是在闭合符号左侧
	const endOffset = node.getEnd();
	const targetPosition = editor.document.positionAt(endOffset - 1);

	// 执行光标移动
	editor.selection = new vscode.Selection(targetPosition, targetPosition);
	editor.revealRange(new vscode.Range(targetPosition, targetPosition));

	// 触发建议
	vscode.commands.executeCommand("editor.action.triggerSuggest");
}
