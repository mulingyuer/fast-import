/*
 * @Author: mulingyuer
 * @Date: 2026-03-19 21:10:45
 * @LastEditTime: 2026-03-25 15:29:32
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
	/** 父级声明（变量声明或参数） */
	parentDeclaration?: ts.VariableDeclaration | ts.ParameterDeclaration;
}

/** 变量声明信息对象 */
export interface VariableDeclarationInfo {
	/** AST 节点对象 */
	node: ts.VariableDeclaration;
	/** 标识符 */
	identifier: ts.Identifier;
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

		// 1. 精确查找：找到光标位置的最小 AST 节点，向上找 ImportDeclaration
		const node =
			this.findNodeAtOffset(this.sourceFile, offset) ??
			this.findNodeAtOffset(this.sourceFile, Math.max(0, offset - 1));
		const findImportNode = node ? this.findParentNode(node, ts.isImportDeclaration) : void 0;

		// 如果 AST 精确命中，直接返回
		if (findImportNode) return { node: findImportNode, type: "ast" };

		// 2. 行范围扫描：只要光标在 import 语句所在的行内，就算命中
		// （处理光标在分号之后、行末空格等超出节点 getEnd() 的情况）
		const curLine = position.line;
		const lineStart = this.document.offsetAt(this.document.lineAt(curLine).range.start);
		const lineEnd = this.document.offsetAt(this.document.lineAt(curLine).range.end);

		let foundByLine: ts.ImportDeclaration | undefined;
		const walkForImport = (n: ts.Node) => {
			if (foundByLine) return;
			if (ts.isImportDeclaration(n)) {
				// 节点与当前行有交集
				if (n.getStart() <= lineEnd && n.getEnd() >= lineStart) {
					foundByLine = n;
					return;
				}
			}
			n.forEachChild(walkForImport);
		};
		walkForImport(this.sourceFile);

		if (foundByLine) return { node: foundByLine, type: "ast" };

		// 3. 兼容不完整的 import 语句，例如：import from "xxx"; 通过文本+正则判断
		// 向上逐行查找，但遇到空行立即停止——空行是语句间的自然分隔符，
		// 这样既支持多行破损 import 的内部換行，也不会跨越空行误命中上方的 import。
		let currentLine = position.line;
		const maxLookBack = Math.max(0, currentLine - 30);

		while (currentLine >= maxLookBack) {
			const line = this.document.lineAt(currentLine);
			const text = line.text
				.trim()
				.replace(/\/\/.*$/, "")
				.trim();

			// 遇到空行立即停止，不然容易误命中
			if (!text) break;

			// 当前行以 import 开头 (兼容 export import 语法)
			if (/^(export\s+)?import\b/.test(text)) {
				return {
					lineText: line.text,
					lineIndex: currentLine,
					type: "regex"
				};
			}

			// 失败条件 1：遇到了其他语句的开头关键字
			if (/^(const|let|var|function|class|type|interface|export)\b/.test(text)) {
				break;
			}

			// 失败条件 2：非光标所在行遇到了明确的语句结束符（分号）
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
				const parentDeclaration = this.findParentNode(
					bindingPattern,
					(n): n is ts.VariableDeclaration | ts.ParameterDeclaration =>
						ts.isVariableDeclaration(n) || ts.isParameter(n)
				);
				return {
					node: bindingPattern,
					type: ts.isObjectBindingPattern(bindingPattern) ? "object" : "array",
					parentDeclaration
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

			// 1. 直接是解构模式
			if (ts.isObjectBindingPattern(n) || ts.isArrayBindingPattern(n)) {
				const start = n.getStart();
				const end = n.getEnd();

				// 判断节点是否与当前行有交集
				if (start <= lineEnd && end >= lineStart) {
					const parentDeclaration = this.findParentNode(
						n,
						(pn): pn is ts.VariableDeclaration | ts.ParameterDeclaration =>
							ts.isVariableDeclaration(pn) || ts.isParameter(pn)
					);
					result = {
						node: n,
						type: ts.isObjectBindingPattern(n) ? "object" : "array",
						parentDeclaration
					};
					return;
				}
			}

			// 2. 变量声明或参数，其名称是解构模式 (兼容多行)
			if (ts.isVariableDeclaration(n) || ts.isParameter(n)) {
				if (ts.isObjectBindingPattern(n.name) || ts.isArrayBindingPattern(n.name)) {
					const start = n.getStart();
					const end = n.getEnd();

					// 判断节点是否与当前行有交集
					if (start <= lineEnd && end >= lineStart) {
						result = {
							node: n.name,
							type: ts.isObjectBindingPattern(n.name) ? "object" : "array",
							parentDeclaration: n
						};
						return;
					}
				}
			}

			n.forEachChild(walk);
		};

		walk(this.sourceFile);

		return result;
	}

