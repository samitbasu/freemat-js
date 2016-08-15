const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js')

function validate_switch(y) {
    assert.equal(y.node,'Block');
    assert.equal(y.statements.length,1);
    const f = y.statements[0];
    assert.equal(f.node,'SwitchStatement');
    return f;
}

describe('parser switch statements', function() {
    it('should parse a basic switch statement', () => {
	const y = parser.parse('switch(true), end;');
	const f = validate_switch(y);
	assert.equal(f.cases.length,0);
	assert.equal(f.expression.node,'VariableDereference');
    });
    it('should parse a switch statement with a single case', () => {
	const y = parser.parse('switch(true), case false, end;');
	const f = validate_switch(y);
	assert.equal(f.cases.length,1);
	assert.equal(f.cases[0].node,'CaseStatement');
	assert.equal(f.expression.node,'VariableDereference');
	assert.equal(f.otherwise,null);
    });
    it('should parse a switch statement with a cell array for the case test', () => {
	const y = parser.parse('switch(true), case {1,2,3}, end;');
	const f = validate_switch(y);
	assert.equal(f.cases.length,1);
	assert.equal(f.cases[0].node,'CaseStatement');
	assert.equal(f.cases[0].expression.node,'CellDefinition');
	assert.equal(f.otherwise,null);
    });
    it('should parse a switch statement with an otherwise clause correctly', () => {
	const y = parser.parse('switch(true), otherwise, end;');
	const f = validate_switch(y);
	assert.equal(f.cases.length,0);
	assert.equal(f.otherwise.node,'OtherwiseStatement');
	assert.equal(f.otherwise.body.node,'Block');
    });
    it('should parse a switch statement with multiple cases and an otherwise clause correctly', () => {
	const f = validate_switch(parser.parse('switch(true), case 2, case 1, otherwise, end;'));
	assert.equal(f.cases.length,2);
	assert.equal(f.otherwise.node,'OtherwiseStatement');
	assert.equal(f.cases[0].expression.token,'2');
	assert.equal(f.cases[1].expression.token,'1');
    });
    
});
