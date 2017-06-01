import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";
//import { inspect } from "util";

const assert = require('chai').assert;

function validate_function(y: AST.Node): AST.FunctionDef {
    const z = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
    assert.equal(z.statements.length, 1);
    const f = assertCast<AST.FunctionDef>(z.statements[0], AST.SyntaxKind.FunctionDefinition);
    return f;
}

const seps = [',', ' '];

const empty_functions = ['function [] = foo(); end;',
    'function foo(); end;',
    'function [] = foo; end;',
    'function foo; end;'];

@suite("Parser function declaration")
export class FunctionDeclarations {
    @test("should parse a basic multireturn, minimal function")
    basic_function() {
        for (let sep of seps) {
            const expr = `function [A${sep}B${sep}C]=foo(X,Y,Z); end;`;
            console.log("      -> ", expr);
            const y = parse(expr);
            let f = validate_function(y);
            assert.equal(f.returns.length, 3);
            assert.equal(f.returns[0].name, 'A');
            assert.equal(f.returns[1].name, 'B');
            assert.equal(f.returns[2].name, 'C');
            assert.equal(f.args.length, 3);
            assert.equal(f.args[0].name, 'X');
            assert.equal(f.args[1].name, 'Y');
            assert.equal(f.args[2].name, 'Z');
            assert.equal(f.name.name, 'foo');
        }
    }

    @test("should parse a basic empty function")
    empty_function() {
        for (let expr of empty_functions) {
            console.log("      -> ", expr);
            const y = parse(expr);
            const f = validate_function(y);
            assert.equal(f.returns.length, 0);
            assert.equal(f.args.length, 0);
            assert.equal(f.name.name, 'foo');
        }
    }

    @test("should handle an optional end")
    optional_end() {
        const y = parse('function yp = foo(x); yp = x;');
        const f = validate_function(y);
        assert.equal(f.returns.length, 1);
        assert.equal(f.args.length, 1);
        assert.equal(f.name.name, 'foo');
        const g = assertCast<AST.Block>(f.body, AST.SyntaxKind.Block);
        assert.equal(g.statements.length, 2);
    }
}