	/** 获取当前光标所在的变量声明信息（简单标识符） */
	public getVariableDeclarationInfo(): VariableDeclarationInfo | null {
		const position = this.editor.selection.active;
		const offset = this.document.offsetAt(position);

		// 判断是不是注释
		if (this.isPosInComment(position)) return null;

		// 1. 找到光标位置的最小 AST 节点
		const node =
			this.findNodeAtOffset(this.sourceFile, offset) ??
			this.findNodeAtOffset(this.sourceFile, Math.max(0, offset - 1));
		if (node) {
			// 向上查找 VariableDeclaration
			const varDecl = this.findParentNode(node, ts.isVariableDeclaration);
			// 判断是不是简单标识符（不是解构赋值）
			if (varDecl && ts.isIdentifier(varDecl.name)) {
				// 仅当光标在变量名上时才直接命中，避免函数体内误命中外层变量声明
				const nameStart = varDecl.name.getStart();
				const nameEnd = varDecl.name.getEnd();
				if (offset < nameStart || offset >= nameEnd) {
					// 不在变量名上，交给后续行级规则处理
				} else {
					return {
						node: varDecl,
						identifier: varDecl.name
					};
				}
			}
		}

		// 2. 规则：只要光标在变量声明代码的行数内，都算是命中判断
		const line = this.document.lineAt(position.line);
		const lineStart = this.document.offsetAt(line.range.start);
		const lineEnd = this.document.offsetAt(line.range.end);

		let result: VariableDeclarationInfo | null = null;
		const candidates: VariableDeclarationInfo[] = [];

		const walk = (n: ts.Node) => {
			if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) {
				const start = n.getStart();
				const end = n.getEnd();

				// 判断节点是否与当前行有交集
				if (start <= lineEnd && end >= lineStart) {
					candidates.push({
						node: n,
						identifier: n.name
					});
				}
			}

			n.forEachChild(walk);
		};

		walk(this.sourceFile);

		if (candidates.length > 0) {
			// 取范围最小的声明，避免命中外层变量（例如函数表达式包裹的 const 声明）
			result = candidates.reduce((best, current) => {
				const bestSpan = best.node.getEnd() - best.node.getStart();
				const currentSpan = current.node.getEnd() - current.node.getStart();
				return currentSpan < bestSpan ? current : best;
			});
		}

		return result;
	}

	/** 获取当前光标所在的语句 */
	public getStatementAtCursor(): ts.Statement | undefined {
		const position = this.editor.selection.active;
		const offset = this.document.offsetAt(position);

		// 判断是不是注释
		if (this.isPosInComment(position)) return undefined;

		const node = this.findNodeAtOffset(this.sourceFile, offset);
		if (node) {
			return this.findParentNode(
				node,
				(n): n is ts.Statement => ts.isStatement(n) && !ts.isSourceFile(n)
			);
		}
		return undefined;
	}

	/** 获取表达式的类型（对象还是数组） */
	public async getTypeOfExpression(node: ts.Node): Promise<"object" | "array"> {
		const start = node.getStart();
		const position = this.document.positionAt(start);

		// 调用 VS Code 的 Hover Provider
		const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
			"vscode.executeHoverProvider",
			this.document.uri,
			position
		);

		if (hovers && hovers.length > 0) {
			for (const hover of hovers) {
				for (const content of hover.contents) {
					let text = "";
					if (typeof content === "string") {
						text = content;
					} else if (content instanceof vscode.MarkdownString) {
						text = content.value;
					}

					// 检查是否包含数组特征： [] 或 Array<
					if (text.includes("[]") || text.includes("Array<")) {
						return "array";
					}
				}
			}
		}

		// 默认返回对象，因为对象更常见
		return "object";
	}

	/** 根据偏移量查找最小的 AST 节点 */
	public findNodeAtOffset(node: ts.Node, offset: number): ts.Node | undefined {
		if (offset < node.getStart() || offset >= node.getEnd()) {
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
	public findParentNode<T extends ts.Node>(
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
