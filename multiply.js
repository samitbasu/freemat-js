// This module is for the multiplication operator

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

module.exports.vector_scalar_complex = (c,a,b) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
	const ar = a.real[ndx];
	const ai = (a.imag[ndx]|0);
	const br = b.real;
	const bi = b.imag;
	const r = cmul(ar,ai,br,bi);
	c.real[ndx] = r[0];
	c.imag[ndx] = r[1];
    }
}

module.exports.scalar_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < b.length;ndx++) {
	c.real[ndx] = a.real * b.real[ndx];
    }
}

module.exports.scalar_vector_complex = (c,a,b) => {
    for (let ndx = 0; ndx < b.length;ndx++) {
	const ar = a.real;
	const ai = a.imag;
	const br = b.real[ndx];
	const bi = (b.imag[ndx]|0);
	const r = cmul(ar,ai,br,bi);
	c.real[ndx] = r[0];
	c.imag[ndx] = r[1];
    }
}

module.exports.vector_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < a.length; ndx++) {
	c.real[ndx] = a.real[ndx] * b.real[ndx];
    }
}

module.exports.vector_vector_complex = (c,a,b) => {
    for (let ndx = 0; ndx < a.lengthe; ndx++) {
	const ar = a.real[ndx];
	const ai = a.imag[ndx]|0;
	const br = b.real[ndx];
	const bi = (b.imag[ndx]|0);
	const r = cmul(ar,ai,br,bi);
	c.real[ndx] = r[0];
	c.imag[ndx] = r[1];
    }
}
