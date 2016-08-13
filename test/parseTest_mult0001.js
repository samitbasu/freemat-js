const chai = require('chai');
const should = chai.should();
const assert = chai.assert;
const parser = require('../freemat.js')

const matops = ['*','/','\\','+','-','^','<','>','<=','>=','==','~=','&','|','&&','||',':'];
const dotops = ['.*','./','.\\','.^'];
const allops = matops.concat(dotops);
const postops = [".'","'"];
const unaryops = ["+","-","~"];
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

function singleStatementValidation(y) {
    assert(y.node,'Block');
    assert(y.statements.length,1);
    return y;
}

function assignmentStatementValidation(y) {
    singleStatementValidation(y);
    assert.equal(y.statements[0].node,'AssignmentStatement');
    return y;
}

function prefixValidation(y,op) {
    singleStatementValidation(y);
    assignmentStatementValidation(y);
    let x = y.statements[0].expr;
    assert.equal(x.node,'PrefixExpression');
    assert.equal(x.operator,op);
    return y;
}

function postfixValidation(y,op) {
    singleStatementValidation(y);
    assignmentStatementValidation(y);
    let x = y.statements[0].expr;
    assert.equal(x.node,'PostfixExpression');
    assert.equal(x.operator,op);
    return y;
}

function infixValidation(y,op) {
    singleStatementValidation(y);
    assignmentStatementValidation(y);
    let x = y.statements[0].expr;
    assert.equal(x.node,'InfixExpression');
    assert.equal(x.operator,op);
    return y;
}

describe('parser', function() {
    for (let shim of shims) {
	for (let op of matops) {
	    const expr = "A=3"+shim.left+op+shim.right+"4;";
	    it('should have operator symbol ' + op +
	       ' as the root of tree in expression ' + expr +
	       ' with ' + shim.desc, () => {
		infixValidation(parser.parse(expr),op);
	    });
	}
    }
    for (let shim of shims) {
	for (let op of allops) {
	    const expr = "A=D"+shim.left+op+shim.right+"D;";
	    it('should have operator symbol ' + op +
	       ' as the root of tree in expression' + expr +
	       ' with ' + shim.desc, () => {
		infixValidation(parser.parse(expr),op);
	    });
	}
    }
    for (let shim of shims) {
	for (let op of postops) {
	    const expr = "A=B"+shim.left+op+shim.right+";"
	    it('should parse the postfix operator ' + op +
	       ' for the expression ' + expr + ' with ' + shim.desc,
	       () => {
		   postfixValidation(parser.parse(expr),op);
	       });
	}
    }
    for (let shim of shims) {
	for (let op of unaryops) {
	    const expr = `A=B+${shim.left}${op}${shim.right}C;`;
	    it(`should parse the unary operator ${op} for the expression ${expr}`,
	   () => {
	       let y = parser.parse(expr);
	       infixValidation(y,'+');
	       assert.equal(y.statements[0].expr.rightOperand.node,'PrefixExpression');
	       assert.equal(y.statements[0].expr.rightOperand.operator,op);
	   })
	}
    }
    for (let op1 of binary_precedences) {
	for (let op2 of binary_precedences) {
	    const expr = `A=B${op1.op}C${op2.op}D;`;
	    if (op1.prec < op2.prec) {
		it(`should parse ${expr} with operator ${op1.op} at the tree root`, () => {
		    let y = parser.parse(expr);
		    infixValidation(y,op1.op);
		})
	    } else if (op1.prec > op2.prec) {
		it(`should parse ${expr} with operator ${op2.op} at the tree root`, () => {
		    let y = parser.parse(expr);
		    infixValidation(y,op2.op);
		})
	    }
	}
    }
    for (let op1 of unary_precedences) {
	for (let op2 of binary_precedences) {
	    const expr = `A=${op1.op}C${op2.op}D;`;
	    if (op1.prec < op2.prec) {
		it(`should parse ${expr} with unary operator ${op1.op} at the tree root`, () => {
		    let y = parser.parse(expr);
		    prefixValidation(y,op1.op);
		});
	    } else {
		it(`should parse ${expr} with unary operator ${op1.op} at the tree root`, () => {
		    let y = parser.parse(expr);
		    infixValidation(y,op2.op);
		});
	    }
	}
    }
});
