import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";

const assert = require('chai').assert;

const loop_cases = [{ expr: 'while (true), end;', desc: 'simplest loop, comma sep' },
{ expr: 'while (true); end;', desc: 'simplest loop, semi sep' },
{ expr: 'while (true)\n end;', desc: 'simplest loop, newline sep' },
{ expr: 'while true, end;', desc: 'simplest loop, comma sep, no parentheses' },
{ expr: 'while true; end;', desc: 'simplest loop, semi sep, no parens' },
{ expr: 'while true\n end;', desc: 'simplest loop, newline sep, no parens' }];

@suite("Parser while loops")
export class ParserWhile {
    @test("should parse while loops")
    while_loops() {
        for (let lcase of loop_cases) {
            console.log("      -> ", lcase.expr, "  ", lcase.desc);
            const y = parse(lcase.expr);
            const h = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
            assert.equal(h.statements.length, 1);
            const f = assertCast<AST.WhileStatement>(h.statements[0], AST.SyntaxKind.WhileStatement);
            assertCast<AST.Block>(f.body, AST.SyntaxKind.Block);
        }
    }
}
