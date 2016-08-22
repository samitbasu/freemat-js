'use strict';
/* global describe it */
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

describe('parser continuations', function() {
    const continuation_cases = ['function X y = foo(x); X end\n',
                                'a = X 5 + 4; X\n',
                                'b = [3 X 4 5];\n',
                                'c = \'Hello\' X % comment\n',
                                'c = \'Hello\'X % comment\n',
                                'd = 62% X\n'];
    for (const testcase of continuation_cases) {
        const expr_no_cont = testcase.replace(/X/g,'');
        const expr_w_cont_only = testcase.replace(/X/g,'...\n');
        it(`should parse a statement with continuations:\n**\n${expr_no_cont}\n**\n${expr_w_cont_only}\n**\n`, () => {
            const parse1 = parser.parse(expr_no_cont);
            const parse2 = parser.parse(expr_w_cont_only);
            assert.deepEqual(parse1,parse2);
        });
    }
    for (const testcase of continuation_cases) {
        const expr_no_cont = testcase.replace(/X/g,'');
        const expr_w_cont_comment = testcase.replace(/X/g,'... % injected continuation\n');
        it(`should parse a statement with continuations and comments:\n**\n${expr_no_cont}\n**\n${expr_w_cont_comment}\n**\n`, () => {
            const parse1 = parser.parse(expr_no_cont);
            const parse2 = parser.parse(expr_w_cont_comment);
            assert.deepEqual(parse1,parse2);
        });
    }
    const assignment_tests = ['c = \'hello\'\n',
                              'c = \'hello\' \n',
                              'c = \'hello\'% comment\n',
                              'c = \'hello\';% comment\n',
                              'c = \'hello\',% comment\n',
                              'c = \'hello\';...\n% comment\n',
                              'c = \'hello\',...\n% comment\n',
                              'c = \'hello\' % comments\n',
                              'c = \'hello\'...\n\n'
                             ];
    for (const testcase of assignment_tests) {
        it(`should parse this as an assignment:\n${testcase}`, () => {
            const p = parser.parse(testcase);
            assert.equal(p.statements[0].node,'AssignmentStatement');
        });
    }
});
