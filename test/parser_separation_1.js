'use strict';
/* global describe it */
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

describe('parser separations', function() {
    const assignment_tests = ['c = \'hello\'\n',
                              'c = \'hello\' \n',
                              'c = \'hello\'% comment\n',
                              'c = \'hello\';% comment\n',
                              'c = \'hello\',% comment\n',
                              'c = \'hello\';...\n% comment\n',
                              'c = \'hello\',...\n% comment\n',
                              'c = \'hello\' % comments\n',
                              'c = \'hello\'...\n\n',
                             ];
    for (const testcase of assignment_tests) {
        it(`should parse this as an assignment:\n${testcase}`, () => {
            const p = parser.parse(testcase);
            assert.equal(p.statements[0].node,'AssignmentStatement');
        });
    }
});
