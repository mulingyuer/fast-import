/*
 * @Author: mulingyuer
 * @Date: 2026-05-21 00:00:00
 * @LastEditTime: 2026-05-21 00:00:00
 * @LastEditors: mulingyuer
 * @Description: 移动光标到 export 重导出语句
 * @FilePath: \fast-import\src\command\move-to-braces\move-cursor-export.ts
 * 怎么可能会有bug！！！
 */
import * as ts from "typescript";
import * as vscode from "vscode";
import type { ExportInfo } from "../../utils/ast-tool";

// 定位规则：
// 具名重导出（export {} from / export type {} from），光标定位到 } 的左侧。
// 不管 {} 中有多少值、换了几行，光标定位固定在 } 的左侧。

export interface MoveCursorToExportOptions {
	/** export 信息 */
	exportInfo: ExportInfo;
	/** 编辑器 */
	editor: vscode.TextEditor;
}

export async function moveCursorToExport(options: MoveCursorToExportOptions) {
	const { exportInfo, editor } = options;

	let targetPosition: vscode.Position | undefined;

	// 情况 A: AST 解析成功的节点
	if (exportInfo?.node) {
		const node = exportInfo.node;
		if (node.exportClause && ts.isNamedExports(node.exportClause)) {
			// getEnd() 是 } 之后的位置，所以 -1 是 } 之前
			const endOffset = node.exportClause.getEnd();
			targetPosition = editor.document.positionAt(endOffset - 1);
		}
	}

	// 情况 B: AST 解析失败，使用正则兼容不完整的 export 语句
	if (!targetPosition) {
		const lineIndex =
			exportInfo?.type === "regex"
				? exportInfo.lineIndex!
				: editor.document.positionAt(exportInfo?.node!.getStart()!).line;
		const lineText = editor.document.lineAt(lineIndex).text;

		// 匹配 export { 或 export type { 后的位置
		const match = lineText.match(/^(.*?export\s+(?:type\s+)?\{)(.*)/);
		if (match) {
			const afterBrace = match[2];
			const closingBraceIdx = afterBrace.indexOf("}");
			if (closingBraceIdx !== -1) {
				// 同行存在 }，定位到 } 左侧
				targetPosition = new vscode.Position(lineIndex, match[1].length + closingBraceIdx);
			} else {
				// 多行 export，} 不在当前行，定位到 { 右侧
				targetPosition = new vscode.Position(lineIndex, match[1].length);
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
