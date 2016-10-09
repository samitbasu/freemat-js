// This module is for the addition operator

'use strict';

module.exports.scalar_real = (a,b,mk) => mk((a!==0) && (b!==0));

module.exports.vector_scalar_real = (c,a,b) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
	c.real[ndx] = (a.real[ndx] !== 0) && (b.real !== 0);
    }
}

module.exports.scalar_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < b.length;ndx++) {
	c.real[ndx] = (a.real !== 0) && (b.real[ndx] !== 0);
    }
}

module.exports.vector_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < a.length; ndx++) {
	c.real[ndx] = (a.real[ndx] !== 0) && (b.real[ndx] !== 0);
    }
}
