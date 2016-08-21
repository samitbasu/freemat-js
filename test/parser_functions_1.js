/* global describe it */
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

'use strict';

function validate_function(y) {
    assert.equal(y.node,'Block');
    assert.equal(y.statements.length,1);
    const f = y.statements[0];
    assert.equal(f.node,'FunctionDefinition');
    return f;
}

describe('parser function declaration', function() {
    for (let sep of [',',' ']) {
        const expr = `function [A${sep}B${sep}C]=foo(X,Y,&Z); end;`;
        it(`should parse a basic multireturn, minimal function: ${expr}`, () => {
            const y = parser.parse(expr);
            let f = validate_function(y);
            assert.equal(f.returns.length,3);
            assert.equal(f.returns[0],'A');
            assert.equal(f.returns[1],'B');
            assert.equal(f.returns[2],'C');
            assert.equal(f.args.length,3);
	    assert.equal(f.args[0],'X');
	    assert.equal(f.args[1],'Y');
	    assert.equal(f.args[2],'&Z');
        });
    }
    const empty_functions = ['function [] = foo(); end;',
                             'function foo(); end;',
                             'function [] = foo; end;',
                             'function foo; end;'];
    for (let empty of empty_functions) {
        it(`should parse a basic empty function: ${empty}`, () => {
            const f = validate_function(parser.parse(empty));
            assert.equal(f.returns.length,0);
            assert.equal(f.args.length,0);
	    assert.equal(f.name,'foo');
        });
    }
    it('should handle an optional end: function y = foo(x); y = x;', () => {
	const f = validate_function(parser.parse('function y = foo(x); y = x;'));
	assert.equal(f.returns.length,1);
	assert.equal(f.args.length,1);
	assert.equal(f.name,'foo');
	assert.equal(f.body.node,'Block');
	assert.equal(f.body.statements.length,1);
    });
});
