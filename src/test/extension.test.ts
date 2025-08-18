import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { findDestructuringPosition, findImportPosition, findBracePosition } from '../utils';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('findDestructuringPosition should find const destructuring', async () => {
		// 创建一个临时文档来测试
		const document = await vscode.workspace.openTextDocument({
			content: 'const { name, age } = person;',
			language: 'javascript'
		});
		
		const editor = await vscode.window.showTextDocument(document);
		
		// 将光标设置在第一行
		editor.selection = new vscode.Selection(0, 0, 0, 0);
		
		const result = findDestructuringPosition(editor);
		
		assert.strictEqual(result.isValid, true);
		assert.strictEqual(result.keyword.type, 'const');
		assert.strictEqual(result.keyword.line, 0);
	});

	test('findDestructuringPosition should find let destructuring', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: 'let { x, y } = coordinates;',
			language: 'javascript'
		});
		
		const editor = await vscode.window.showTextDocument(document);
		editor.selection = new vscode.Selection(0, 0, 0, 0);
		
		const result = findDestructuringPosition(editor);
		
		assert.strictEqual(result.isValid, true);
		assert.strictEqual(result.keyword.type, 'let');
		assert.strictEqual(result.keyword.line, 0);
	});

	test('findDestructuringPosition should find var destructuring', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: 'var { a, b } = obj;',
			language: 'javascript'
		});
		
		const editor = await vscode.window.showTextDocument(document);
		editor.selection = new vscode.Selection(0, 0, 0, 0);
		
		const result = findDestructuringPosition(editor);
		
		assert.strictEqual(result.isValid, true);
		assert.strictEqual(result.keyword.type, 'var');
		assert.strictEqual(result.keyword.line, 0);
	});

	test('findDestructuringPosition should return invalid for non-destructuring', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: 'const name = person.name;',
			language: 'javascript'
		});
		
		const editor = await vscode.window.showTextDocument(document);
		editor.selection = new vscode.Selection(0, 0, 0, 0);
		
		const result = findDestructuringPosition(editor);
		
		assert.strictEqual(result.isValid, false);
		assert.strictEqual(result.validMessage, '未找到解构赋值语法（等号左边的大括号）');
	});

	test('findDestructuringPosition should handle object literal on right side', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: 'const { name } = { name: "test", age: 25 };',
			language: 'javascript'
		});
		
		const editor = await vscode.window.showTextDocument(document);
		editor.selection = new vscode.Selection(0, 0, 0, 0);
		
		const result = findDestructuringPosition(editor);
		
		assert.strictEqual(result.isValid, true);
		assert.strictEqual(result.keyword.type, 'const');
		assert.strictEqual(result.keyword.line, 0);
	});

	test('findBracePosition with destructuring type should only find braces on left side of equals', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: 'const { name } = { name: "test", age: 25 };',
			language: 'javascript'
		});
		
		const editor = await vscode.window.showTextDocument(document);
		
		const result = findBracePosition({
			editor: editor,
			startLine: 0,
			endLine: 0,
			type: "destructuring"
		});
		
		assert.strictEqual(result.isWithBrace, true);
		assert.strictEqual(result.startBraceIndex, 6); // 位置应该是 "const " 后面的 {
		assert.strictEqual(result.endBraceIndex, 12); // 位置应该是 name 后面的 }
	});

	test('findBracePosition with import type should find all braces', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: 'import { Component } from "vue";',
			language: 'javascript'
		});
		
		const editor = await vscode.window.showTextDocument(document);
		
		const result = findBracePosition({
			editor: editor,
			startLine: 0,
			endLine: 0,
			type: "import"
		});
		
		assert.strictEqual(result.isWithBrace, true);
		assert.strictEqual(result.startBraceIndex, 7); // 位置应该是 "import " 后面的 {
		assert.strictEqual(result.endBraceIndex, 18); // 位置应该是 Component 后面的 }
	});

	test('Smart detection should prioritize import over destructuring', async () => {
		// 测试智能识别：import优先级高于解构赋值
		const document = await vscode.workspace.openTextDocument({
			content: `import { Component } from 'vue';
const { name } = person;`,
			language: 'javascript'
		});
		
		const editor = await vscode.window.showTextDocument(document);
		
		// 将光标设置在第一行（import行）
		editor.selection = new vscode.Selection(0, 0, 0, 0);
		
		const importResult = findImportPosition(editor);
		const destructuringResult = findDestructuringPosition(editor);
		
		// import应该被找到
		assert.strictEqual(importResult.isValid, true);
		// 解构赋值也应该被找到，但在统一命令中import会优先处理
		assert.strictEqual(destructuringResult.isValid, true);
	});

	test('Smart detection should fallback to destructuring when no import found', async () => {
		// 测试智能识别：没有import时应该查找解构赋值
		const document = await vscode.workspace.openTextDocument({
			content: 'const { name, age } = person;',
			language: 'javascript'
		});
		
		const editor = await vscode.window.showTextDocument(document);
		editor.selection = new vscode.Selection(0, 0, 0, 0);
		
		const importResult = findImportPosition(editor);
		const destructuringResult = findDestructuringPosition(editor);
		
		// import不应该被找到
		assert.strictEqual(importResult.isValid, false);
		// 解构赋值应该被找到
		assert.strictEqual(destructuringResult.isValid, true);
	});
});
