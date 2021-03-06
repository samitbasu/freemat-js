import { Adder, Subtractor, Multiplier, RightDivider, LeftDivider } from './operators';
import { LessThan, LessEquals, GreaterThan, GreaterEquals, Equals, NotEquals } from './comparators';
import { BinOp } from './binop';
import { CmpOp } from './cmpop';
import { FMValue, FMArray, NumericArray, ArrayType, ToType, MakeComplex, isFMArray, mkArray } from './arrays';
import { DGEMM, ZGEMM, DTRANSPOSE, ZTRANSPOSE, ZHERMITIAN, Logger, DSOLVE, ZSOLVE } from './mat.node';

export function lt(A: FMValue, B: FMValue): FMValue {
    return CmpOp(A, B, new LessThan);
}

export function le(A: FMValue, B: FMValue): FMValue {
    return CmpOp(A, B, new LessEquals);
}

export function gt(A: FMValue, B: FMValue): FMValue {
    return CmpOp(A, B, new GreaterThan);
}

export function ge(A: FMValue, B: FMValue): FMValue {
    return CmpOp(A, B, new GreaterEquals);
}

export function eq(A: FMValue, B: FMValue): FMValue {
    return CmpOp(A, B, new Equals);
}

export function ne(A: FMValue, B: FMValue): FMValue {
    return CmpOp(A, B, new NotEquals);
}

export function plus(A: FMValue, B: FMValue): FMValue {
    return BinOp(A, B, new Adder);
}

export function minus(A: FMValue, B: FMValue): FMValue {
    return BinOp(A, B, new Subtractor);
}

export function times(A: FMValue, B: FMValue): FMValue {
    return BinOp(A, B, new Multiplier);
}

export function ldivide(A: FMValue, B: FMValue): FMValue {
    return BinOp(A, B, new LeftDivider);
}

export function rdivide(A: FMValue, B: FMValue): FMValue {
    return BinOp(A, B, new RightDivider);
}

function mk_real(n: number[], realv: NumericArray): FMArray {
    return new FMArray(n, realv);
}

function mk_comp(n: number[], realv: NumericArray, imagv: NumericArray): FMArray {
    return new FMArray(n, realv, imagv);
}

function mtimes_real(A: FMArray, B: FMArray): FMArray {
    let C = DGEMM(A, B, mk_real);
    if ((A.mytype === ArrayType.Single) || (B.mytype === ArrayType.Single))
        return ToType(C, ArrayType.Single);
    return C;
}

function mtimes_complex(A: FMArray, B: FMArray): FMArray {
    let C = ZGEMM(A, B, mk_comp);
    if ((A.mytype === ArrayType.Single) || (B.mytype === ArrayType.Single))
        return ToType(C, ArrayType.Single);
    return C;
}

export function mtimes(A: FMValue, B: FMValue): FMValue {
    if (!isFMArray(A) && !isFMArray(B)) return times(A, B);
    A = mkArray(A);
    B = mkArray(B);
    if ((A.length === 1) || (B.length === 1)) return times(A, B);
    if (!(A.imag) && !(B.imag)) return mtimes_real(A, B);
    return mtimes_complex(A, B);
}

function transpose_complex(A: FMArray): FMArray {
    let C = ZTRANSPOSE(A, mk_comp);
    return ToType(C, A.mytype);
}

function transpose_real(A: FMArray): FMArray {
    let C = DTRANSPOSE(A, mk_real);
    return ToType(C, A.mytype);
}

export function transpose(A: FMValue): FMValue {
    if (!isFMArray(A)) return A;
    // Transpose does not change a scalar
    if (A.dims.every(x => (x == 1))) return A;
    if (A.imag) return transpose_complex(A);
    return transpose_real(A);
}

export function hermitian(A: FMValue): FMValue {
    if (!isFMArray(A)) return A;
    if (!A.imag) return transpose(A);
    let C = ZHERMITIAN(A, mk_comp);
    return ToType(C, A.mytype);
}

export function conj(A: FMValue): FMValue {
    if (!isFMArray(A)) return A;
    if (!A.imag) return A;
    let B = MakeComplex(new FMArray(A.dims, undefined, undefined, A.mytype));
    for (let i = 0; i < A.length; i++) {
        B.real[i] = A.real[i];
        B.imag![i] = -A.imag[i];
    }
    return B;
}

export function mldivide(A: FMValue, B: FMValue, logger: Logger): FMValue {
    if (!isFMArray(A) && !isFMArray(B)) return ldivide(A, B);
    A = mkArray(A);
    B = mkArray(B);
    if ((A.length === 1) || (B.length === 1)) return ldivide(A, B);
    let C: FMArray;
    if (A.imag || B.imag)
        C = ZSOLVE(A, B, logger, mk_comp);
    else
        C = DSOLVE(A, B, logger, mk_real);
    return ToType(C, Math.max(A.mytype, B.mytype));
}

export function mrdivide(A: FMValue, B: FMValue, logger: Logger): FMValue {
    if (!isFMArray(A) && !isFMArray(B)) return rdivide(A, B);
    A = mkArray(A);
    B = mkArray(B);
    if ((A.length === 1) || (B.length === 1)) return rdivide(A, B);
    let C: FMValue;
    if (A.imag || B.imag)
        C = hermitian(ZSOLVE(hermitian(B) as FMArray,
            hermitian(A) as FMArray, logger, mk_comp));
    else
        C = transpose(DSOLVE(transpose(B) as FMArray,
            transpose(A) as FMArray, logger, mk_real));
    return ToType(C as FMArray, Math.max(A.mytype, B.mytype));
}

// How is empty handled?
export function rnaz(A: FMValue): boolean {
    if (typeof (A) === 'number')
        return A !== 0;
    if (typeof (A) === 'boolean')
        return A;
    for (let i = 0; i < A.length; i++) {
        if (A.real[i] !== 0) return true;
    }
    return false;
}
