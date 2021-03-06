import Tokenize from "../scanner"
import { Parser } from "../parser"
import * as AST from "../ast"
import { Set, FMArray, MakeComplex, FnMakeScalarReal, FnMakeScalarComplex, FnMakeScalarLogical, mkArray, FMValue } from "../arrays"

export const mks = FnMakeScalarReal;

export const mkc = FnMakeScalarComplex;

export const mkl = FnMakeScalarLogical;

const assert = require('chai').assert;

export function assertCast<T extends AST.Node>(f: AST.Node, k: AST.SyntaxKind): T {
    assert.equal(f.kind, k);
    return (f as T);
}

export function tic(): number {
    let t = process.hrtime();
    return t[0] + t[1] / 1.0e9;
}

export function time_it(func: () => void): number {
    let t1 = tic();
    func();
    let t2 = (tic() - t1);
    console.log("      -> Time Elapsed ", t2, " s");
    return t2;
}

export function parse(txt: string): AST.Block {
    let toks = Tokenize(txt);
    let pars = new Parser(toks, txt);
    return pars.block();
}

export function mkv(p: number[]): FMArray {
    return new FMArray([1, p.length], p);
}

export function rand_array_complex(dims: number[]): FMArray {
    let C = MakeComplex(new FMArray(dims));
    for (let ndx = 0; ndx < C.length; ndx++) {
        C.real[ndx] = Math.floor(Math.random() * 10);
        C.imag![ndx] = Math.floor(Math.random() * 10);
    }
    return C;
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
            C = Set(C, [mks(row), mks(col)], mks(row * cols + col));
    return C;
}

export function test_mat_complex(rows: number, cols: number): FMArray {
    let C = new FMArray([rows, cols]);
    for (let row = 1; row <= rows; row++)
        for (let col = 1; col <= cols; col++)
            C = Set(C, [mks(row), mks(col)],
                mkc( row * cols + col, row * cols - col ));
    return C;
}

export function mat_equal(A: FMValue, B: FMValue): boolean {
    A = mkArray(A);
    B = mkArray(B);
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

