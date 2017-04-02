import { suite, test } from "mocha-typescript";
import { parse, assertCast } from "./test_utils";
import * as AST from "../ast";

const assert = require("chai").assert;

const matops = [{ op: '*', kind: AST.SyntaxKind.TimesToken },
{ op: '/', kind: AST.SyntaxKind.RightDivideToken },
{ op: '\\', kind: AST.SyntaxKind.LeftDivideToken },
{ op: '+', kind: AST.SyntaxKind.PlusToken },
{ op: '-', kind: AST.SyntaxKind.MinusToken },
{ op: '^', kind: AST.SyntaxKind.PowerToken },
{ op: '<', kind: AST.SyntaxKind.LessThanToken },
{ op: '>', kind: AST.SyntaxKind.GreaterThanToken },
{ op: '<=', kind: AST.SyntaxKind.LessEqualsToken },
{ op: '>=', kind: AST.SyntaxKind.GreaterEqualsToken },
{ op: '==', kind: AST.SyntaxKind.EqualsEqualsToken },
{ op: '~=', kind: AST.SyntaxKind.NotEqualsToken },
{ op: '&', kind: AST.SyntaxKind.AndToken },
{ op: '|', kind: AST.SyntaxKind.OrToken },
{ op: '&&', kind: AST.SyntaxKind.AndAndToken },
{ op: '||', kind: AST.SyntaxKind.OrOrToken },
{ op: ':', kind: AST.SyntaxKind.ColonToken }];

const dotops = [{ op: '.*', kind: AST.SyntaxKind.DotTimesToken },
{ op: './', kind: AST.SyntaxKind.DotRightDivideToken },
{ op: '.\\', kind: AST.SyntaxKind.DotLeftDivideToken },
{ op: '.^', kind: AST.SyntaxKind.DotPowerToken }];

const allops = matops.concat(dotops);

const postops = [{ op: '.\'', kind: AST.SyntaxKind.TransposeToken },
{ op: '\'', kind: AST.SyntaxKind.HermitianToken }];

const unaryops = [{ op: '+', kind: AST.SyntaxKind.UnaryPlusToken },
{ op: '-', kind: AST.SyntaxKind.UnaryMinusToken },
{ op: '~', kind: AST.SyntaxKind.NotToken }];

const shims = [{ left: '', right: '', desc: 'no spaces' },
{ left: ' ', right: '', desc: 'space before' },
{ left: '', right: ' ', desc: 'space after' },
{ left: ' ', right: ' ', desc: 'space surrounding' }];

const binary_precedences = [{ op: '||', prec: 1, kind: AST.SyntaxKind.OrOrToken },
{ op: '&&', prec: 2, kind: AST.SyntaxKind.AndAndToken },
{ op: '|', prec: 3, kind: AST.SyntaxKind.OrToken },
{ op: '&', prec: 4, kind: AST.SyntaxKind.AndToken },
{ op: '<', prec: 5, kind: AST.SyntaxKind.LessThanToken },
{ op: '>', prec: 5, kind: AST.SyntaxKind.GreaterThanToken },
{ op: '<=', prec: 5, kind: AST.SyntaxKind.LessEqualsToken },
{ op: '>=', prec: 5, kind: AST.SyntaxKind.GreaterEqualsToken },
{ op: '==', prec: 5, kind: AST.SyntaxKind.EqualsEqualsToken },
{ op: '~=', prec: 5, kind: AST.SyntaxKind.NotEqualsToken },
{ op: ':', prec: 6, kind: AST.SyntaxKind.ColonToken },
{ op: '+', prec: 7, kind: AST.SyntaxKind.PlusToken },
{ op: '-', prec: 7, kind: AST.SyntaxKind.MinusToken },
{ op: '*', prec: 8, kind: AST.SyntaxKind.TimesToken },
{ op: '/', prec: 8, kind: AST.SyntaxKind.RightDivideToken },
{ op: '\\', prec: 8, kind: AST.SyntaxKind.LeftDivideToken },
{ op: '.*', prec: 8, kind: AST.SyntaxKind.DotTimesToken },
{ op: './', prec: 8, kind: AST.SyntaxKind.DotRightDivideToken },
{ op: '.\\', prec: 8, kind: AST.SyntaxKind.DotLeftDivideToken },
{ op: '^', prec: 10, kind: AST.SyntaxKind.PowerToken },
{ op: '.^', prec: 10, kind: AST.SyntaxKind.DotPowerToken }];

const unary_precedences = [{ op: '+', prec: 9, kind: AST.SyntaxKind.UnaryPlusToken },
{ op: '-', prec: 9, kind: AST.SyntaxKind.UnaryMinusToken },
{ op: '~', prec: 9, kind: AST.SyntaxKind.NotToken }];

const postop_precedences = [{ op: '.\'', prec: 10, kind: AST.SyntaxKind.TransposeToken },
{ op: '\'', prec: 10, kind: AST.SyntaxKind.HermitianToken }];

