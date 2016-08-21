'use strict';
/* global describe it */
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

function validate_assignment(y) {
    assert.equal(y.node,'Block');
    assert.equal(y.statements.length,1);
    assert.equal(y.statements[0].node,'AssignmentStatement');
    return y.statements[0];
}

describe('parser string constants', function() {
    const test_strings = ['', 'hello', ' world ', 'foo bar', 'with "s inside" it', 'with \'\'\' inside'];
    for (let tstring of test_strings) {
	const escaped_string = `\'${tstring}\'`;
	it(`should handle string literals: a = ${escaped_string};`, () => {
	    const y = validate_assignment(parser.parse(`a = ${escaped_string};`));
	    assert.equal(y.expr.node,'StringLiteral');
	    assert.equal(y.expr.escapedValue,escaped_string);
	});
    }
    for (let tstring of test_strings) {
	const escaped_string = `\'${tstring}\'`;
	it(`should handle string literals: a = [${escaped_string}];`, () => {
	    const y = validate_assignment(parser.parse(`a = [${escaped_string}];`));
	    assert.equal(y.expr.expression[0][0].node,'StringLiteral');
	    assert.equal(y.expr.expression[0][0].escapedValue,escaped_string);
	});
    }
    for (let tstring of test_strings) {
	const escaped_string = `\'${tstring}\'`;
	it(`should handle string literals: a = {${escaped_string}};`, () => {
	    const y = validate_assignment(parser.parse(`a = {${escaped_string}};`));
	    assert.equal(y.expr.expression[0][0].node,'StringLiteral');
	    assert.equal(y.expr.expression[0][0].escapedValue,escaped_string);
	});
    }    
});
