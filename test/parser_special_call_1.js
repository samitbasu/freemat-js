/* global describe it */
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

'use strict';

function validate_statement(y) {
    assert.equal(y.node,'Block');
    assert.equal(y.statements.length,1);
    return y.statements[0];
}

const ops = ['||','&&','|','&','<=','>=','<','>','==','~=','+','-','.*','./',
             '.\\','*','/','\\','~','.^','^','='];

describe('parser special call statements', function() {
    it('should parse special call statement: foo on 32', () => {
        const f = validate_statement(parser.parse('foo on 32 --hellp;'));
        assert.equal(f.node,'SpecialFunctionCall');
        assert.equal(f.func,'foo');
        assert.equal(f.args.length,3);
        assert.equal(f.args[0],'on');
        assert.equal(f.args[1],'32');
        assert.equal(f.args[2],'--hellp');
    });
    for (let op of ops) {
        const expr = `foo ${op} bar;`;
        if (op !== '~') {
            it(`should not parse special calls when operators can be consumed: ${expr}`, () => {
                const f = validate_statement(parser.parse(expr));
                assert.oneOf(f.node,['AssignmentStatement','ExpressionStatement']);
            });
        }
    }
    for (let op of ops) {
        if (op !== '=') {
            const expr = `foo ${op}bar;`;
            it(`should parse special calls when operators are not surrounded by whitespace: ${expr}`, () => {
                const f = validate_statement(parser.parse(expr));
                assert.equal(f.node,'SpecialFunctionCall');
            });
        }
    }
});
