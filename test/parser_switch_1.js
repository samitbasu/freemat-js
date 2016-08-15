const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js')

describe('parser switch statements', function() {
    it(`should parse a basic switch statement`, () => {
	const y = parser.parse('switch(true), end;');
	assert.equal(y.node,'Block');
	assert.equal(y.statements.length,1);
	const f = y.statements[0];
	assert.equal(f.node,'SwitchStatement');
    });
});
