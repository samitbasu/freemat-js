const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js')
const loop_cases = [{expr: 'for i=1:10; a(i) = i; end;', desc: 'simple colon'},
		    {expr: 'for i=1:1:10; a(i) = i; end;', desc: 'double colon'},
		    {expr: 'for i=A; a(i) = i; end;', desc: 'matrix columns'},
		    {expr: 'for (i=1:10); a(i) = i; end;', desc: 'parentheses + simple colon'},
		    {expr: 'for i=1:10\n a(i) = i; end;', desc: 'simple colon'},
		    {expr: 'for i=1:1:10\n a(i) = i; end;', desc: 'double colon'},
		    {expr: 'for i=A\n a(i) = i; end;', desc: 'matrix columns'},
		    {expr: 'for (i=1:10)\n a(i) = i; end;', desc: 'parentheses + simple colon'},
		    {expr: 'for (i=1:10)\n end;', desc: 'parentheses + simple colon, empty block'}];

describe('parser for loops', function() {
    for (let lcase of loop_cases) {
	it(`should parse for loop ${lcase.expr} with indices of ${lcase.desc}`, () => {
	    const y = parser.parse(lcase.expr);
	    assert.equal(y.node,'Block');
	    assert.equal(y.statements.length,1);
	    const f = y.statements[0];
	    assert.equal(f.node,'ForStatement');
	    assert.equal(f.body.node,'Block');
	    assert.equal(f.expression.node,'ForExpression');
	    assert.equal(f.expression.identifier.identifier,'i');
	});
    }
});
