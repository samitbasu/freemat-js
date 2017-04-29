import Tokenize from "../scanner"
import { Parser } from "../parser"
import * as AST from "../ast"
import { Set, FMArray, FnMakeScalarReal, FnMakeScalarComplex } from "../arrays"

export const mks = FnMakeScalarReal;

export const mkc = FnMakeScalarComplex;

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

export function mkv(p: number[]): FMArray {
    return new FMArray([1, p.length], p);
}

export function rand_array(dims: number[]): FMArray {
    let C = new FMArray(dims);
    for (let ndx = 0; ndx < C.length; ndx++)
        C.real[ndx] = Math.floor(Math.random() * 10);
    return C;
}

export function test_mat(rows: number, cols: number): FMArray {
    let C = new FMArray([rows, cols]);
    for (let row = 1; row <= rows; row++)
        for (let col = 1; col <= cols; col++)
            C = Set(C, mkv([row, col]), mks(row * cols + col));
    return C;
}

export function test_mat_complex(rows: number, cols: number): FMArray {
    let C = new FMArray([rows, cols]);
    for (let row = 1; row <= rows; row++)
        for (let col = 1; col <= cols; col++)
            C = Set(C, mkv([row, col]), mkc([row * cols + col, row * cols - col]));
    return C;
}

export function mat_equal(A: FMArray, B: FMArray): boolean {
    if (A.dims.length !== B.dims.length) return false;
    for (let i = 0; i < A.dims.length; i++)
        if (A.dims[i] !== B.dims[i]) return false;
    if (A.length !== B.length) return false;
    for (let i = 0; i < A.length; i++)
        if (A.real[i] !== B.real[i]) return false;
    if (A.imag && !(B.imag)) return false;
    if (B.imag && !(A.imag)) return false;
    if (A.imag && B.imag) {
        for (let i = 0; i < A.length; i++)
            if (A.imag[i] !== B.imag[i]) return false;
    }
    return true;
}
