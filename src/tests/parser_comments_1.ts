import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";

const chai = require('chai');
const assert = chai.assert;

@suite("Parser comments")
export class Comments {
    comment_cases = ['a = 32; %inline comment\n',
        'a = 32 %inline comment, no semicolon \n',
        '% Comment above,\n a = 32;\n',
        '% Comment above,\na = 32;\n',
        '% Comment above, single empty after\n a = 32;%\n',
        '% Comment above, single empty after - no semi\n a = 32%\n',
        '% Comments bracket\n a = 32; % and inline\n',
        '\n   %{\n Block comments\n can span multiple\n lines\n%}\na=32;'
    ];
    @test("should parse statements with comments")
    simple_statement() {
        for (let comment of this.comment_cases) {
            console.log("/*\n", comment, "*/\n");
            const y = parse(comment);
            const h = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
            assert.equal(h.statements.length, 1);
        }
    }
}
