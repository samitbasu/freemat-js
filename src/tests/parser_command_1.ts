import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";
const assert = require('chai').assert;

function validate_command(y: AST.Node): AST.CommandStatement {
    const g = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
    assert.equal(g.statements.length, 1);
    const h = assertCast<AST.CommandStatement>(g.statements[0], AST.SyntaxKind.CommandStatement);
    return h;
}

const ops = ['||', '&&', '|', '&', '<=', '>=', '<', '>', '==',
    '~=', '+', '-', '.*', './',
    '.\\', '*', '/', '\\', '~', '.^', '^'];

@suite("Parser command statements")
export class CommandStatement {
    @test("should parse command statement: foo on 32")
    basic_command() {
        const y = parse("foo on 32");
        const h = validate_command(y);
        assert.equal(h.func.name, 'foo');
        assert.equal(h.args.length, 2);
        assert.equal(h.args[0].text, 'on');
        assert.equal(h.args[1].text, '32');
    }

    @test("should parse command statement: foo on 32 --help")
    basic_with_help() {
        const y = parse("foo on 32 --help");
        const h = validate_command(y);
        assert.equal(h.func.name, 'foo');
        assert.equal(h.args.length, 3);
        assert.equal(h.args[0].text, 'on');
        assert.equal(h.args[1].text, '32');
        assert.equal(h.args[2].text, '--help');
    }

    @test("should parse command statement: foo (op)x")
    op_case() {
        for (let op of ops) {
            const expr = `foo ${op}x bar\n`;
            console.log("      -> ", expr);
            const y = parse(expr);
            const h = validate_command(y);
            assert.equal(h.func.name, 'foo');
            assert.equal(h.args.length, 2);
        }
    }

}
