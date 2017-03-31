import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";

const assert = require('chai').assert;

function validate_try(y: AST.Node): AST.TryStatement {
    const h = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
    assert.equal(h.statements.length, 1);
    return assertCast<AST.TryStatement>(h.statements[0], AST.SyntaxKind.TryStatement);
}

@suite("Parser try statements")
export class ParserTry {
    @test("should parse a basic try statement")
    basic_try() {
        const y = parse('try, end;');
        const f = validate_try(y);
        assert.isUndefined(f.catc);
    }
    @test("should parse a basic try/catch statement")
    basic_try_catch() {
        const y = parse('try, catch, end;');
        const f = validate_try(y);
        assert.isDefined(f.catc);
        if (f.catc) assertCast<AST.CatchStatement>(f.catc, AST.SyntaxKind.CatchStatement);
    }
    @test("should parse a basic try/catch statement with an exception identifier")
    basic_try_catch_ident() {
        const y = parse('try, catch foo, end;');
        const f = validate_try(y);
        assert.isDefined(f.catc);
        if (f.catc) {
            const g = assertCast<AST.CatchStatement>(f.catc, AST.SyntaxKind.CatchStatement);
            assert.isDefined(g.identifier);
            if (g.identifier) {
                assert.equal(g.identifier.name, 'foo');
            }
        }
    }
}