const brackets = [{ left: '{', right: '}', kind: AST.SyntaxKind.CellDefinition },
{ left: '[', right: ']', kind: AST.SyntaxKind.MatrixDefinition }];


function singleStatementValidation(y: AST.Node): AST.Statement {
    const x = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
    assert.equal(x.statements.length, 1);
    return x.statements[0];
}

function assignmentStatementValidation(y: AST.Node): AST.AssignmentStatement {
    const g = singleStatementValidation(y);
    const x = assertCast<AST.AssignmentStatement>(g, AST.SyntaxKind.AssignmentStatement);
    return x;
}

function validateLiteral(y: AST.Expression, val: string) {
    const x = assertCast<AST.LiteralExpression>(y, AST.SyntaxKind.FloatLiteral);
    assert.equal(x.text, val);
}

function validateMatrixDef(y: AST.Node, k: AST.SyntaxKind): AST.MatrixDefinition {
    const x = singleStatementValidation(y);
    const z = assertCast<AST.ExpressionStatement>(x, AST.SyntaxKind.ExpressionStatement);
    return assertCast<AST.MatrixDefinition>(z.expression, k);
}

function validateInfix(y: AST.Node, k: AST.SyntaxKind): AST.InfixExpression {
    const x = assignmentStatementValidation(y);
    const z = assertCast<AST.InfixExpression>(x.expression, AST.SyntaxKind.InfixExpression);
    assert.equal(z.operator.kind, k);
    return z;
}

function assertInfix(y: AST.Node, k: AST.SyntaxKind): AST.InfixExpression {
    const z = assertCast<AST.InfixExpression>(y, AST.SyntaxKind.InfixExpression);
    assert.equal(z.operator.kind, k);
    return z;
}

function assertPrefix(y: AST.Node, k: AST.SyntaxKind): AST.UnaryExpression {
    const z = assertCast<AST.UnaryExpression>(y, AST.SyntaxKind.PrefixExpression);
    assert.equal(z.operator, k);
    return z;
}

function validatePrefix(y: AST.Node, k: AST.SyntaxKind): void {
    const x = assignmentStatementValidation(y);
    const z = assertCast<AST.UnaryExpression>(x.expression, AST.SyntaxKind.PrefixExpression);
    assert.equal(z.operator, k);
}

function validatePostfix(y: AST.Node, k: AST.SyntaxKind): void {
    const x = assignmentStatementValidation(y);
    const z = assertCast<AST.PostfixExpression>(x.expression, AST.SyntaxKind.PostfixExpression);
    assert.equal(z.operator.kind, k);
}

@suite("Parser expressions")
export class Expressions {
    @test("should parse a simple infix op")
    simple_infix() {
        for (let shim of shims) {
            for (let op of matops) {
                const expr = `A=3${shim.left}${op.op}${shim.right}4;`;
                console.log("      -> ", expr);
                validateInfix(parse(expr), op.kind);
            }
        }
    }
    @test("should parse a simple infix op with no semicolon")
    simple_infix_no_semi() {
        for (let shim of shims) {
            for (let op of matops) {
                const expr = `A=3${shim.left}${op.op}${shim.right}4\n`;
                console.log("      -> ", expr);
                validateInfix(parse(expr), op.kind);
            }
        }
    }
    @test("should parse a simple infix op with no semicolon, trailing whitespace")
    simple_infix_no_semi_whitespace() {
        for (let shim of shims) {
            for (let op of matops) {
                const expr = `A=3${shim.left}${op.op}${shim.right}4   \n`;
                console.log("      -> ", expr);
                validateInfix(parse(expr), op.kind);
            }
        }
    }
    @test("should parse a simple infix op with variables")
    simple_infix_vars() {
        for (let shim of shims) {
            for (let op of allops) {
                const expr = `A=D${shim.left}${op.op}${shim.right}F;`;
                console.log("      -> ", expr);
                validateInfix(parse(expr), op.kind);
            }
        }
    }

    @test("should parse a postfix operator correctly")
    simple_postfix() {
        for (let shim of shims) {
            for (let op of postops) {
                if (shim.left === ' ' && op.op === "'") continue;
                const expr = `A=B${shim.left}${op.op}${shim.right};`;
                console.log("      -> ", expr);
                validatePostfix(parse(expr), op.kind);
            }
        }
    }

    @test("should parse the unary operators correctly")
    simple_unary() {
        for (let shim of shims) {
            for (let op of unaryops) {
                const expr = `A=B+${shim.left}${op.op}${shim.right}C;`;
                console.log("      -> ", expr);
                let y = parse(expr);
                let z = validateInfix(y, AST.SyntaxKind.PlusToken);
                let r = assertCast<AST.UnaryExpression>(z.rightOperand, AST.SyntaxKind.PrefixExpression);
                assert.equal(r.operator, op.kind);
            }
        }
    }

