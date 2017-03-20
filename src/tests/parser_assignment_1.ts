import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";

const assert = require('chai').assert;

function validate_assignment(y: AST.Node): AST.VariableDereference {
    const z = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
    assert.equal(z.statements.length, 1);
    const f = z.statements[0];
    const g = assertCast<AST.AssignmentStatement>(f, AST.SyntaxKind.AssignmentStatement);
    assert.equal(g.lhs.kind, AST.SyntaxKind.VariableDereference);
    assert.equal(g.lhs.identifier.name, 'A');
    return g.lhs;
}

const spaces = [
    {
        txt: '',
        desc: ''
    },
    {
        txt: ' ',
        desc: 'with space'
    }];

const index_ops = [
    {
        op: '.foo',
        valid: (f: AST.Node) => {
            const g = assertCast<AST.FieldExpression>(f, AST.SyntaxKind.FieldExpression);
            assert.equal(g.identifier.name, 'foo');
        }
    },
    {
        op: '.(foo)',
        valid: (f: AST.Node) => {
            const g = assertCast<AST.DotFieldExpression>(f, AST.SyntaxKind.DynamicFieldExpression);
            const h = assertCast<AST.VariableDereference>(g.expression, AST.SyntaxKind.VariableDereference);
            assert.equal(h.identifier.name, 'foo');
        }
    },
    {
        op: '(12)',
        valid: (f: AST.Node) => {
            const g = assertCast<AST.ArrayIndexExpression>(f, AST.SyntaxKind.ArrayIndexExpression);
            assert.equal(g.expressions.length, 1);
            const h = assertCast<AST.NumericLiteral>(g.expressions[0], AST.SyntaxKind.FloatLiteral);
            assert.equal(h.text, '12');
        }
    },
    {
        op: '{12}',
        valid: (f: AST.Node) => {
            const g = assertCast<AST.CellIndexExpression>(f, AST.SyntaxKind.CellIndexExpression);
            assert.equal(g.expressions.length, 1);
            const h = assertCast<AST.NumericLiteral>(g.expressions[0], AST.SyntaxKind.FloatLiteral);
            assert.equal(h.text, '12');
        }
    }];


@suite("Parser assignment statements")
export class Assignments {
    @test("should parse a basic assignment statement: A=42;")
    basic_assignment() {
        const y = parse('A=42;');
        let f = validate_assignment(y);
        assert.equal(f.deref.length, 0);
    }

    @test("should parse a field assignment statement")
    field_assignment() {
        for (let ndx of index_ops) {
            const expr = `A${ndx.op} = 42;`;
            console.log("      -> ", expr);
            const y = parse(expr);
            let f = validate_assignment(y);
            assert.equal(f.deref.length, 1);
            ndx.valid(f.deref[0]);
        }
    }

    @test("should parse multiple index expressions")
    multiple_field_expression() {
        for (let spc of spaces) {
            for (let ndx1 of index_ops) {
                for (let ndx2 of index_ops) {
                    const expr = `A${spc.txt}${ndx1.op}${spc.txt}${ndx2.op} = 42;`;
                    console.log("      -> ", expr);
                    const y = parse(expr);
                    let f = validate_assignment(y);
                    assert.equal(f.deref.length, 2);
                    ndx1.valid(f.deref[0]);
                    ndx2.valid(f.deref[1]);
                }
            }
        }
    }
}

