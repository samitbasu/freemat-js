import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";

const assert = require('chai').assert;

function validate_switch(y: AST.Node): AST.SwitchStatement {
    const h = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
    assert.equal(h.statements.length, 1);
    const j = assertCast<AST.SwitchStatement>(h.statements[0], AST.SyntaxKind.SwitchStatement);
    return j;
}

@suite("parser switch statements")
export class ParserSwitchStatements {
    @test("should parse a basic switch statement")
    basic_switch() {
        const y = parse('switch(true), end;');
        const f = validate_switch(y);
        assert.equal(f.cases.length, 0);
        assertCast<AST.VariableDereference>(f.expr, AST.SyntaxKind.VariableDereference);
    }
    @test("should parse a switch statement with a single case")
    single_case() {
        const y = parse('switch(true), case false, end;');
        const f = validate_switch(y);
        assert.equal(f.cases.length, 1);
        const g = assertCast<AST.CaseStatement>(f.cases[0], AST.SyntaxKind.CaseStatement);
        assertCast<AST.VariableDereference>(g.expression, AST.SyntaxKind.VariableDereference);
    }
    @test("should parse a switch statement with a cell array for the case test")
    cell_case() {
        const y = parse('switch(true), case {1,2,3}, end;');
        const f = validate_switch(y);
        assert.equal(f.cases.length, 1);
        const g = assertCast<AST.CaseStatement>(f.cases[0], AST.SyntaxKind.CaseStatement);
        assertCast<AST.MatrixDefinition>(g.expression, AST.SyntaxKind.CellDefinition);
    }
    @test("should parse a switch statement with an otherwise clause correctly")
    otherwise_case() {
        const y = parse('switch(true), otherwise, end;');
        const f = validate_switch(y);
        assert.equal(f.cases.length, 0);
        if (f.otherwise)
            assertCast<AST.OtherwiseStatement>(f.otherwise, AST.SyntaxKind.OtherwiseStatement);
    }
    @test("should parse a switch statement with multiple cases and an otherwise clause correctly")
    full_case() {
        const y = parse('switch(true), case 2, case 1, otherwise, end;');
        const f = validate_switch(y);
        assert.equal(f.cases.length, 2);
        if (f.otherwise)
            assertCast<AST.OtherwiseStatement>(f.otherwise, AST.SyntaxKind.OtherwiseStatement);
        const a = assertCast<AST.LiteralExpression>(f.cases[0].expression, AST.SyntaxKind.FloatLiteral);
        assert.equal(a.text, '2');
        const b = assertCast<AST.LiteralExpression>(f.cases[1].expression, AST.SyntaxKind.FloatLiteral);
        assert.equal(b.text, '1');
    }
}
