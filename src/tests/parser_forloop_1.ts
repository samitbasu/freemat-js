import { suite, test } from "mocha-typescript";
import { parse, assertCast } from "./test_utils";
import * as AST from "../ast";

const assert = require("chai").assert;

const loop_cases = [{ expr: 'for i=1:10; a(i) = i; end;', desc: 'simple colon' },
{ expr: 'for i=1:1:10; a(i) = i; end;', desc: 'double colon' },
{ expr: 'for i=A; a(i) = i; end;', desc: 'matrix columns' },
{ expr: 'for (i=1:10); a(i) = i; end;', desc: 'parentheses + simple colon' },
{ expr: 'for i=1:10\n a(i) = i; end;', desc: 'simple colon' },
{ expr: 'for i=1:1:10\n a(i) = i; end;', desc: 'double colon' },
{ expr: 'for i=A\n a(i) = i; end;', desc: 'matrix columns' },
{ expr: 'for (i=1:10)\n a(i) = i; end;', desc: 'parentheses + simple colon' },
{ expr: 'for (i=1:10)\n end;', desc: 'parentheses + simple colon, empty block' }];

@suite("Parser for loops")
export class ForLoopTests {
    @test("should parse for loop with different index expressions")
    forloop_test() {
        for (let lcase of loop_cases) {
            const expr = lcase.expr;
            console.log("      -> ", expr);
            const y = parse(expr);
            const z = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
            assert.equal(z.statements.length, 1);
            const g = assertCast<AST.ForStatement>(z.statements[0], AST.SyntaxKind.ForStatement);
            assertCast<AST.Block>(g.body, AST.SyntaxKind.Block);
            const x = assertCast<AST.ForExpression>(g.expression, AST.SyntaxKind.ForExpression);
            assert.equal(x.identifier.name, 'i');
        }
    }
}
