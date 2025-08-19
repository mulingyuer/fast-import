/*
 * @Author: mulingyuer
 * @Date: 2025-07-18 14:04:05
 * @LastEditTime: 2025-08-19 17:04:11
 * @LastEditors: mulingyuer
 * @Description: 工具方法
 * @FilePath: \fast-import\src\utils.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";
import type {
  FindBracePositionData,
  FindBracePositionParams,
  FindImportPositionData,
  FindDestructuringPositionData,
  BraceSearchType,
} from "./types";

/** 查找import引入的相关位置数据 */
export function findImportPosition(
  editor: vscode.TextEditor
): FindImportPositionData {
  const data: FindImportPositionData = {
    import: {
      line: -1,
      index: [-1, -1],
    },
    startLine: -1,
    endLine: -1,
    isValid: true,
    validMessage: "",
  };

  const document = editor.document;
  const selection = editor.selection;
  const cursorLine = selection.active.line; // 光标所在行

  // 向上查找import关键字
  const oneImportSearchLimit = Math.max(0, cursorLine - 20);
  for (let i = cursorLine; i >= oneImportSearchLimit; i--) {
    const currentLineText = document.lineAt(i).text;
    // 找到import关键字所在行
    if (currentLineText.includes("import")) {
      data.import.line = i;
      data.startLine = i;

      // 查找import关键字的具体位置
      // TODO: 我们也可以通过/\bimport\b/来实现单词边界查找，但是这样 importfrom 这种引入就不会被匹配到
      const importMatch = /import/.exec(currentLineText);
      if (importMatch?.index !== undefined) {
        const startIndex = importMatch.index;
        const endIndex = startIndex + "import".length;
        data.import.index = [startIndex, endIndex];
      }

      break; // 找到import关键字，退出循环
    }
  }

  if (data.import.line === -1) {
    data.isValid = false;
    data.validMessage = "未找到import关键字";
    return data;
  }

  // 查找结束位置
  const importEndLimit = Math.min(data.startLine + 20, document.lineCount);
  for (let i = data.startLine; i < importEndLimit; i++) {
    const currentLineText = document.lineAt(i).text;
    if (/from\s+(['"])[^'"]+\1/.test(currentLineText)) {
      data.endLine = i;
      break;
    }
  }

  // 从结束位置向上再次查找import关键字，以防用户输入了 import 但是没有 from "xxx"
  const twoImportSearchLimit = Math.min(data.startLine, data.endLine - 20);
  for (let i = data.endLine; i >= twoImportSearchLimit; i--) {
    const currentLineText = document.lineAt(i).text;
    if (currentLineText.includes("import")) {
      if (data.startLine !== i) {
        data.isValid = false;
        data.validMessage = "import引入格式不正确，请检查！";
      }
      break; // 找到import关键字，退出循环
    }
  }

  // 如果光标触发的位置不在起始点中间，则认为是无效的
  if (cursorLine < data.startLine || cursorLine > data.endLine) {
    data.isValid = false;
    data.validMessage = "光标位置不在import引入范围内！";
  }

  return data;
}

/** 在指定起始行数中查找大括号位置信息 */
export function findBracePosition(
  params: FindBracePositionParams
): FindBracePositionData {
  const { editor, startLine, endLine, type } = params;
  const document = editor.document;
  const data: FindBracePositionData = {
    isStartWithBrace: false,
    startBraceLine: 0,
    startBraceIndex: -1,
    isEndWithBrace: false,
    endBraceLine: 0,
    endBraceIndex: -1,
    isWithBrace: false,
  };

  for (let i = startLine; i <= endLine; i++) {
    if (data.isStartWithBrace && data.isEndWithBrace) {
      break;
    }

    const currentLineText = document.lineAt(i).text;
    let searchText = currentLineText;

    // 如果是解构赋值类型，只在等号左边查找大括号
    if (type === "destructuring") {
      const equalIndex = currentLineText.indexOf("=");
      searchText =
        equalIndex !== -1
          ? currentLineText.substring(0, equalIndex)
          : currentLineText;
    }

    const startBraceIndex = searchText.indexOf("{");
    const endBraceIndex = searchText.lastIndexOf("}");

    if (startBraceIndex !== -1 && !data.isStartWithBrace) {
      data.isStartWithBrace = true;
      data.startBraceLine = i;
      data.startBraceIndex = startBraceIndex;
    }

    if (endBraceIndex !== -1 && !data.isEndWithBrace) {
      data.isEndWithBrace = true;
      data.endBraceLine = i;
      data.endBraceIndex = endBraceIndex;
    }
  }

  data.isWithBrace = data.isStartWithBrace && data.isEndWithBrace;

  return data;
}

/** 查找const、let或var解构赋值的相关位置数据 */
export function findDestructuringPosition(
  editor: vscode.TextEditor
): FindDestructuringPositionData {
  const data: FindDestructuringPositionData = {
    keyword: {
      type: "",
      line: -1,
      index: [-1, -1],
    },
    startLine: -1,
    endLine: -1,
    isValid: true,
    validMessage: "",
  };

  const document = editor.document;
  const selection = editor.selection;
  const cursorLine = selection.active.line; // 光标所在行

  // 1. 向上查找const、let或var关键字
  const searchLimit = Math.max(0, cursorLine - 20);
  for (let i = cursorLine; i >= searchLimit; i--) {
    const currentLineText = document.lineAt(i).text;
    const match = /\b(const|let|var)\b/.exec(currentLineText);

    if (match) {
      const keyword = match[1] as "const" | "let" | "var";
      data.keyword.type = keyword;
      data.keyword.line = i;
      data.startLine = i;
      const startIndex = match.index;
      const endIndex = startIndex + keyword.length;
      data.keyword.index = [startIndex, endIndex];
      break;
    }
  }

  if (data.keyword.line === -1) {
    data.isValid = false;
    data.validMessage = "未找到const、let或var关键字";
    return data;
  }

  // 2. 查找结束位置（使用括号平衡检查）
  let openParen = 0; // 圆括号 ( )
  let openBrace = 0; // 花括号 { }
  let openBracket = 0; // 方括号 [ ]
  let assignmentOperatorFound = false;

  const endLimit = Math.min(data.startLine + 20, document.lineCount);
  for (let i = data.startLine; i < endLimit; i++) {
    const currentLineText = document.lineAt(i).text;
    let textToScan = currentLineText;

    // 在起始行，我们只关心等号右边的括号平衡
    // 因为等号左边的 { } 是解构语法，不是需要配对的块
    if (i === data.startLine) {
      const equalSignIndex = currentLineText.indexOf("=");
      if (equalSignIndex !== -1) {
        assignmentOperatorFound = true;
        textToScan = currentLineText.substring(equalSignIndex + 1);
      }
    } else if (currentLineText.includes("=")) {
      assignmentOperatorFound = true;
    }

    // 扫描当前行，更新括号计数
    // 注意：这个简单实现未处理字符串或注释中的括号，但在多数格式化良好的代码中已足够
    for (const char of textToScan) {
      switch (char) {
        case "(":
          openParen++;
          break;
        case ")":
          openParen--;
          break;
        case "{":
          openBrace++;
          break;
        case "}":
          openBrace--;
          break;
        case "[":
          openBracket++;
          break;
        case "]":
          openBracket--;
          break;
      }
    }

    // 检查语句是否结束
    // 条件：找到等号后，所有括号都已闭合，并且行尾是分号或最后一个括号
    if (
      assignmentOperatorFound &&
      openParen === 0 &&
      openBrace === 0 &&
      openBracket === 0
    ) {
      data.endLine = i;
      // 如果以分号结尾，那么这绝对是语句的末尾，可以停止搜索
      if (currentLineText.trim().endsWith(";")) {
        break;
      }
      // 如果没有分号，我们暂时认为这里是结尾，但继续向下看，以防有链式调用等情况
      // e.g. const a = { b: 1 }
      // .c;
    } else {
      // 如果未平衡，则将当前行暂定为结束行，继续向下查找
      data.endLine = i;
    }
  }

  // 如果循环结束仍未找到平衡点（可能代码有误或超出搜索范围），则标记为无效
  if (data.endLine === -1) {
    data.isValid = false;
    data.validMessage = "未能确定解构语句的结束位置。";
    return data;
  }

  // 3. 验证是否为解构赋值 (逻辑可以简化)
  let hasDestructuring = false;
  // 只需要检查起始行等号左边是否有大括号即可
  const startLineText = document.lineAt(data.startLine).text;
  const equalIndex = startLineText.indexOf("=");
  if (equalIndex !== -1) {
    const leftPart = startLineText.substring(0, equalIndex);
    if (leftPart.includes("{") && leftPart.includes("}")) {
      hasDestructuring = true;
    }
  }

  if (!hasDestructuring) {
    data.isValid = false;
    data.validMessage = "未找到解构赋值语法（等号左边的大括号）";
    return data;
  }

  // 4. 如果光标位置不在范围内，则认为是无效的 (逻辑不变)
  if (cursorLine < data.startLine || cursorLine > data.endLine) {
    data.isValid = false;
    data.validMessage = "光标位置不在const/let解构赋值范围内！";
    return data;
  }

  return data;
}
