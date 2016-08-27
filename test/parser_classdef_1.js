/* global describe it */
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

'use strict';

function validate_classdef(y) {
    assert.equal(y.node,'Block');
    assert.equal(y.statements.length,1);
    const f = y.statements[0];
    assert.equal(f.node,'ClassDefinition');
    return f;
}

describe('parser function declaration', function() {
    const cdef = `
    classdef foo;
    end
    `;
    it(`should parse a minimal class def:\n${cdef}`, () => {
        validate_classdef(parser.parse(cdef));
    });
    const cdef2 = `
    classdef foo
    properties
    end
    end
    `;
    it(`should allow a properties block:\n${cdef2}`, () => {
        const f = validate_classdef(parser.parse(cdef2));
        assert.equal(f.blocks.length,1);
        assert.equal(f.blocks[0].node,'PropertyBlock');
    });
    const cdef3 = `
    classdef foo
    properties
    A
    B = 3
    end
    end
    `;
    it(`should allow for properties with and without default values:\n${cdef3}`, () => {
        const f = validate_classdef(parser.parse(cdef3));
        assert.equal(f.blocks.length,1);
        let p = f.blocks[0];
        assert.equal(p.node,'PropertyBlock');
        assert.equal(p.properties.length,2);
        assert.equal(p.properties[0].identifier,'A');
        assert.equal(p.properties[1].identifier,'B');
        assert.equal(p.properties[1].init.token,'3');
    });
});
