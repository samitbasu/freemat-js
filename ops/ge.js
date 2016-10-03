'use strict';

module.exports.scalar_real = (a,b,mk) => mk(a>=b);

// To quote MLAB docs: lt compares only the real part of the elements in A.
module.exports.scalar_complex = (ar,ai,br,bi,mk) => mk(ar >= br);

module.exports.vector_scalar_real = (c,a,b) => {
    for (let ndx=0;ndx < a.length;ndx++) {
        c.real[ndx] = (a.real[ndx] >= b.real) ? 1 : 0;
    }
}

module.exports.vector_scalar_complex = module.exports.vector_scalar_real;

module.exports.scalar_vector_real = (c,a,b) => {
    for (let ndx=0;ndx < b.length;ndx++) {
        c.real[ndx] = (a.real >= b.real[ndx]) ? 1 : 0;
    }
}

module.exports.scalar_vector_complex = module.exports.scalar_vector_real;

module.exports.vector_vector_real = (c,a,b) => {
    for (let ndx=0;ndx < a.length;ndx++) {
        c.real[ndx] = (a.real[ndx] >= b.real[ndx]) ? 1 : 0;
    }
}

module.exports.vector_vector_complex = module.exports.vector_vector_real;
