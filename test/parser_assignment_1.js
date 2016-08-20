const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

function validate_assignment(y) {
    assert.equal(y.node,'Block');
    assert.equal(y.statements.length,1);
    const f = y.statements[0];
    assert.equal(f.node,'AssignmentStatement');
    assert.equal(f.identifier.node,'VariableDereference');
    return f;
}

describe('parser assignment statements', function() {
    it(`should parse a basic assignment statement: A=32;`, () => {
	const y = parser.parse(`A=32;`);
	let f = validate_assignment(y);
	assert.equal(f.identifier.identifier,'A');
	assert.equal(f.identifier.deref.length,0);
	console.log(f);
    });
    it(`should parse a field assignment statement: A.foo = 32;`, () => {
	const y = parser.parse('A.foo = 32;');
	let f = validate_assignment(y);
	assert.equal(f.identifier.identifier,'A');
    });
});
