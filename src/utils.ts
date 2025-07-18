/*
 * @Author: mulingyuer
 * @Date: 2025-07-18 14:04:05
 * @LastEditTime: 2025-07-18 15:11:30
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
  const { editor, startLine, endLine } = params;
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
    const startBraceIndex = currentLineText.indexOf("{");
    const endBraceIndex = currentLineText.lastIndexOf("}");

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
