import {
    basicValue,
    basic,
    isFMArray,
    mkArray,
    NumericArray, FMArray, MakeComplex, FnMakeArrayFromCNumber ,
    FnMakeScalarReal, ComputeBinaryOpOutputDim, Elements
} from './arrays';
import { FMValue } from './arrays';
import { Operator } from './operators';

function binop_complex_scalar(a: FMArray, b: FMArray, op: Operator): FMArray {
    // Type assertions added because Compiler doesn't know how we got here...
    return FnMakeArrayFromCNumber(op.op_complex({
        real: a.real[0],
        imag: (a.imag as NumericArray)[0]
    },
        {
            real: b.real[0],
            imag: (b.imag as NumericArray)[0]
        }));
}

function binop_complex_vector(a: FMArray, b: FMArray, op: Operator): FMArray {
    const cdims = ComputeBinaryOpOutputDim(a, b);
    const clength = Elements(cdims);
    const aincr = (a.length > 1) ? 1 : 0;
    const bincr = (b.length > 1) ? 1 : 0;
    const c = MakeComplex(new FMArray(cdims));
    for (let ndx = 0; ndx < clength; ndx++) {
        const res = op.op_complex({
            real: a.real[ndx * aincr],
            imag: (a.imag as NumericArray)[ndx * aincr]
        },
            {
                real: b.real[ndx * bincr],
                imag: (b.imag as NumericArray)[ndx * bincr]
            });
        c.real[ndx] = res.real;
        (c.imag as NumericArray)[ndx] = res.imag;
    }
    return c;
}

function binop_complex(a: FMArray, b: FMArray, op: Operator): FMArray {
    if ((a.length === 1) && (b.length === 1))
        return binop_complex_scalar(a, b, op);
    else
        return binop_complex_vector(a, b, op);
}

function binop_real_scalar(a: FMArray, b: FMArray, op: Operator): FMValue {
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

function binop_real(a: FMArray, b: FMArray, op: Operator): FMValue {
    if ((a.length === 1) && (b.length === 1))
        return binop_real_scalar(a, b, op);
    else
        return binop_real_vector(a, b, op);
}

function binop_basic(a: basic, b: basic, op: Operator): number {
    return op.op_real(basicValue(a), basicValue(b));
}

//FIXME - test for (-1)^(0.5)
export function BinOp(a: FMValue, b: FMValue, op: Operator): FMValue {
    if (!isFMArray(a) && !isFMArray(b))
        return binop_basic(a, b, op);
    a = mkArray(a);
    b = mkArray(b);
    if (a.imag || b.imag) {
        let acomp = MakeComplex(a);
        let bcomp = MakeComplex(b);
        return binop_complex(acomp, bcomp, op);
    }
    return binop_real(a, b, op);
}
