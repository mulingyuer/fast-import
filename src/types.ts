/*
 * @Author: mulingyuer
 * @Date: 2025-07-18 13:45:12
 * @LastEditTime: 2025-08-18 10:14:41
 * @LastEditors: mulingyuer
 * @Description: 类型声明
 * @FilePath: \fast-import\src\types.ts
 * 怎么可能会有bug！！！
 */
import * as vscode from "vscode";

/** 查找import引入的相关位置数据 */
export interface FindImportPositionData {
  /** import关键字数据 */
  import: {
    /** 所在行 */
    line: number;
    /** 所在下标 */
    index: [start: number, end: number];
  };
  /** 开始行数 */
  startLine: number;
  /** 结束行数 */
  endLine: number;
  /** 是否合法 */
  isValid: boolean;
  /** 校验信息 */
  validMessage: string;
}

/** 大括号查找类型 */
export type BraceSearchType = "import" | "destructuring";

/** 在指定起始行数中查找大括号位置信息参数 */
export interface FindBracePositionParams {
  editor: vscode.TextEditor;
  /** 起始行数 */
  startLine: number;
  /** 结束行数 */
  endLine: number;
  /** 查找类型 */
  type: BraceSearchType;
}

/** 在指定起始行数中查找大括号位置信息数据 */
export interface FindBracePositionData {
  /** 是否存在开始大括号 */
  isStartWithBrace: boolean;
  /** 开始大括号行数 */
  startBraceLine: number;
  /** 开始大括号位置 */
  startBraceIndex: number;
  /** 是否存在结束大括号 */
  isEndWithBrace: boolean;
  /** 结束大括号行数 */
  endBraceLine: number;
  /** 结束大括号位置 */
  endBraceIndex: number;
  /** 是否存在大括号 */
  isWithBrace: boolean;
}

/** 查找const/let/var解构赋值的相关位置数据 */
export interface FindDestructuringPositionData {
  /** const/let/var关键字数据 */
  keyword: {
    /** 关键字类型 */
    type: "const" | "let" | "var" | "";
    /** 所在行 */
    line: number;
    /** 所在下标 */
    index: [start: number, end: number];
  };
  /** 开始行数 */
  startLine: number;
  /** 结束行数 */
  endLine: number;
  /** 是否合法 */
  isValid: boolean;
  /** 校验信息 */
  validMessage: string;
}
