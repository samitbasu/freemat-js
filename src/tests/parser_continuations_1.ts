import { suite, test } from "mocha-typescript";
import { parse } from "./test_utils";

const chai = require('chai');
const assert = chai.assert;

@suite("Parser continuations")
export class Continuations {
    continuation_cases = ['function X y = foo(x); X end\n',
        'a = X 5 + 4; X\n',
        'b = [3 X 4 5];\n',
        'c = \'Hello\' X % comment\n',
        'c = \'Hello\'X % comment\n',
        'd = 62% X\n'];
    @test("should parse statements with continuations")
    continuation() {
        for (let testcase of this.continuation_cases) {
            const expr_no_cont = testcase.replace(/X/g, '');
            const expr_w_cont_only = testcase.replace(/X/g, '...\n');
            console.log(`\n**\n${expr_no_cont}\n**\n${expr_w_cont_only}\n**\n`);
            const parse1 = parse(expr_no_cont);
            const parse2 = parse(expr_w_cont_only);
            assert.deepEqual(parse1, parse2);
        };
    }
}
