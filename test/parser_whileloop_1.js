const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js')
const loop_cases = [{expr: 'while (true), end;', desc: 'simplest loop, comma sep'},
		    {expr: 'while (true); end;', desc: 'simplest loop, semi sep'},
		    {expr: 'while (true)\n end;', desc: 'simplest loop, newline sep'},
		    {expr: 'while true, end;', desc: 'simplest loop, comma sep, no parentheses'},
		    {expr: 'while true; end;', desc: 'simplest loop, semi sep, no parens'},
		    {expr: 'while true\n end;', desc: 'simplest loop, newline sep, no parens'}];


describe('parser while loops', function() {
    for (let lcase of loop_cases) {
	it(`should parse while loop ${lcase.expr} with indices of ${lcase.desc}`, () => {
	    const y = parser.parse(lcase.expr);
	    assert.equal(y.node,'Block');
	    assert.equal(y.statements.length,1);
	    const f = y.statements[0];
	    assert.equal(f.node,'WhileStatement');
	    assert.equal(f.body.node,'Block');
	});
    }
});
