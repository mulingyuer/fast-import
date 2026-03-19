/*
 * @Author: mulingyuer
 * @Date: 2026-03-19 19:54:49
 * @LastEditTime: 2026-03-19 19:54:49
 * @LastEditors: mulingyuer
 * @Description: 快速退出 (Import/解构赋值)
 * @FilePath: \fast-import\src\command\out-to-braces\index.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";

export function createOutToBracesCommand() {
	const disposable = vscode.commands.registerCommand("fast-import.outToBraces", async () => {
		console.log("执行了快速退出命令");
	});

	return disposable;
}
