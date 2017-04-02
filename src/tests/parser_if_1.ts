import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";

const assert = require('chai').assert;

const if_cases = [{ expr: 'if (1), end;', desc: 'simplest if, comma sep' },
{ expr: 'if (1); end;', desc: 'simplest if, semi sep' },
{ expr: 'if (1)\n end;', desc: 'simplest if, newline sep' },
{ expr: 'if 1, end;', desc: 'simplest if, comma sep, no parentheses' },
{ expr: 'if 1; end;', desc: 'simplest if, semi sep, no parens' },
{ expr: 'if 1\n end;', desc: 'simplest if, newline sep, no parens' },
{ expr: 'if 1; else, end;', desc: 'simplest if with else' },
{ expr: 'if 1, elseif 0, else, end;', desc: 'simplest if with elseif and else' },
{ expr: 'if 1, elseif 0, end;', desc: 'simplest if with elseif and no else' },
{ expr: 'if 1, elseif 1, elseif 0, else, end;', desc: 'if with multiple elseifs and else' }];


function validateIfStatement(y: AST.Node): AST.IfStatement {
    const b = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
    assert.equal(b.statements.length, 1);
    const x = assertCast<AST.IfStatement>(b.statements[0], AST.SyntaxKind.IfStatement);
    return x;
}

@suite("Parser if statements")
export class IfStatements {
    @test("should parse if statement")
    parse_if() {
        for (let ex of if_cases) {
            console.log("      -> ", ex.expr, " ", ex.desc);
            const y = parse(ex.expr);
            validateIfStatement(y);
        }
    }

    @test("should parse if statement with multiple elseifs correctly")
    parse_elseifs() {
        const expr = 'if 1, elseif 1, elseif 0, else, end;';
        console.log("      -> ", expr);
        const y = parse(expr);
        const q = validateIfStatement(y);
        assert.equal(q.elifs.length, 2);
        assert(q.els);
        if (q.els)
            assertCast<AST.ElseStatement>(q.els, AST.SyntaxKind.ElseStatement);
    }
}
