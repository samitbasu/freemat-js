'use strict';
/* global describe it */
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

function validate_try(y) {
    assert.equal(y.node,'Block');
    assert.equal(y.statements.length,1);
    const f = y.statements[0];
    assert.equal(f.node,'TryStatement');
    return f;
}

describe('parser try statements', function() {
    it('should parse a basic try statement', () => {
        const y = parser.parse('try, end;');
        const f = validate_try(y);
        assert.equal(f.cat,null);
    });
    it('should parse a basic try/catch statement', () => {
        const f = validate_try(parser.parse('try, catch, end;'));
        assert.equal(f.cat.node,'CatchStatement');
    });
    it('should parse a basic try/catch statement with an exception identifier', () => {
        const f = validate_try(parser.parse('try, catch foo, end;'));
        assert.equal(f.cat.node,'CatchStatement');
        assert.equal(f.cat.identifier,'foo');
    });
});
