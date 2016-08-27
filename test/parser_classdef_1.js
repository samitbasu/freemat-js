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
        const f = validate_classdef(parser.parse(cdef));
        assert.equal(f.name,'foo');
        assert.equal(f.blocks.length,0);
        assert.equal(f.attributes.length,0);
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
        assert.equal(f.blocks[0].attributes.length,0);
        assert.equal(f.blocks[0].properties.length,0);
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
        const p = f.blocks[0];
        assert.equal(p.node,'PropertyBlock');
        assert.equal(p.properties.length,2);
        assert.equal(p.properties[0].identifier,'A');
        assert.equal(p.properties[1].identifier,'B');
        assert.equal(p.properties[1].init.token,'3');
    });
    const cdef4 = `
    classdef foo
    properties (attr1,attr2=42)
    A
    B = 5
    end
    end
    `;
    it(`should allow for properties to be tagged with attributes either as names or with values:\n${cdef4}`, () => {
        const f = validate_classdef(parser.parse(cdef4));
        assert.equal(f.blocks.length,1);
        const p = f.blocks[0];
        assert.equal(p.node,'PropertyBlock');
        assert.equal(p.properties.length,2);
        assert.equal(p.properties[0].identifier,'A');
        assert.equal(p.properties[1].identifier,'B');
        assert.equal(p.properties[1].init.token,'5');
        assert.equal(p.attributes.length,2);
        assert.equal(p.attributes[0].identifier,'attr1');
        assert.equal(p.attributes[1].identifier,'attr2');
        assert.equal(p.attributes[1].init.token,'42');
    });
    const cdef5 = `
    classdef foo
    properties (attr1)
    A
    end
    properties (attr3)
    B
    end
    end
    `;
    it(`should allow for multiple properties blocks:\n${cdef5}`, () => {
        const f = validate_classdef(parser.parse(cdef5));
        assert.equal(f.blocks.length,2);
        assert(f.blocks[0].node,'PropertyBlock');
        assert(f.blocks[0].properties.length,1);
        assert(f.blocks[0].properties[0].identifier,'A');
        assert(f.blocks[0].attributes.length,1);
        assert(f.blocks[0].attributes[0].identifier,'attr1');
        assert(f.blocks[1].node,'PropertyBlock');
        assert(f.blocks[1].properties.length,1);
        assert(f.blocks[1].properties[0].identifier,'A');
        assert(f.blocks[1].attributes.length,1);
        assert(f.blocks[1].attributes[0].identifier,'attr1');
    });
    const cdef6 = `
    classdef (attr1, attr2 = 42) foo
    end
    `;
    it(`should allow for attributes after the classdef:\n${cdef6}`, () => {
        const f = validate_classdef(parser.parse(cdef6));
        assert.equal(f.attributes.length,2);
        assert.equal(f.attributes[0].node,'Attribute');
        assert.equal(f.attributes[0].identifier,'attr1');
        assert.equal(f.attributes[1].node,'Attribute');
        assert.equal(f.attributes[1].identifier,'attr2');
        assert.equal(f.attributes[1].init.token,'42');
        assert.equal(f.name,'foo');
    });
    const cdef7 = `
    classdef foo < bar
    end
    `;
    it(`should allow for specification of a super class:\n${cdef7}`, () => {
        const f = validate_classdef(parser.parse(cdef7));
        assert.equal(f.sup.length,1);
        assert.equal(f.sup[0],'bar');
    });
    const cdef8 = `
    classdef foo < bar & baz
    end
    `;
    it(`should allow for multiple super classes:\n${cdef8}`, () => {
        const f = validate_classdef(parser.parse(cdef8));
        assert.equal(f.sup.length,2);
        assert.equal(f.sup[0],'bar');
        assert.equal(f.sup[1],'baz');
    });
    const cdef9 = `
    classdef foo
    methods
    end
    end
    `;
    it(`should allow for an empty methods block:\n${cdef9}`, () => {
        const f = validate_classdef(parser.parse(cdef9));
        assert.equal(f.blocks.length,1);
        assert.equal(f.blocks[0].node,'MethodBlock');
        assert.equal(f.blocks[0].methods.length,0);
        assert.equal(f.blocks[0].attributes.length,0);
    });
    const cdef10 = `
    classdef foo
      methods (attr1, attr2 = 42)
        function x = bar()
        end
      end
    end
    `;
    it(`should allow for method blocks with functions and attributes:\n${cdef10}`, () => {
        const f = validate_classdef(parser.parse(cdef10));
        const g = f.blocks[0];
        assert.equal(g.node,'MethodBlock');
        console.log(g);
        assert.equal(g.methods.length,1);
        assert.equal(g.attributes.length,2);
        assert.equal(g.attributes[0].identifier,'attr1');
        assert.equal(g.attributes[1].identifier,'attr2');
        assert.equal(g.attributes[1].init.token,'42');
        assert.equal(g.methods[0].node,'FunctionDefinition');
        assert.equal(g.methods[0].returns.length,1);
        assert.equal(g.methods[0].name,'bar');
        assert.equal(g.methods[0].args.length,0);
    });
    const cdef11 = `
    classdef foo
      methods (attr1, attr2 = 42)
        function x = bar()
        end
      end
      methods
        function baz
        end
      end
    end
    `;
    it(`should allow for multiple method blocks and functions without arguments:\n${cdef11}`, () => {
        const f = validate_classdef(parser.parse(cdef11));
        assert.equal(f.blocks.length,2);
        assert.equal(f.blocks[0].node,'MethodBlock');
        assert.equal(f.blocks[0].methods.length,1);
        assert.equal(f.blocks[0].methods[0].node,'FunctionDefinition');
        assert.equal(f.blocks[0].methods[0].name,'bar');
        assert.equal(f.blocks[1].node,'MethodBlock');
        assert.equal(f.blocks[1].methods.length,1);
        assert.equal(f.blocks[1].methods[0].node,'FunctionDefinition');
        assert.equal(f.blocks[1].methods[0].name,'baz');
    });
});
