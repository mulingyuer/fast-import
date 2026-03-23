/*
 * @Author: mulingyuer
 * @Date: 2026-03-19 21:10:45
 * @LastEditTime: 2026-03-23 19:24:48
 * @LastEditors: mulingyuer
 * @Description: AST 工具
 * @FilePath: \fast-import\src\utils\ast-tool.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import * as ts from "typescript";

/** AST 工具的配置选项 */
export interface AstToolOptions {
	/** 编辑器对象 */
	editor: vscode.TextEditor;
}

/** import info 信息对象 */
export interface ImportInfo {
	/** AST 节点对象 */
	node?: ts.ImportDeclaration;
	/** 行文本 */
	lineText?: string;
	/** 行索引 */
	lineIndex?: number;
	/** 信息类型 */
	type: "ast" | "regex";
}

/** 解构信息对象 */
export interface DestructuringInfo {
	/** AST 节点对象 */
	node: ts.BindingPattern;
	/** 信息类型 */
	type: "object" | "array";
}

export class AstTool {
	/** 编辑器对象 */
	private editor: vscode.TextEditor;
	/** 文档对象 */
	private document: vscode.TextDocument;
	/** AST 对应的源文件 */
	private sourceFile: ts.SourceFile;

	constructor(options: AstToolOptions) {
		const { editor } = options;

		this.editor = editor;
		this.document = editor.document;
		const text = this.document.getText(); // 获取整个文档文本

		// 生成 AST
		this.sourceFile = ts.createSourceFile(
			this.document.fileName,
			text,
			ts.ScriptTarget.Latest,
			true
		);
	}

	/** 获取当前光标所在或关联的 import 信息 */
	public getImportInfo(): ImportInfo | null {
		const position = this.editor.selection.active; // 获取光标位置 {line, character}
		const offset = this.document.offsetAt(position); // 将光标位置转换为文本偏移量，即从文档开头到光标位置的字符数

		// 判断是不是注释
		if (this.isPosInComment(position)) return null;

		// 1. 找到光标位置的最小 AST 节点
		const node = this.findNodeAtOffset(this.sourceFile, offset);

		// 2. 通过AST语法树判断是否在import语句范围内
		const findImportNode = node ? this.findParentNode(node, ts.isImportDeclaration) : void 0;

		// 如果 AST 成功找到 import 语句，直接返回相关信息
		if (findImportNode) return { node: findImportNode, type: "ast" };

		// 3. 兼容不完整的 import 语句，例如：import from "xxx"; 通过文本+正则判断
		let currentLine = position.line;
		const maxLookBack = Math.max(0, currentLine - 30); // 最多向上查找30行，避免性能问题

		while (currentLine >= maxLookBack) {
			const line = this.document.lineAt(currentLine);
			const text = line.text
				.trim()
				.replace(/\/\/.*$/, "")
				.trim();

			// 跳过空行和注释行
			if (!text) {
				currentLine--;
				continue;
			}

			// 当前行以 import 开头 (兼容 export import 语法)
			if (/^(export\s+)?import\b/.test(text)) {
				return {
					lineText: line.text,
					lineIndex: currentLine,
					type: "regex"
				};
			}

			//  失败条件 1：遇到了其他语句的开头关键字
			// (说明光标不在 import 里，而是越界跑到了上一条普通语句里)
			if (/^(const|let|var|function|class|type|interface|export)\b/.test(text)) {
				break;
			}

			// 失败条件 2：遇到了上一条语句的明确结束符（分号）
			// (前提是分号不在光标所在行，防止把上一行的正常代码当成 import 的一部分)
			if (currentLine !== position.line && text.endsWith(";")) {
				break;
			}

			currentLine--;
		}

		return null;
	}

	/** 获取当前光标所在或关联的解构赋值信息 */
	public getDestructuringInfo(): DestructuringInfo | null {
		const position = this.editor.selection.active;
		const offset = this.document.offsetAt(position);

		// 判断是不是注释
		if (this.isPosInComment(position)) return null;

		// 1. 尝试直接寻找光标下的节点
		const node = this.findNodeAtOffset(this.sourceFile, offset);
		if (node) {
			const bindingPattern = this.findParentNode(
				node,
				(n): n is ts.BindingPattern => ts.isObjectBindingPattern(n) || ts.isArrayBindingPattern(n)
			);
			if (bindingPattern) {
				return {
					node: bindingPattern,
					type: ts.isObjectBindingPattern(bindingPattern) ? "object" : "array"
				};
			}
		}

		// 2. 规则：只要光标在解构代码的行数内，都算是命中判断
		// 我们可以遍历 AST，寻找所有在当前行范围内的 BindingPattern
		const line = this.document.lineAt(position.line);
		const lineStart = this.document.offsetAt(line.range.start);
		const lineEnd = this.document.offsetAt(line.range.end);

		let result: DestructuringInfo | null = null;

		const walk = (n: ts.Node) => {
			if (result) return;

			if (ts.isObjectBindingPattern(n) || ts.isArrayBindingPattern(n)) {
				const start = n.getStart();
				const end = n.getEnd();

				// 判断节点是否与当前行有交集
				if (start <= lineEnd && end >= lineStart) {
					result = {
						node: n,
						type: ts.isObjectBindingPattern(n) ? "object" : "array"
					};
					return;
				}
			}

			n.forEachChild(walk);
		};

		walk(this.sourceFile);

		return result;
	}

	/** 根据偏移量查找最小的 AST 节点 */
	private findNodeAtOffset(node: ts.Node, offset: number): ts.Node | undefined {
		if (offset < node.getStart() || offset > node.getEnd()) {
			return undefined;
		}

		let result: ts.Node | undefined;
		node.forEachChild((child) => {
			const childResult = this.findNodeAtOffset(child, offset);
			if (childResult) {
				result = childResult;
			}
		});

		return result || node;
	}

	/** 向上查找符合条件的父节点 */
	private findParentNode<T extends ts.Node>(
		node: ts.Node,
		predicate: (node: ts.Node) => node is T
	): T | undefined {
		let current: ts.Node | undefined = node;
		while (current) {
			if (predicate(current)) {
				return current as T;
			}
			current = current.parent;
		}
		return undefined;
	}

	/** 判断光标位置是否在注释中 */
	private isPosInComment(position: vscode.Position): boolean {
		const offset = this.document.offsetAt(position);
		const text = this.document.getText();

		const scanner = ts.createScanner(
			ts.ScriptTarget.Latest,
			false, // skipTrivia = false (我们需要读取注释)
			ts.LanguageVariant.Standard,
			text
		);

		let token = scanner.scan();
		while (token !== ts.SyntaxKind.EndOfFileToken) {
			// getTokenPos() 返回当前 token 的起始偏移量（包含前面的空白）
			// getTextPos() 返回当前扫描器所在的位置
			const start = scanner.getTokenPos();
			const end = scanner.getTextPos();

			// 如果光标在当前 token 范围内
			if (offset >= start && offset < end) {
				return (
					token === ts.SyntaxKind.SingleLineCommentTrivia ||
					token === ts.SyntaxKind.MultiLineCommentTrivia
				);
			}

			// 性能优化：如果当前 token 已经超过了光标位置，说明光标不在注释里，直接跳出
			if (start > offset) {
				break;
			}

			token = scanner.scan();
		}
		return false;
	}
}
