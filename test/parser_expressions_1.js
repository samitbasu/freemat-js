/* global describe it */
'use strict';
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');
const matops = ['*','/','\\','+','-','^','<','>','<=','>=','==','~=','&','|','&&','||',':'];
const dotops = ['.*','./','.\\','.^'];
const allops = matops.concat(dotops);
const postops = ['.\'','\''];
const unaryops = ['+','-','~'];
const shims = [{left: '', right: '', desc: 'no spaces'},
               {left: ' ', right: '', desc: 'space before'},
               {left: '', right: ' ', desc: 'space after'},
               {left: ' ', right: ' ', desc: 'space surrounding'}];
const binary_precedences = [{op: '||', prec: 1},{op: '&&', prec: 2},{op: '|', prec: 3},{op: '&', prec: 4},
                            {op: '<', prec: 5},{op: '>', prec: 5},{op: '<=', prec: 5},{op: '>=', prec: 5},
                            {op: '==', prec: 5},{op: '~=', prec: 5},{op: ':', prec: 6},{op: '+', prec: 7},
                            {op: '-', prec: 7},{op: '*', prec: 8},{op: '/', prec: 8},{op: '\\', prec: 8},
                            {op: '.*', prec: 8},{op: './', prec: 8},{op: '.\\', prec: 8},{op: '^', prec: 10},
                            {op: '.^', prec: 10}];
const unary_precedences = [{op: '+', prec: 9},{op: '-', prec: 9},{op: '~', prec:9}];
const postop_precedences = [{op: '.\'', prec: 10}, {op: '\'', prec: 10}];
const brackets = [{left: '{', right: '}', node: 'CellDefinition'},{left: '[', right: ']', node: 'MatrixDefinition'}];

function singleStatementValidation(y) {
    assert.equal(y.node,'Block');
    assert.equal(y.statements.length,1);
    return y;
}

function assignmentStatementValidation(y) {
    singleStatementValidation(y);
    assert.equal(y.statements[0].node,'AssignmentStatement');
    return y;
}

function validateMatrixDef(y,node) {
    singleStatementValidation(y);
    assert.equal(y.statements[0].node,'ExpressionStatement');
    assert.equal(y.statements[0].expr.node,node);
    return y.statements[0].expr.expression;
}

function validate(y,op,type='InfixExpression') {
    singleStatementValidation(y);
    assignmentStatementValidation(y);
    let x = y.statements[0].expr;
    assert.equal(x.node,type);
    assert.equal(x.operator,op);
    return y;
}

