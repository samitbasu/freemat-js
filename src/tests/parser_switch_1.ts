import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";

const assert = require('chai').assert;

function validate_switch(y): AST.SwitchStatement {
    const h = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
    assert.equal(h.statements.length, 1);
    const j = assertCast<AST.SwitchStatement>(h.statements[0], AST.SyntaxKind.SwitchStatement);
    return j;
}

@suite("parser switch statements")
class ParserSwitchStatements {
    @test("should parse a basic switch statement")
    basic_switch() {
        const y = parse('switch(true), end;');
        const f = validate_switch(y);
        assert.equal(f.cases.length, 0);
        assertCast<AST.VariableDereference>(f.expr, AST.SyntaxKind.VariableDereference);
    }


    describe('parser switch statements', function() {
        it('should parse a basic switch statement', () => {
        });
        it('should parse a switch statement with a single case', () => {
            const y = parser.parse('switch(true), case false, end;');
            const f = validate_switch(y);
            assert.equal(f.cases.length, 1);
            assert.equal(f.cases[0].node, 'CaseStatement');
            assert.equal(f.expression.node, 'VariableDereference');
            assert.equal(f.otherwise, null);
        });
        it('should parse a switch statement with a cell array for the case test', () => {
            const y = parser.parse('switch(true), case {1,2,3}, end;');
            const f = validate_switch(y);
            assert.equal(f.cases.length, 1);
            assert.equal(f.cases[0].node, 'CaseStatement');
            assert.equal(f.cases[0].expression.node, 'CellDefinition');
            assert.equal(f.otherwise, null);
        });
        it('should parse a switch statement with an otherwise clause correctly', () => {
            const y = parser.parse('switch(true), otherwise, end;');
            const f = validate_switch(y);
            assert.equal(f.cases.length, 0);
            assert.equal(f.otherwise.node, 'OtherwiseStatement');
            assert.equal(f.otherwise.body.node, 'Block');
        });
        it('should parse a switch statement with multiple cases and an otherwise clause correctly', () => {
            const f = validate_switch(parser.parse('switch(true), case 2, case 1, otherwise, end;'));
            assert.equal(f.cases.length, 2);
            assert.equal(f.otherwise.node, 'OtherwiseStatement');
            assert.equal(f.cases[0].expression.token, '2');
            assert.equal(f.cases[1].expression.token, '1');
        });

    });
