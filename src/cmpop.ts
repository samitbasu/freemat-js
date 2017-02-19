import { ArrayType, FMArray, MakeComplex, ComputeBinaryOpOutputDim, Elements } from './arrays';
import { Comparator } from './comparators';

function cmpop_complex_vector(a: FMArray, b: FMArray, op: Comparator): FMArray {
    const cdims = ComputeBinaryOpOutputDim(a, b);
    const clength = Elements(cdims);
    const aincr = (a.length > 1) ? 1 : 0;
    const bincr = (b.length > 1) ? 1 : 0;
    const c = new FMArray(cdims, undefined, undefined, ArrayType.Logical);
    for (let ndx = 0; ndx < clength; ndx++) {
        c.real[ndx] = (op.op_complex(a.real[ndx * aincr], a.imag[ndx * aincr],
            b.real[ndx * bincr], b.imag[ndx * bincr]) ? 1 : 0);
    }
    return c;
}

function cmpop_complex_scalar(a: FMArray, b: FMArray, op: Comparator): FMArray {
    const c = new FMArray([1, 1], undefined, undefined, ArrayType.Logical);
    c.real[0] = (op.op_complex(a.real[0], a.imag[0], b.real[0], b.imag[0]) ? 1 : 0);
    return c;
}

function cmpop_complex(a: FMArray, b: FMArray, op: Comparator): FMArray {
    if ((a.length === 1) && (b.length === 1))
        return cmpop_complex_scalar(a, b, op);
    else
        return cmpop_complex_vector(a, b, op);
}

function cmpop_real_vector(a: FMArray, b: FMArray, op: Comparator): FMArray {
    const cdims = ComputeBinaryOpOutputDim(a, b);
    const clength = Elements(cdims);
    const aincr = (a.length > 1) ? 1 : 0;
    const bincr = (b.length > 1) ? 1 : 0;
    const c = new FMArray(cdims, undefined, undefined, ArrayType.Logical);
    for (let ndx = 0; ndx < clength; ndx++) {
        c.real[ndx] = (op.op_real(a.real[ndx * aincr], b.real[ndx * bincr]) ? 1 : 0);
    }
    return c;
}

function cmpop_real_scalar(a: FMArray, b: FMArray, op: Comparator): FMArray {
    const c = new FMArray([1, 1], undefined, undefined, ArrayType.Logical);
    c.real[0] = (op.op_real(a.real[0], b.real[0]) ? 1 : 0);
    return c;
}

function cmpop_real(a: FMArray, b: FMArray, op: Comparator): FMArray {
    if ((a.length === 1) && (b.length === 1))
        return cmpop_real_scalar(a, b, op);
    else
        return cmpop_real_vector(a, b, op);
}

export function CmpOp(a: FMArray, b: FMArray, op: Comparator): FMArray {
    if (a.imag || b.imag) {
        let acomp = MakeComplex(a);
        let bcomp = MakeComplex(b);
        return cmpop_complex(acomp, bcomp, op);
    }
    return cmpop_real(a, b, op);
}
