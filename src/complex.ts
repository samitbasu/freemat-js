// Support for complex numbers (as scalar entities...)

export interface cnumber {
    real: number;
    imag: number;
}

export function cmul(a: cnumber, b: cnumber): cnumber {
    const ar = a.real;
    const ai = a.imag;
    const br = b.real;
    const bi = b.imag;
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
    return { real: cr, imag: ci };
}

export function cdiv(a: cnumber, b: cnumber): cnumber {
    const ar = a.real;
    const ai = a.imag;
    const br = b.real;
    const bi = b.imag;
    let ratio: number, den: number;
    let abr: number, abi: number, cr: number;
    let c1: number, c0: number;

    if ((ai == 0) && (bi == 0)) {
        c1 = 0;
        c0 = ar / br;
        return { real: c0, imag: c1 };
    }
    if (bi == 0) {
        c0 = ar / br;
        c1 = ai / br;
        return { real: c0, imag: c1 };
    }
    if ((ar == 0) && (bi == 0)) {
        c0 = 0;
        c1 = ai / br;
        return { real: c0, imag: c1 };
    }
    if ((ai == 0) && (br == 0)) {
        c0 = 0;
        c1 = -ar / bi;
        return { real: c0, imag: c1 };
    }
    if ((ar == br) && (ai == bi)) {
        c0 = 1; c1 = 0;
        return { real: c0, imag: c1 };
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
            return { real: c0, imag: c1 };
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
    return { real: c0, imag: c1 };
}

