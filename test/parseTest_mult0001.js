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
});
