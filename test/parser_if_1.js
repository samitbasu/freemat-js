const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js')
const if_cases = [{expr: 'if (true), end;', desc: 'simplest if, comma sep'},
		  {expr: 'if (true); end;', desc: 'simplest if, semi sep'},
		  {expr: 'if (true)\n end;', desc: 'simplest if, newline sep'},
		  {expr: 'if true, end;', desc: 'simplest if, comma sep, no parentheses'},
		  {expr: 'if true; end;', desc: 'simplest if, semi sep, no parens'},
		  {expr: 'if true\n end;', desc: 'simplest if, newline sep, no parens'},
		  {expr: 'if true; else, end;', desc: 'simplest if with else'},
		  {expr: 'if true, elseif false, else, end;', desc:'simplest if with elseif and else'},
		  {expr: 'if true, elseif false, end;', desc:'simplest if with elseif and no else'},
		  {expr: 'if true, elseif true, elseif false, else, end;', desc:'if with multiple elseifs and else'}];

describe('parser if statements', function() {
    for (let lcase of if_cases) {
	it(`should parse if statement ${lcase.expr} with indices of ${lcase.desc}`, () => {
	    const y = parser.parse(lcase.expr);
	    assert.equal(y.node,'Block');
	    assert.equal(y.statements.length,1);
	    const f = y.statements[0];
	    assert.equal(f.node,'IfStatement');
	    assert.equal(f.body.node,'Block');
	});
    }
    it(`should parse an if statement with multiple elseif correctly`, () => {
	const y = parser.parse('if true, elseif true, elseif false, else, end;');
	assert.equal(y.node,'Block');
	assert.equal(y.statements.length,1);
	const f = y.statements[0];
	assert.equal(f.node,'IfStatement');
	assert.equal(f.body.node,'Block');
	assert.equal(f.elifs.length,2);
	assert.equal(f.els.node,'ElseStatement');
	assert.equal(f.els.body.node,'Block');
    });
});
