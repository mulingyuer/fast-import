import * as ts from 'typescript';

const code1 = `import a from "a";`;
const code2 = `import from "a";`;
const code3 = `import { } from "a";`;
const code4 = `import a, { } from "a";`;
const code5 = `import {
  b
} from "a";`;

function printAst(code: string) {
  const sf = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
  const node = sf.statements[0] as ts.ImportDeclaration;
  console.log('---');
  console.log('Code:', code);
  if (node.importClause) {
    console.log('Has importClause');
    if (node.importClause.name) {
      console.log('Default:', node.importClause.name.getText(), 'end:', node.importClause.name.getEnd());
    }
    if (node.importClause.namedBindings) {
      console.log('NamedBindings:', ts.isNamedImports(node.importClause.namedBindings));
      console.log('NamedBindings end:', node.importClause.namedBindings.getEnd());
    }
  } else {
    console.log('No importClause');
    console.log('Node start:', node.getStart(), 'end:', node.getEnd());
  }
}

printAst(code1);
printAst(code2);
printAst(code3);
printAst(code4);
printAst(code5);
