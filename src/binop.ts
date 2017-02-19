import { FMArray, MakeComplex, FnMakeScalarComplex, FnMakeScalarReal, ComputeBinaryOpOutputDim, Elements } from './arrays';
import { Operator } from './operators';

function binop_complex_scalar(a: FMArray, b: FMArray, op: Operator): FMArray {
    return FnMakeScalarComplex(op.op_complex(a.real[0], a.imag[0], b.real[0], b.imag[0]));
}

function binop_complex_vector(a: FMArray, b: FMArray, op: Operator): FMArray {
    const cdims = ComputeBinaryOpOutputDim(a, b);
    const clength = Elements(cdims);
    const aincr = (a.length > 1) ? 1 : 0;
    const bincr = (b.length > 1) ? 1 : 0;
    const c = MakeComplex(new FMArray(cdims));
    for (let ndx = 0; ndx < clength; ndx++) {
        const res = op.op_complex(a.real[ndx * aincr], a.imag[ndx * aincr],
            b.real[ndx * bincr], b.imag[ndx * bincr]);
        c.real[ndx] = res[0];
        c.imag[ndx] = res[1];
    }
    return c;
}

function binop_complex(a: FMArray, b: FMArray, op: Operator): FMArray {
    if ((a.length === 1) && (b.length === 1))
        return binop_complex_scalar(a, b, op);
    else
        return binop_complex_vector(a, b, op);
}

function binop_real_scalar(a: FMArray, b: FMArray, op: Operator): FMArray {
    return FnMakeScalarReal(op.op_real(a.real[0], b.real[0]));
}

function binop_real_vector(a: FMArray, b: FMArray, op: Operator): FMArray {
    const cdims = ComputeBinaryOpOutputDim(a, b);
    const clength = Elements(cdims);
    const aincr = (a.length > 1) ? 1 : 0;
    const bincr = (b.length > 1) ? 1 : 0;
    const c = new FMArray(cdims);
    for (let ndx = 0; ndx < clength; ndx++) {
        c.real[ndx] = op.op_real(a.real[ndx * aincr], b.real[ndx * bincr]);
    }
    return c;
}

function binop_real(a: FMArray, b: FMArray, op: Operator): FMArray {
    if ((a.length === 1) && (b.length === 1))
        return binop_real_scalar(a, b, op);
    else
        return binop_real_vector(a, b, op);
}

export function BinOp(a: FMArray, b: FMArray, op: Operator): FMArray {
    if (a.imag || b.imag) {
        let acomp = MakeComplex(a);
        let bcomp = MakeComplex(b);
        return binop_complex(acomp, bcomp, op);
    }
    return binop_real(a, b, op);
}
