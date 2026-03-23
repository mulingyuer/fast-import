/*
 * @Author: mulingyuer
 * @Date: 2026-03-19 19:54:49
 * @LastEditTime: 2026-03-23 20:34:47
 * @LastEditors: mulingyuer
 * @Description: 快速退出 (Import/解构赋值)
 * @FilePath: \fast-import\src\command\out-to-braces\index.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import * as ts from "typescript";
import { AstTool } from "../../utils/ast-tool";

export function createOutToBracesCommand() {
	const disposable = vscode.commands.registerCommand("fast-import.outToBraces", async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const astTool = new AstTool({ editor });
		let targetOffset: number | undefined;

		// 1. 尝试获取变量声明信息 (优先级高，因为它可能包含解构)
		const variableInfo = astTool.getVariableDeclarationInfo();
		if (variableInfo && variableInfo.node) {
			const statement = astTool.findParentNode(variableInfo.node, ts.isVariableStatement);
			targetOffset = statement ? statement.getEnd() : variableInfo.node.getEnd();
		}

		// 2. 尝试获取解构赋值信息
		if (targetOffset === undefined) {
			const destructuringInfo = astTool.getDestructuringInfo();
			if (destructuringInfo && destructuringInfo.node) {
				// 如果存在父级声明（变量声明或参数），优先使用父级的结束位置
				if (destructuringInfo.parentDeclaration) {
					// 如果是变量声明，尝试找到所属的 VariableStatement
					if (ts.isVariableDeclaration(destructuringInfo.parentDeclaration)) {
						const statement = astTool.findParentNode(
							destructuringInfo.parentDeclaration,
							ts.isVariableStatement
						);
						targetOffset = statement
							? statement.getEnd()
							: destructuringInfo.parentDeclaration.getEnd();
					} else {
						targetOffset = destructuringInfo.parentDeclaration.getEnd();
					}
				} else {
					targetOffset = destructuringInfo.node.getEnd();
				}
			}
		}

		// 3. 尝试获取 import 信息
		if (targetOffset === undefined) {
			const importInfo = astTool.getImportInfo();
			if (importInfo) {
				if (importInfo.type === "ast" && importInfo.node) {
					targetOffset = importInfo.node.getEnd();
				} else if (importInfo.type === "regex" && importInfo.lineIndex !== undefined) {
					const line = editor.document.lineAt(importInfo.lineIndex);
					targetOffset = editor.document.offsetAt(line.range.end);
				}
			}
		}

		// 4. 通用降级：查找光标所在的语句
		if (targetOffset === undefined) {
			const statement = astTool.getStatementAtCursor();
			if (statement) {
				targetOffset = statement.getEnd();
			}
		}

		// 执行光标移动
		if (targetOffset !== undefined) {
			const targetPosition = editor.document.positionAt(targetOffset);
			editor.selection = new vscode.Selection(targetPosition, targetPosition);
			editor.revealRange(new vscode.Range(targetPosition, targetPosition));
		} else {
			vscode.window.showInformationMessage("无法定位到语句末尾");
		}
	});

	return disposable;
}
