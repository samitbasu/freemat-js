import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";

const assert = require('chai').assert;

function validate_assignment(y: AST.Node): AST.AssignmentStatement {
    const z = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
    assert.equal(z.statements.length, 1);
    const f = z.statements[0];
    const g = assertCast<AST.AssignmentStatement>(f, AST.SyntaxKind.AssignmentStatement);
    return g;
}

@suite("parser string constants")
export class ParserString {
    test_strings = ['', 'hello', ' world ', 'foo bar', 'with "s inside" it', 'with \'\'\' inside'];

    @test("should handle string literals")
    string_literals() {
        for (let tstring of this.test_strings) {
            const escaped_string = `\'${tstring}\'`;
            const expr = `a = ${escaped_string};`;
            console.log("      -> ", expr);
            const y = parse(expr);
            const g = validate_assignment(y);
            const h = assertCast<AST.StringLiteral>(g.expression, AST.SyntaxKind.StringLiteral);
            assert.equal(h.text, escaped_string);
        }
    }

    @test("should handle bracketed strings")
    bracket_string() {
        for (let tstring of this.test_strings) {
            const escaped_string = `\'${tstring}\'`;
            const expr = `a = [${escaped_string}];`;
            const y = parse(expr);
            const g = validate_assignment(y);
            const h = assertCast<AST.MatrixDefinition>(g.expression, AST.SyntaxKind.MatrixDefinition);
            const k = assertCast<AST.StringLiteral>(h.expressions[0][0], AST.SyntaxKind.StringLiteral);
            assert.equal(k.text, escaped_string);
        }
    }

    @test("should handle cell strings")
    cell_string() {
        for (let tstring of this.test_strings) {
            const escaped_string = `\'${tstring}\'`;
            const expr = `a = {${escaped_string}};`;
            const y = parse(expr);
            const g = validate_assignment(y);
            const h = assertCast<AST.MatrixDefinition>(g.expression, AST.SyntaxKind.CellDefinition);
            const k = assertCast<AST.StringLiteral>(h.expressions[0][0], AST.SyntaxKind.StringLiteral);
            assert.equal(k.text, escaped_string);
        }
    }
}
