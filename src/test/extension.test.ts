import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("Extension Test Suite", () => {
	vscode.window.showInformationMessage("Start all tests.");

	// 辅助函数：创建一个临时文件并打开编辑器
	async function createTestEditor(content: string, language: string = "typescript") {
		const document = await vscode.workspace.openTextDocument({
			content,
			language
		});
		return await vscode.window.showTextDocument(document);
	}

	// 辅助函数：等待一段时间，确保命令执行完成（如果涉及异步操作）
	async function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	test("Command: moveToBraces - Basic Import", async () => {
		const content = "import { Component } from 'vue';";
		const editor = await createTestEditor(content);

		// 将光标设置在行首
		editor.selection = new vscode.Selection(0, 0, 0, 0);

		// 执行命令
		await vscode.commands.executeCommand("fast-import.moveToBraces");

		// 验证光标位置：应该在 { 之后，或者在 } 之前（取决于实现逻辑，通常是定位到内部）
		// 根据插件逻辑，它会定位到 } 之前
		const position = editor.selection.active;
		assert.strictEqual(position.line, 0);
		assert.strictEqual(position.character, 18); // "import { Component " 之后是 }
	});

	test("Command: moveToBraces - Destructuring Assignment", async () => {
		const content = "const { name, age } = person;";
		const editor = await createTestEditor(content);

		editor.selection = new vscode.Selection(0, 0, 0, 0);
		await vscode.commands.executeCommand("fast-import.moveToBraces");

		const position = editor.selection.active;
		assert.strictEqual(position.line, 0);
		assert.strictEqual(position.character, 19); // "const { name, age " 之后是 }
	});

	test("Command: moveToBraces - Multi-line Import", async () => {
		const content = `import {
    computed,
    watch,
    onMounted
} from 'vue';`;
		const editor = await createTestEditor(content);

		// 光标在第一行
		editor.selection = new vscode.Selection(0, 0, 0, 0);
		await vscode.commands.executeCommand("fast-import.moveToBraces");

		const position = editor.selection.active;
		assert.strictEqual(position.line, 4); // 最后一行
		assert.strictEqual(position.character, 0); // } 之前
	});

	test("Command: outToBraces - From inside braces", async () => {
		const content = "const { name } = person;";
		const editor = await createTestEditor(content);

		// 将光标设置在 { name | }
		editor.selection = new vscode.Selection(0, 10, 0, 10);

		await vscode.commands.executeCommand("fast-import.outToBraces");

		// 验证光标位置：应该在语句末尾
		const position = editor.selection.active;
		assert.strictEqual(position.line, 0);
		assert.strictEqual(position.character, content.length);
	});

	test("Command: outToBraces - Multi-line statement", async () => {
		const content = `const {
    name,
    age
} = person;`;
		const editor = await createTestEditor(content);

		// 光标在中间某行
		editor.selection = new vscode.Selection(1, 4, 1, 4);

		await vscode.commands.executeCommand("fast-import.outToBraces");

		// 验证光标位置：应该在最后一行末尾
		const position = editor.selection.active;
		assert.strictEqual(position.line, 3);
		assert.strictEqual(position.character, 11); // "} = person;" 的长度
	});

	test("Configuration: fast-import.enableMoveToBraces", async () => {
		const config = vscode.workspace.getConfiguration("fast-import");
		await config.update("enableMoveToBraces", false, vscode.ConfigurationTarget.Global);

		try {
			const content = "import { Test } from 'test';";
			const editor = await createTestEditor(content);
			editor.selection = new vscode.Selection(0, 0, 0, 0);

			await vscode.commands.executeCommand("fast-import.moveToBraces");

			// 由于禁用了，光标不应该移动
			const position = editor.selection.active;
			assert.strictEqual(position.character, 0);
		} finally {
			// 恢复配置
			await config.update("enableMoveToBraces", true, vscode.ConfigurationTarget.Global);
		}
	});

	test("Command: moveToBraces - Nested Destructuring", async () => {
		const content = "const { data: { list, total } } = res;";
		const editor = await createTestEditor(content);

		editor.selection = new vscode.Selection(0, 0, 0, 0);
		await vscode.commands.executeCommand("fast-import.moveToBraces");

		// 应该定位到最外层的 } 之前
		const position = editor.selection.active;
		assert.strictEqual(position.line, 0);
		assert.strictEqual(position.character, 31); // "const { data: { list, total } " 之后是 }
	});

	test("Command: moveToBraces - Prefer inner variable declaration", async () => {
		const content = `const a = async ()=>{
	const b = test()
}`;
		const editor = await createTestEditor(content);

		// 光标在内层变量声明行
		editor.selection = new vscode.Selection(1, 16, 1, 16);
		await vscode.commands.executeCommand("fast-import.moveToBraces");

		const expected = `const a = async ()=>{
	const { } = test()
}`;
		assert.strictEqual(editor.document.getText(), expected);

		const position = editor.selection.active;
		assert.strictEqual(position.line, 1);
		assert.strictEqual(position.character, 8); // const { | } = test()
	});
});
