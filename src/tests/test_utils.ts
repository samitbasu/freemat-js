import Tokenize from "../scanner"
import { Parser } from "../parser"
import * as AST from "../ast"
import { Set, FMArray, MakeComplex, FnMakeScalarReal, FnMakeScalarComplex, FnMakeScalarLogical } from "../arrays"

export const mks = FnMakeScalarReal;

export const mkc = FnMakeScalarComplex;

export const mkl = FnMakeScalarLogical;

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

export function rand_array_complex(dims: number[]): FMArray {
    let C = MakeComplex(new FMArray(dims));
    for (let ndx = 0; ndx < C.length; ndx++) {
        C.real[ndx] = Math.floor(Math.random() * 10);
        C.imag[ndx] = Math.floor(Math.random() * 10);
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

export function cdiv(ar: number, ai: number, br: number, bi: number): [number, number] {
    let ratio, den;
    let abr, abi, cr;
    let c1, c0;

    if ((ai == 0) && (bi == 0)) {
        c1 = 0;
        c0 = ar / br;
        return [c0, c1];
    }
    if (bi == 0) {
        c0 = ar / br;
        c1 = ai / br;
        return [c0, c1];
    }
    if ((ar == 0) && (bi == 0)) {
        c0 = 0;
        c1 = ai / br;
        return [c0, c1];
    }
    if ((ai == 0) && (br == 0)) {
        c0 = 0;
        c1 = -ar / bi;
        return [c0, c1];
    }
    if ((ar == br) && (ai == bi)) {
        c0 = 1; c1 = 0;
        return [c0, c1];
    }
    if ((abr = br) < 0.)
        abr = - abr;
    if ((abi = bi) < 0.)
        abi = - abi;
    if (abr <= abi) {
        if (abi == 0) {
            if (ai != 0 || ar != 0)
                abi = 1.;
            c1 = c0 = (abi / abr);
            return [c0, c1];
        }
        ratio = br / bi;
        den = bi * (1 + ratio * ratio);
        cr = ((ar * ratio + ai) / den);
        c1 = ((ai * ratio - ar) / den);
    }
    else {
        ratio = bi / br;
        den = br * (1 + ratio * ratio);
        cr = ((ar + ai * ratio) / den);
        c1 = ((ai - ar * ratio) / den);
    }
    c0 = (cr);
    return [c0, c1];
}
