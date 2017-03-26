import { suite, test } from "mocha-typescript";
import * as AST from "../ast";
import { parse, assertCast } from "./test_utils";

const assert = require('chai').assert;

function validate_multiassignment(y: AST.Node) {
    const f = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
    assert.equal(f.statements.length, 1);
    const g = assertCast<AST.MultiAssignmentStatement>(f.statements[0], AST.SyntaxKind.MultiAssignmentStatement);
    return g;
}

@suite("Parser multiassignment statements")
export class MultiAssignments {
    @test("should parse a basic multiassignment statement")
    basic_multiassignment() {
        for (let sep of [',', ' ']) {
            const expr = `[A${sep}B${sep}C]=foo();`;
            const y = parse(expr);
            let f = validate_multiassignment(y);
            assert.equal(f.lhs.length, 3);
            for (let i = 0; i < 3; i++) {
                const k = assertCast<AST.VariableDereference>(f.lhs[i], AST.SyntaxKind.VariableDereference);
                assert.equal(k.identifier.name, (['A', 'B', 'C'])[i]);
            }
        }
    }
}
