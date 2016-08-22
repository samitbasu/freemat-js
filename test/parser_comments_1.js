'use strict';
/* global describe it */
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

describe('parser comments', function() {
    const comment_cases = ['a = 32; %inline comment\n',
                           'a = 32 %inline comment, no semicolon \n',
                           '% Comment above,\n a = 32;\n',
                           '% Comment above,\na = 32;\n',
                           '% Comment above, single empty after\n a = 32;%\n',
                           '% Comment above, single empty after - no semi\n a = 32%\n',
                           '% Comments bracket\n a = 32; % and inline\n'];
    for (const comment of comment_cases) {
        it(`should parse a simple statement with comments:\n**\n${comment}\n**\n`, () => {
            const y = parser.parse(comment);
            assert.equal(y.node,'Block');
            assert.equal(y.statements.length,1);
        });
    }
});
