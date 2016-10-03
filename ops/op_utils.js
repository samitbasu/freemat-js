module.exports.vector_scalar_real_func = (c,a,b,o) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
	c.real[ndx] = op(a.real[ndx],b.real);
    }
}

module.exports.vector_scalar_complex_func = (c,a,b,op) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
	const ar = a.real[ndx];
	const ai = (a.imag[ndx]||0);
	const br = b.real;
	const bi = b.imag;
	const r = op(ar,ai,br,bi);
	c.real[ndx] = r[0];
	c.imag[ndx] = r[1];
    }
}

module.exports.scalar_vector_real_func = (c,a,b,op) => {
    for (let ndx = 0; ndx < b.length;ndx++) {
	c.real[ndx] = op(a.real,b.real[ndx]);
    }    
}

module.exports.scalar_vector_complex_func = (c,a,b,op) => {
    for (let ndx = 0; ndx < b.length;ndx++) {
	const ar = a.real;
	const ai = a.imag;
	const br = b.real[ndx];
	const bi = (b.imag[ndx]||0);
	const r = op(ar,ai,br,bi);
	c.real[ndx] = r[0];
	c.imag[ndx] = r[1];
    }
}

module.exports.vector_vector_real_func = (c,a,b,op) => {
    for (let ndx = 0; ndx < a.length; ndx++) {
	c.real[ndx] = op(a.real[ndx],b.real[ndx]);
    }    
}

module.exports.vector_vector_complex_func = (c,a,b,op) => {
    for (let ndx = 0; ndx < a.lengthe; ndx++) {
	const ar = a.real[ndx];
	const ai = a.imag[ndx]||0;
	const br = b.real[ndx];
	const bi = (b.imag[ndx]||0);
	const r = op(ar,ai,br,bi);
	c.real[ndx] = r[0];
	c.imag[ndx] = r[1];
    }
}
