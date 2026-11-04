import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

test("UI worklets capture initialized dependencies rather than forward declarations", () => {
  const source = ts.createSourceFile(
    "game.ts",
    fs.readFileSync(new URL("../src/game.ts", import.meta.url), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const functions = new Map<string, ts.FunctionDeclaration>();
  for (const statement of source.statements)
    if (ts.isFunctionDeclaration(statement) && statement.name)
      functions.set(statement.name.text, statement);
  for (const [name, fn] of functions) {
    const directive = fn.body?.statements[0];
    if (
      !directive ||
      !ts.isExpressionStatement(directive) ||
      !ts.isStringLiteral(directive.expression) ||
      directive.expression.text !== "worklet"
    )
      continue;
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const dependency = functions.get(node.expression.text);
        if (dependency && dependency !== fn)
          assert.ok(
            dependency.pos < fn.pos,
            `${name} captures ${node.expression.text} before initialization on the UI runtime`,
          );
      }
      ts.forEachChild(node, visit);
    }
    visit(fn);
  }
});
