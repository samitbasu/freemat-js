/* global describe it */
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

'use strict';

function validate_multiassignment(y) {
    assert.equal(y.node,'Block');
    assert.equal(y.statements.length,1);
    const f = y.statements[0];
    assert.equal(f.node,'MultiAssignmentStatement');
    return f.lhs;
}

describe('parser multiassignment statements', function() {
    for (let sep of [',',' ']) {
        const expr = `[A${sep}B${sep}C]=foo();`;
        it(`should parse a basic multiassignment statement: ${expr}`, () => {
            const y = parser.parse(expr);
            let f = validate_multiassignment(y);
            assert.equal(f.length,3);
            for (let i=0;i<3;i++) 
                assert.equal(f[i].node,'VariableDereference');
            assert.equal(f[0].identifier,'A');
            assert.equal(f[1].identifier,'B');
            assert.equal(f[2].identifier,'C');
        });
    }
});
