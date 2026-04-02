/*
 * @Author: mulingyuer
 * @Date: 2026-03-19 19:52:34
 * @LastEditTime: 2026-03-24 20:53:28
 * @LastEditors: mulingyuer
 * @Description: 移动光标的快捷键
 * @FilePath: \fast-import\src\command\move-to-braces\index.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import { AstTool } from "../../utils/ast-tool";
import { moveCursorToImport } from "./move-cursor-import";
import { moveCursorToDestructuring } from "./move-cursor-destructuring";
import { transformToDestructuring } from "./transform-to-destructuring";

// export interface MoveToBracesOptions {}
const CONFIG_NAMESPACE = "fast-import";
const ENABLE_TRANSFORM_TO_DESTRUCTURING_CONFIG_KEY = "enableTransformToDestructuring";

export function createMoveToBracesCommand() {
	const disposable = vscode.commands.registerCommand("fast-import.moveToBraces", async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const astTool = new AstTool({ editor });

		// 存在import
		const importInfo = astTool.getImportInfo();
		if (importInfo) {
			moveCursorToImport({ importInfo, editor });
			return;
		}

		// 光标在解构赋值的范围内
		const destructuringInfo = astTool.getDestructuringInfo();
		if (destructuringInfo) {
			moveCursorToDestructuring({ destructuringInfo, editor });
			return;
		}

		// 光标在简单变量声明上，尝试转换为解构赋值
		const variableInfo = astTool.getVariableDeclarationInfo();
		if (variableInfo) {
			const enableTransformToDestructuring = vscode.workspace
				.getConfiguration(CONFIG_NAMESPACE)
				.get<boolean>(ENABLE_TRANSFORM_TO_DESTRUCTURING_CONFIG_KEY, true);

			if (!enableTransformToDestructuring) {
				vscode.window.showInformationMessage(
					vscode.l10n.t(
						"Variable declaration to destructuring conversion is disabled. You can enable it in settings."
					)
				);
				return;
			}

			transformToDestructuring({ variableInfo, astTool, editor });
			return;
		}

		vscode.window.showInformationMessage(vscode.l10n.t("Cursor is not inside an import, destructuring assignment, or variable declaration."));
	});

	return disposable;
}
