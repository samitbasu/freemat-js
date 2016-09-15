// This module is for the multiplication operator

'use strict';

const op_utils = require('./op_utils');

module.exports.scalar_real = (a,b) => a*b;

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

module.exports.scalar_complex = cmul;

module.exports.vector_scalar_real = (c,a,b) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
	c.real[ndx] = a.real[ndx] * b.real;
    }
}

module.exports.vector_scalar_complex = (c,a,b) => 
    op_utils.vector_scalar_complex_func(c,a,b,cmul);

module.exports.scalar_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < b.length;ndx++) {
	c.real[ndx] = a.real * b.real[ndx];
    }
}

module.exports.scalar_vector_complex = (c,a,b) =>
    op_utils.scalar_vector_complex_func(c,a,b,cmul);


module.exports.vector_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < a.length; ndx++) {
	c.real[ndx] = a.real[ndx] * b.real[ndx];
    }
}

module.exports.vector_vector_complex = (c,a,b) => 
    op_utils.vector_vector_complex_func(c,a,b,cmul);