    @test("should correctly handle precedence")
    precedence_test() {
        for (let op1 of binary_precedences) {
            for (let op2 of binary_precedences) {
                const expr = `A=B${op1.op}C${op2.op}D;`;
                console.log("      -> ", expr);
                let y = parse(expr);
                if (op1.prec < op2.prec) {
                    validateInfix(y, op1.kind);
                } else if (op1.prec > op2.prec) {
                    validateInfix(y, op2.kind);
                }
            }
        }
    }

    @test("should correctly handle unary/binary operators")
    unary_binary_test() {
        for (let op1 of unary_precedences) {
            for (let op2 of binary_precedences) {
                const expr = `A=${op1.op}C${op2.op}D;`;
                console.log("      -> ", expr);
                let y = parse(expr);
                if (op1.prec < op2.prec) {
                    validatePrefix(y, op1.kind);
                } else {
                    validateInfix(y, op2.kind);
                }
            }
        }
    }

    @test("should correctly handle binary/postfix operators")
    binary_postfix() {
        for (let op1 of binary_precedences) {
            for (let op2 of postop_precedences) {
                const expr = `A=B${op1.op}C${op2.op};`;
                console.log("      -> ", expr);
                let y = parse(expr);
                if (op1.prec < op2.prec)
                    validateInfix(y, op1.kind);
                else
                    validatePostfix(y, op2.kind);
            }
        }
    }

    @test("should handle simple matrix definitions with commas")
    simple_matrix() {
        for (let br of brackets) {
            const expr = `${br.left}1,2,3${br.right};`;
            console.log("      -> ", expr);
            let y = parse(expr);
            const expr_matrix = validateMatrixDef(y, br.kind);
            assert.equal(expr_matrix.expressions.length, 1);
            validateLiteral(expr_matrix.expressions[0][0], '1');
            validateLiteral(expr_matrix.expressions[0][1], '2');
            validateLiteral(expr_matrix.expressions[0][2], '3');
        }
    }

    @test("should handle simple matrix definitions with commas and prefix operators")
    simple_prefix_matrix() {
        for (let br of brackets) {
            const expr = `${br.left}+1,-2,3${br.right};`;
            console.log("     -> ", expr);
            let y = parse(expr);
            const e = validateMatrixDef(y, br.kind);
            assert.equal(e.expressions.length, 1);
            assert.equal(e.expressions[0].length, 3);
            const h = assertPrefix(e.expressions[0][0], AST.SyntaxKind.UnaryPlusToken);
            validateLiteral(h.operand, '1');
            const i = assertPrefix(e.expressions[0][1], AST.SyntaxKind.UnaryMinusToken);
            validateLiteral(i.operand, '2');
            validateLiteral(e.expressions[0][2], '3');
        }
    }

    @test("should handle matrix definition with spaces")
    simple_matrix_spaces() {
        for (let br of brackets) {
            const expr = `${br.left}1 2 3${br.right};`;
            console.log("      -> ", expr);
            let y = parse(expr);
            const e = validateMatrixDef(y, br.kind);
            assert.equal(e.expressions.length, 1);
            assert.equal(e.expressions[0].length, 3);
            validateLiteral(e.expressions[0][0], '1');
            validateLiteral(e.expressions[0][1], '2');
            validateLiteral(e.expressions[0][2], '3');
        }
    }

    @test("should consume spaces in a matrix definition where unambiguous")
    simple_matrix_spaces_infix() {
        for (let br of brackets) {
            const expr = `${br.left}1 *2 3${br.right};`;
            console.log("      -> ", expr);
            let y = parse(expr);
            const e = validateMatrixDef(y, br.kind);
            assert.equal(e.expressions.length, 1);
            assert.equal(e.expressions[0].length, 2);
            assertInfix(e.expressions[0][0], AST.SyntaxKind.TimesToken);
            validateLiteral(e.expressions[0][1], '3');
        }
    }

    @test("should bind +/- as unary operators when spaces are present prior")
    simple_matrix_unary_spaces() {
        for (let br of brackets) {
            const expr = `${br.left}1 +2 -3${br.right};`;
            console.log("      -> ", expr);
            let y = parse(expr);
            const e = validateMatrixDef(y, br.kind).expressions;
            assert.equal(e.length, 1);
            assert.equal(e[0].length, 3);
            validateLiteral(e[0][0], '1');
            assertPrefix(e[0][1], AST.SyntaxKind.UnaryPlusToken);
            assertPrefix(e[0][2], AST.SyntaxKind.UnaryMinusToken);
        }
    }

    @test("should bind +/- as binary operators when spaces surround the operator")
    simple_matrix_binary_spaces() {
        for (let br of brackets) {
            const expr = `${br.left}1 + 2 3${br.right};`;
            console.log("      -> ", expr);
            let y = parse(expr);
            const e = validateMatrixDef(y, br.kind).expressions;
            assert.equal(e.length, 1);
            assert.equal(e[0].length, 2);
            assertInfix(e[0][0], AST.SyntaxKind.PlusToken);
            validateLiteral(e[0][1], '3');
        }
    }
}
