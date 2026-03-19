import * as vscode from "vscode";
import { createMoveToBracesCommand } from "./command/move-to-braces";
import { createOutToBracesCommand } from "./command/out-to-braces";

export async function activate(context: vscode.ExtensionContext) {
	const moveToBracesCommand = createMoveToBracesCommand();
	const outToBracesCommand = createOutToBracesCommand();

	context.subscriptions.push(moveToBracesCommand, outToBracesCommand);
}

export function deactivate() {
	// 暂时没有任何操作
}
