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
                if (op1.prec < op2.prec) {
                    validatePostfix(y, op2.kind);
                } else if (op1.prec > op2.prec) {
                    validateInfix(y, op1.kind);
                }
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
        }
    }

    /*
    for (let br of brackets) {
        it(`should handle simple matrix definitions with commas ${br.left}1,2,3${br.right}`, () => {
            let y = parse(`${br.left}1,2,3${br.right};`);
            const expr_matrix = validateMatrixDef(y,br.node);
            assert.equal(expr_matrix.length,1);
            assert.equal(expr_matrix[0].length,3);
            assert.equal(expr_matrix[0][0].token,'1');
            assert.equal(expr_matrix[0][1].token,'2');
            assert.equal(expr_matrix[0][2].token,'3');
        });
        it(`should handle simple matrix definitions with commas ${br.left}+1,-2,3${br.right}`, () => {
            let y = parse(`${br.left}+1,-2,3${br.right};`);
            const expr_matrix = validateMatrixDef(y,br.node);
            assert.equal(expr_matrix.length,1);
            assert.equal(expr_matrix[0].length,3);
            assert.equal(expr_matrix[0][0].node,'PrefixExpression');
            assert.equal(expr_matrix[0][0].operator,'+');
            assert.equal(expr_matrix[0][0].operand.token,'1');
            assert.equal(expr_matrix[0][1].node,'PrefixExpression');
            assert.equal(expr_matrix[0][1].operator,'-');
            assert.equal(expr_matrix[0][1].operand.token,'2');
            assert.equal(expr_matrix[0][2].token,'3');
        });
        it(`should handle matrix definition ${br.left}1 2 3${br.right} with spaces`, () => {
            let y = parse(`${br.left}1 2 3${br.right};`);
            const expr_matrix = validateMatrixDef(y,br.node);
            assert.equal(expr_matrix.length,1);
            assert.equal(expr_matrix[0].length,3);
            assert.equal(expr_matrix[0][0].token,'1');
            assert.equal(expr_matrix[0][1].token,'2');
            assert.equal(expr_matrix[0][2].token,'3');  
        });
        it(`should consume spaces in a matrix definition where unambiguous ${br.left}1 *2 3${br.right}`, () => {
            let y = parse(`${br.left}1 *2 3${br.right};`);
            const expr_matrix = validateMatrixDef(y,br.node);
            assert.equal(expr_matrix.length,1);
            assert.equal(expr_matrix[0].length,2);
            assert.equal(expr_matrix[0][0].node,'InfixExpression');
            assert.equal(expr_matrix[0][0].operator,'*');
            assert.equal(expr_matrix[0][1].token,'3');
        });
        it(`should bind +/- as unary operators when spaces are present before the operators ${br.left}1 +2 -3${br.right}`, () => {
            let y = parse(`${br.left}1 +2 -3${br.right};`);
            const expr_matrix = validateMatrixDef(y,br.node);
            assert.equal(expr_matrix.length,1);
            assert.equal(expr_matrix[0].length,3);
            assert.equal(expr_matrix[0][0].token,'1');
            assert.equal(expr_matrix[0][1].node,'PrefixExpression');
            assert.equal(expr_matrix[0][1].operator,'+');
            assert.equal(expr_matrix[0][2].node,'PrefixExpression');
            assert.equal(expr_matrix[0][2].operator,'-');
        });
        it(`should bind +/- as binary operators when spaces surround the operators ${br.left}1 + 2 3${br.right}`, () => {
            let y = parse(`${br.left}1 + 2 3${br.right};`);
            const expr_matrix = validateMatrixDef(y,br.node);
            assert.equal(expr_matrix.length,1);
            assert.equal(expr_matrix[0].length,2);
            assert.equal(expr_matrix[0][0].node,'InfixExpression');
            assert.equal(expr_matrix[0][0].operator,'+');
            assert.equal(expr_matrix[0][1].token,'3');
        });
    }
*/

}
