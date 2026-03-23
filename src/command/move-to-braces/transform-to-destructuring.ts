/*
 * @Author: mulingyuer
 * @Date: 2026-03-23 20:00:00
 * @LastEditTime: 2026-03-23 20:00:00
 * @LastEditors: mulingyuer
 * @Description: 将变量声明转换为解构赋值
 * @FilePath: \fast-import\src\command\move-to-braces\transform-to-destructuring.ts
 */
import * as vscode from "vscode";
import type { AstTool, VariableDeclarationInfo } from "../../utils/ast-tool";

export interface TransformToDestructuringOptions {
	/** 变量信息 */
	variableInfo: VariableDeclarationInfo;
	/** AST 工具 */
	astTool: AstTool;
	/** 编辑器 */
	editor: vscode.TextEditor;
}

export async function transformToDestructuring(options: TransformToDestructuringOptions) {
	const { variableInfo, astTool, editor } = options;
	const { identifier } = variableInfo;

	// 获取类型
	const type = await astTool.getTypeOfExpression(identifier);

	const replacement = type === "object" ? "{ }" : "[ ]";

	// 获取标识符的范围
	const range = new vscode.Range(
		editor.document.positionAt(identifier.getStart()),
		editor.document.positionAt(identifier.getEnd())
	);

	// 执行编辑
	await editor.edit((editBuilder) => {
		editBuilder.replace(range, replacement);
	});

	// 计算光标位置：在大括号或中括号内部
	// getStart() 是替换开始的位置，replacement.length - 1 是闭合符号前的位置
	const targetOffset = identifier.getStart() + replacement.length - 1;
	const targetPosition = editor.document.positionAt(targetOffset);

	// 移动光标
	editor.selection = new vscode.Selection(targetPosition, targetPosition);
	editor.revealRange(new vscode.Range(targetPosition, targetPosition));

	// 触发建议
	vscode.commands.executeCommand("editor.action.triggerSuggest");
}
