'use strict';

module.exports.scalar_real = (a,b,mk) => mk(a === b);

// To quote MLAB docs: lt compares only the real part of the elements in A.
module.exports.scalar_complex = (ar,ai,br,bi,mk) => mk((ar === br) && (ai === bi));

module.exports.vector_scalar_real = (c,a,b) => {
    for (let ndx=0;ndx < a.length;ndx++) {
        c.real[ndx] = (a.real[ndx] === b.real) ? 1 : 0;
    }
}

module.exports.vector_scalar_complex = (c,a,b) => {
    for (let ndx=0;ndx < a.length;ndx++) {
        c.real[ndx] = ((a.real[ndx] === b.real) &&
                       ((a.imag[ndx]||0) === b.imag)) ? 1 : 0;
    }
}

module.exports.scalar_vector_real = (c,a,b) => {
    for (let ndx=0;ndx < b.length;ndx++) {
        c.real[ndx] = (a.real === b.real[ndx]) ? 1 : 0;
    }
}

module.exports.scalar_vector_complex = (c,a,b) => {
    for (let ndx=0;ndx < b.length;ndx++) {
        c.real[ndx] = ((a.real === b.real[ndx]) &&
                       (a.imag === (b.imag[ndx]||0))) ? 1 : 0;
    }
}

module.exports.vector_vector_real = (c,a,b) => {
    for (let ndx=0;ndx < a.length;ndx++) {
        c.real[ndx] = (a.real[ndx] === b.real[ndx]) ? 1 : 0;
    }
}

module.exports.vector_vector_complex = (c,a,b) => {
    for (let ndx=0;ndx < a.length;ndx++) {
        c.real[ndx] = ((a.real[ndx] === b.real[ndx]) &&
                       ((a.imag[ndx]||0) === (b.imag[ndx]||0))) ? 1 : 0;
    }
}
