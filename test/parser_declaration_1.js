const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

decl_types = [{op:'global'},{op:'persistent'}];

function validate_declaration(y) {
    assert.equal(y.node,'Block');
    assert.equal(y.statements.length,1);
    const f = y.statements[0];
    assert.equal(f.node,'DeclarationStatement');
    return f;
}

describe('parser declaration statements', function() {
    for (let decl_type of decl_types) {
	it(`should parse a basic ${decl_type.op} declaration: ${decl_type.op} A;`, () => {
	    const y = parser.parse(`${decl_type.op} A;`);
	    let f = validate_declaration(y);
	    assert.equal(f.identifiers.length,1);
	    assert.equal(f.identifiers[0],'A');
	    assert.equal(f.type,decl_type.op);
	});
	it(`should parse a basic ${decl_type.op} declaration with multiple idents: ${decl_type.op} A B C;`, () => {
	    const y = parser.parse(`${decl_type.op} A B C;`);
	    let f = validate_declaration(y);
	    assert.equal(f.identifiers.length,3);
	    assert.equal(f.identifiers[0],'A');
	    assert.equal(f.identifiers[1],'B');
	    assert.equal(f.identifiers[2],'C');
	    assert.equal(f.type,decl_type.op);
	});
    }
});
