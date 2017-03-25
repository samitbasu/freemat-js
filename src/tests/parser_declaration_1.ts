import { suite, test } from "mocha-typescript";
import { parse, assertCast } from "./test_utils";
import * as AST from "../ast";

const chai = require('chai');
const assert = chai.assert;

function validate_declaration(y: AST.Node): AST.DeclarationStatement {
    const x = assertCast<AST.Block>(y, AST.SyntaxKind.Block);
    assert.equal(x.statements.length, 1);
    return assertCast<AST.DeclarationStatement>(x.statements[0], AST.SyntaxKind.DeclarationStatement);
}

@suite("Parser declaration statements")
export class Declarations {
    decl_types = [{ op: 'global', kind: AST.SyntaxKind.GlobalToken },
    { op: 'persistent', kind: AST.SyntaxKind.PersistentToken }];

    @test("should parse a basic declaration")
    basic_case() {
        for (let decl_type of this.decl_types) {
            const expr = `${decl_type.op} A;`;
            console.log("      -> ", expr);
            const y = parse(expr);
            const f = validate_declaration(y);
            assert.equal(f.scope, decl_type.kind);
            assert.equal(f.vars.length, 1);
            assert.equal(f.vars[0].identifier.name, 'A');
        }
    }
    @test("should parse a declaration with multiple variables")
    multiple_case() {
        for (let decl_type of this.decl_types) {
            const expr = `${decl_type.op} A B C;`;
            console.log("      -> ", expr);
            const y = parse(expr);
            const f = validate_declaration(y);
            assert.equal(f.scope, decl_type.kind);
            assert.equal(f.vars.length, 3);
            assert.equal(f.vars[0].identifier.name, 'A');
            assert.equal(f.vars[1].identifier.name, 'B');
            assert.equal(f.vars[2].identifier.name, 'C');
        }
    }
}