describe('parser expressions', function() {
    for (let shim of shims) {
        for (let op of matops) {
            const expr = `A=3${shim.left}${op}${shim.right}4;`;
            it(`should have operator symbol ${op} as the root expression ${expr} with ${shim.desc}`,
               () => {
                   validate(parser.parse(expr),op);
               });
        }
    }
    for (let shim of shims) {
        for (let op of allops) {
            const expr = `A=D${shim.left}${op}${shim.right}F;`;
            it(`should have operator symbol ${op} as the root expression ${expr} with ${shim.desc}`,
               () => {
                   validate(parser.parse(expr),op);
               });
        }
    }
    for (let shim of shims) {
        for (let op of postops) {
            const expr = `A=B${shim.left}${op}${shim.right};`;
            it(`should parse the postfix operator ${op}$ for ${expr} with ${shim.desc}`,
               () => {
                   validate(parser.parse(expr),op,'PostfixExpression');
               });
        }
    }
    for (let shim of shims) {
        for (let op of unaryops) {
            const expr = `A=B+${shim.left}${op}${shim.right}C;`;
            it(`should parse the unary operator ${op} for the expression ${expr}`,
           () => {
               let y = parser.parse(expr);
               validate(y,'+');
               assert.equal(y.statements[0].expr.rightOperand.node,'PrefixExpression');
               assert.equal(y.statements[0].expr.rightOperand.operator,op);
           });
        }
    }
    for (let op1 of binary_precedences) {
        for (let op2 of binary_precedences) {
            const expr = `A=B${op1.op}C${op2.op}D;`;
            if (op1.prec < op2.prec) {
                it(`should parse ${expr} with operator ${op1.op} at the tree root`, () => {
                    let y = parser.parse(expr);
                    validate(y,op1.op);
                });
            } else if (op1.prec > op2.prec) {
                it(`should parse ${expr} with operator ${op2.op} at the tree root`, () => {
                    let y = parser.parse(expr);
                    validate(y,op2.op);
                });
            }
        }
    }
    for (let op1 of unary_precedences) {
        for (let op2 of binary_precedences) {
            const expr = `A=${op1.op}C${op2.op}D;`;
            if (op1.prec < op2.prec) {
                it(`should parse ${expr} with unary operator ${op1.op} at the tree root`, () => {
                    let y = parser.parse(expr);
                    validate(y,op1.op,'PrefixExpression');
                });
            } else {
                it(`should parse ${expr} with unary operator ${op1.op} at the tree root`, () => {
                    let y = parser.parse(expr);
                    validate(y,op2.op);
                });
            }
        }
    }
    for (let op1 of binary_precedences) {
        for (let op2 of postop_precedences) {
            const expr = `A=B${op1.op}C${op2.op};`;
            if (op1.prec < op2.prec) {
                it(`should parse ${expr} with operator ${op1.op} at the tree root`, () => {
                    let y = parser.parse(expr);
                    validate(y,op1.op);
                });
            } else if (op1.prec > op2.prec) {
                it(`should parse ${expr} with operator ${op2.op} at the tree root`, () => {
                    let y = parser.parse(expr);
                    validate(y,op2.op,'PrefixExpression');
                });
            }
        }
    }
    for (let br of brackets) {
        it(`should handle simple matrix definitions with commas ${br.left}1,2,3${br.right}`, () => {
            let y = parser.parse(`${br.left}1,2,3${br.right};`);
            const expr_matrix = validateMatrixDef(y,br.node);
            assert.equal(expr_matrix.length,1);
            assert.equal(expr_matrix[0].length,3);
            assert.equal(expr_matrix[0][0].token,'1');
            assert.equal(expr_matrix[0][1].token,'2');
            assert.equal(expr_matrix[0][2].token,'3');
        });
        it(`should handle simple matrix definitions with commas ${br.left}+1,-2,3${br.right}`, () => {
            let y = parser.parse(`${br.left}+1,-2,3${br.right};`);
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
            let y = parser.parse(`${br.left}1 2 3${br.right};`);
            const expr_matrix = validateMatrixDef(y,br.node);
            assert.equal(expr_matrix.length,1);
            assert.equal(expr_matrix[0].length,3);
            assert.equal(expr_matrix[0][0].token,'1');
            assert.equal(expr_matrix[0][1].token,'2');
            assert.equal(expr_matrix[0][2].token,'3');  
        });
        it(`should consume spaces in a matrix definition where unambiguous ${br.left}1 *2 3${br.right}`, () => {
            let y = parser.parse(`${br.left}1 *2 3${br.right};`);
            const expr_matrix = validateMatrixDef(y,br.node);
            assert.equal(expr_matrix.length,1);
            assert.equal(expr_matrix[0].length,2);
            assert.equal(expr_matrix[0][0].node,'InfixExpression');
            assert.equal(expr_matrix[0][0].operator,'*');
            assert.equal(expr_matrix[0][1].token,'3');
        });
        it(`should bind +/- as unary operators when spaces are present before the operators ${br.left}1 +2 -3${br.right}`, () => {
            let y = parser.parse(`${br.left}1 +2 -3${br.right};`);
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
            let y = parser.parse(`${br.left}1 + 2 3${br.right};`);
            const expr_matrix = validateMatrixDef(y,br.node);
            assert.equal(expr_matrix.length,1);
            assert.equal(expr_matrix[0].length,2);
            assert.equal(expr_matrix[0][0].node,'InfixExpression');
            assert.equal(expr_matrix[0][0].operator,'+');
            assert.equal(expr_matrix[0][1].token,'3');
        });
    }
});
