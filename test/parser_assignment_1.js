/* global describe it */
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

'use strict';

function validate_assignment(y) {
    assert.equal(y.node,'Block');
    assert.equal(y.statements.length,1);
    const f = y.statements[0];
    assert.equal(f.node,'AssignmentStatement');
    assert.equal(f.lhs.node,'VariableDereference');
    assert.equal(f.lhs.identifier,'A');
    return f.lhs;
}

const spaces = [
    {
        txt: '',
        desc: ''
    },
    {
        txt: ' ',
        desc: 'with space'
    }];

const index_ops = [
    {
        op: '.foo',
        valid: (f) => {
            assert.equal(f.node,'FieldExpression');
            assert.equal(f.identifier,'foo');
        }
    },
    {
        op: '.(foo)',
        valid: (f) => {
            assert.equal(f.node,'DynamicFieldExpression');
            assert.equal(f.expression.identifier,'foo');
        }
    },
    {
        op: '(12)',
        valid: (f) => {
            assert.equal(f.node,'ArrayIndexExpression');
            assert.equal(f.expression.token,'12');
        }
    },
    {
        op: '{12}',
        valid: (f) => {
            assert.equal(f.node,'CellIndexExpression');
            assert.equal(f.expression.token,'12');
        }
    }];

describe('parser assignment statements', function() {
    it('should parse a basic assignment statement: A=42;', () => {
        const y = parser.parse('A=42;');
        let f = validate_assignment(y);
        assert.equal(f.deref.length,0);
    });
    for (let ndx of index_ops) {
        const expr = `A${ndx.op} = 42;`;
        it(`should parse a field assignment statement: ${expr}`, () => {
            const y = parser.parse(expr);
            let f = validate_assignment(y);
            assert.equal(f.deref.length,1);
            ndx.valid(f.deref[0]);
        });
    }
    for (let spc of spaces) {
        for (let ndx1 of index_ops) {
            for (let ndx2 of index_ops) {
                const expr = `A${spc.txt}${ndx1.op}${spc.txt}${ndx2.op} = 42;`;
                it(`should parse a multiple index expression ${spc.desc}: ${expr}`, () => {
                    const y = parser.parse(expr);
                    let f = validate_assignment(y);
                    assert.equal(f.deref.length,2);
                    ndx1.valid(f.deref[0]);
                    ndx2.valid(f.deref[1]);
                });
            }
        }
    }
});
