/*
 * @Author: mulingyuer
 * @Date: 2026-03-19 22:02:45
 * @LastEditTime: 2026-03-19 22:44:15
 * @LastEditors: mulingyuer
 * @Description: 移动光标到 import 语句
 * @FilePath: \fast-import\src\command\move-to-braces\move-cursor-import.ts
 * 怎么可能会有bug！！！
 */
import * as ts from "typescript";
import * as vscode from "vscode";
import type { ImportInfo } from "../../utils/ast-tool";

// 定位规则：
// 1. 默认import导入的时候，如果存在默认导入值的情况下，光标定位到这个值的最末尾，例：`import a[光标定位到这] from "a";` 。
// 2. 没有默认导入值的情况下，如：`import [光标定位到这，并往右增加一个空格]from "a";`。
// 3. 具名import引入，光标定位到大括号里，例：`import {[光标定位到这]} from "a";` 不管`{}`中有多少值，换了几行，光标定位固定在`}`的左侧。
// 4. 如果同时存在默认导入和具名导入，光标定位到具名导入的`}`的左侧，例：`import a, {[光标定位到这]} from "a";`。

export interface MoveCursorToImportOptions {
	/** import 信息 */
	importInfo: ImportInfo;
	/** 编辑器 */
	editor: vscode.TextEditor;
}

export async function moveCursorToImport(options: MoveCursorToImportOptions) {
	const { importInfo, editor } = options;

	let targetPosition: vscode.Position | undefined;

	// 情况 A: AST 解析成功的节点
	if (importInfo?.node) {
		const node = importInfo.node;
		const clause = node.importClause;

		if (clause) {
			// 规则 3 & 4: 存在具名导入 {...}
			if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
				// getEnd() 是 } 之后的位置，所以 -1 是 } 之前
				const endOffset = clause.namedBindings.getEnd();
				targetPosition = editor.document.positionAt(endOffset - 1);
			}
			// 规则 1: 仅有默认导入 import a from 'a'
			else if (clause.name) {
				const endOffset = clause.name.getEnd();
				targetPosition = editor.document.positionAt(endOffset);
			}
		}
	}

	// 情况 B: AST 解析失败，使用正则兼容不完整的 import 语句
	if (!targetPosition) {
		const lineIndex =
			importInfo?.type === "regex"
				? importInfo.lineIndex!
				: editor.document.positionAt(importInfo?.node!.getStart()!).line;
		const lineText = editor.document.lineAt(lineIndex).text;

		// 匹配 "import" 关键字后的位置
		const match = lineText.match(/^(.*?\bimport\s+)(from\b.*)/);
		if (match) {
			// match[1] 是 "import " (带一个空格)
			const insertIdx = match[1].length;
			const insertPos = new vscode.Position(lineIndex, insertIdx);

			// 在 from 前插入一个空格，使之变成 "import  from"
			await editor.edit(
				(editBuilder) => {
					editBuilder.insert(insertPos, " ");
				},
				{ undoStopBefore: true, undoStopAfter: false }
			);

			// 光标定位在两个空格中间：import [光标] from
			targetPosition = insertPos;
		} else {
			// 极端情况：只有 import
			const importIdx = lineText.indexOf("import");
			if (importIdx !== -1) {
				targetPosition = new vscode.Position(lineIndex, importIdx + 6);
			}
		}
	}

	// 最后执行光标移动
	if (targetPosition) {
		editor.selection = new vscode.Selection(targetPosition, targetPosition);
		editor.revealRange(new vscode.Range(targetPosition, targetPosition));

		// 触发建议
		vscode.commands.executeCommand("editor.action.triggerSuggest");
	}
}
