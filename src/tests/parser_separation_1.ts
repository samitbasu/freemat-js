import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";

const assert = require('chai').assert;

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

@suite("Parser separations")
export class Separations {
    @test("should parse this as an assignment")
    separations() {
        for (const testcase of assignment_tests) {
            console.log("      -> ", testcase);
            const p = parse(testcase);
            const g = assertCast<AST.Block>(p, AST.SyntaxKind.Block);
            assertCast<AST.AssignmentStatement>(g.statements[0], AST.SyntaxKind.AssignmentStatement);
        }
    }
}
