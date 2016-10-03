// This module is for the multiplication operator

'use strict';

const op_utils = require('./op_utils');

module.exports.scalar_real = (a,b,mk) => mk(a*b);

function cmul(ar,ai,br,bi) {
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
    return [cr,ci];
}

module.exports.scalar_complex = (ar,ai,br,bi,mk) => {
    const f = cmul(ar,ai,br,bi);
    return mk(f[0],f[1]);
}

module.exports.vector_scalar_real = (c,a,b) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
	c.real[ndx] = a.real[ndx] * b.real;
    }
}

module.exports.vector_scalar_complex = (c,a,b) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
        const f = cmul(a.real[ndx],a.imag[ndx]||0,b.real,b.imag);
        c.real[ndx] = f[0];
        c.imag[ndx] = f[1];
    }
}

module.exports.scalar_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < b.length;ndx++) {
	c.real[ndx] = a.real * b.real[ndx];
    }
}

module.exports.scalar_vector_complex = (c,a,b) => {
    for (let ndx = 0;ndx < b.length;ndx++) {
        const f = cmul(a.real,a.imag,b.real[ndx],b.imag[ndx]||0);
        c.real[ndx] = f[0];
        c.imag[ndx] = f[1];
    }
}

module.exports.vector_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < a.length; ndx++) {
	c.real[ndx] = a.real[ndx] * b.real[ndx];
    }
}

module.exports.vector_vector_complex = (c,a,b) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
        const f = cmul(a.real[ndx],a.imag[ndx]||0,
                       b.real[ndx],b.imag[ndx]||0);
        c.real[ndx] = f[0];
        c.imag[ndx] = f[1];
    }
}
