export interface Operator {
    op_real(a: number, b: number): number;
    op_complex(a_real: number, a_imag: number, b_real: number, b_imag: number): [number, number];
};

export class Adder implements Operator {
    op_real(a: number, b: number): number {
        return (a + b);
    }
    op_complex(a_real: number, a_imag: number, b_real: number, b_imag: number): [number, number] {
        return [(a_real + b_real), (a_imag + b_imag)];
    }
};

export class Subtractor implements Operator {
    op_real(a: number, b: number): number {
        return (a - b);
    }
    op_complex(a_real: number, a_imag: number, b_real: number, b_imag: number): [number, number] {
        return [(a_real - b_real), (a_imag - b_imag)];
    }
};

function cmul(ar: number, ai: number, br: number, bi: number): [number, number] {
    let cr = 0;
    let ci = 0;
    // Check for denormals and infinite handling...
    if ((ai == 0) && (bi == 0)) {
        cr = ar * br;
        ci = 0;
    } else if ((ai == 0) && (br == 0)) {
        cr = 0;
        ci = ar * bi;
    } else if ((ar == 0) && (bi == 0)) {
        cr = 0;
        ci = ai * br;
    } else if (ai == 0) {
        cr = ar * br;
        ci = ar * bi;
    } else if (bi == 0) {
        cr = br * ar;
        ci = br * ai;
    } else {
        cr = ar * br - ai * bi;
        ci = ar * bi + ai * br;
    }
    return [cr, ci];
}

export class Multiplier implements Operator {
    op_real(a: number, b: number): number {
        return a * b;
    }
    op_complex(a_real: number, a_imag: number, b_real: number, b_imag: number): [number, number] {
        return cmul(a_real, a_imag, b_real, b_imag);
    }
};

function cdiv(ar: number, ai: number, br: number, bi: number): [number, number] {
    let ratio: number, den: number;
    let abr: number, abi: number, cr: number;
    let c1: number, c0: number;

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

export class RightDivider implements Operator {
    op_real(a: number, b: number): number {
        return a / b;
    }
    op_complex(a_real: number, a_imag: number, b_real: number, b_imag: number): [number, number] {
        return cdiv(a_real, a_imag, b_real, b_imag);
    }
}

export class LeftDivider implements Operator {
    op_real(a: number, b: number): number {
        return b / a;
    }
    op_complex(a_real: number, a_imag: number, b_real: number, b_imag: number): [number, number] {
        return cdiv(b_real, b_imag, a_real, a_imag);
    }
}

