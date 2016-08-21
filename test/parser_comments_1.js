'use strict';
/* global describe it */
const chai = require('chai');
const assert = chai.assert;
const parser = require('../freemat.js');

describe('parser comments', function() {
    const comment_cases = ['a = 32; %inline comment\n',
                           '% Comment above,\n a = 32;\n',
                           '% Comments bracket\n a = 32; % and inline\n'];
    for (const comment of comment_cases) {
        it(`should parse a simple statement with comments: ${comment}`, () => {
            const y = parser.parse(comment);
            assert.equal(y.node,'Block');
            assert.isAtLeast(y.statements.length,1);
        });
    }
});
