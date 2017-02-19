import { Adder, Subtractor, Multiplier, RightDivider, LeftDivider } from './operators';
import { BinOp } from './binop';
import { FMArray, NumericArray, ArrayType, ToType } from './arrays';
import { DGEMM, ZGEMM, DTRANSPOSE, ZTRANSPOSE, ZHERMITIAN, Logger, DSOLVE, ZSOLVE } from './mat.node';

export function plus(A: FMArray, B: FMArray): FMArray {
    return BinOp(A, B, new Adder);
}

export function minus(A: FMArray, B: FMArray): FMArray {
    return BinOp(A, B, new Subtractor);
}

export function times(A: FMArray, B: FMArray): FMArray {
    return BinOp(A, B, new Multiplier);
}

export function ldivide(A: FMArray, B: FMArray): FMArray {
    return BinOp(A, B, new LeftDivider);
}

export function rdivide(A: FMArray, B: FMArray): FMArray {
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

export function mtimes(A: FMArray, B: FMArray): FMArray {
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

export function transpose(A: FMArray): FMArray {
    // Transpose does not change a scalar
    if (A.dims.every(x => (x == 1))) return A;
    if (A.imag) return transpose_complex(A);
    return transpose_real(A);
}

export function hermitian(A: FMArray): FMArray {
    if (!A.imag) return transpose(A);
    let C = ZHERMITIAN(A, mk_comp);
    return ToType(C, A.mytype);
}

export function mldivide(A: FMArray, B: FMArray, logger: Logger): FMArray {
    if ((A.length === 1) || (B.length === 1)) return ldivide(A, B);
    let C: FMArray;
    if (A.imag || B.imag)
        C = ZSOLVE(A, B, logger, mk_comp);
    else
        C = DSOLVE(A, B, logger, mk_real);
    return ToType(C, Math.max(A.mytype, B.mytype));
}

export function mrdivide(A: FMArray, B: FMArray, logger: Logger): FMArray {
    if ((A.length === 1) || (B.length === 1)) return rdivide(A, B);
    let C: FMArray;
    if (A.imag || B.imag)
        C = hermitian(ZSOLVE(hermitian(B), hermitian(A), logger, mk_comp));
    else
        C = transpose(DSOLVE(transpose(B), transpose(A), logger, mk_real));
    return ToType(C, Math.max(A.mytype, B.mytype));
}
