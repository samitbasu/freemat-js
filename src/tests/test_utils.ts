import Tokenize from "../scanner"
import { Parser } from "../parser"
import * as AST from "../ast"

const assert = require('chai').assert;

export function assertCast<T extends AST.Node>(f: AST.Node, k: AST.SyntaxKind): T {
    assert.equal(f.kind, k);
    return (f as T);
}

export function parse(txt: string): AST.Block {
    let toks = Tokenize(txt);
    let pars = new Parser(toks, txt);
    return pars.block();
}

