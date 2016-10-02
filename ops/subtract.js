// This module is for the subtraction operator
'use strict';

module.exports.scalar_real = (a,b,mk) => mk(a-b);

module.exports.scalar_complex = (ar,ai,br,bi,mk) => mk(ar-br,ai-bi);

module.exports.vector_scalar_real = (c,a,b) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
	c.real[ndx] = a.real[ndx] - b.real;
    }
}

module.exports.vector_scalar_complex = (c,a,b) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
	c.real[ndx] = a.real[ndx] - b.real;
	c.imag[ndx] = (a.imag[ndx]|0) - b.imag;
    }
}

module.exports.scalar_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < b.length;ndx++) {
	c.real[ndx] = a.real - b.real[ndx];
    }
}

module.exports.scalar_vector_complex = (c,a,b) => {
    for (let ndx = 0; ndx < b.length;ndx++) {
	c.real[ndx] = a.real - b.real[ndx];
	c.imag[ndx] = a.imag - (b.imag[ndx]|0);
    }
}

module.exports.vector_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < a.length; ndx++) {
	c.real[ndx] = a.real[ndx] - b.real[ndx];
    }
}

module.exports.vector_vector_complex = (c,a,b) => {
    for (let ndx = 0; ndx < a.length; ndx++) {
	c.real[ndx] = a.real[ndx] - b.real[ndx];
	c.imag[ndx] = (a.imag[ndx]|0) - (b.imag[ndx]|0);
    }
}
