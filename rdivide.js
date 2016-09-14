// This module is for the division operator

module.exports.scalar_real = (a,b) => a/b;

function cdiv(ar,ai,br,bi) {
    let ratio, den;
    let abr, abi, cr;

    if ((ai == 0) && (bi == 0)) {
      c1 = 0;
      c0 = ar/br;
      return [c0,c1];
    }
    if (bi == 0) {
      c0 = ar/br;
      c1 = ai/br;
      return [c0,c1];
    }
    if ((ar == 0) && (bi == 0)) {
      c0 = 0;
      c1 = ai/br;
      return [c0,c1];
    }
    if ((ai == 0) && (br == 0)) {
      c0 = 0;
      c1 = -ar/bi;
      return [c0,c1];
    }
    if ((ar == br) && (ai == bi)) {
      c0 = 1; c1 = 0;
      return [c0,c1];
    }
    if( (abr = br) < 0.)
      abr = - abr;
    if( (abi = bi) < 0.)
      abi = - abi;
    if( abr <= abi )
      {
	if(abi == 0) {
	  if (ai != 0 || ar != 0)
	    abi = 1.;
	  c1 = c0 = (abi / abr);
	  return [c0,c1];
	}
	ratio = br / bi ;
	den = bi * (1 + ratio*ratio);
	cr = ((ar*ratio + ai) / den);
	c1 = ((ai*ratio - ar) / den);
      }
    else
      {
	ratio = bi / br ;
	den = br * (1 + ratio*ratio);
	cr = ((ar + ai*ratio) / den);
	c1 = ((ai - ar*ratio) / den);
      }
    c0 = (cr);
    return [c0,c1];
}

module.exports.scalar_complex = cdiv;

module.exports.vector_scalar_real = (c,a,b) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
	c.real[ndx] = a.real[ndx] / b.real;
    }
}

module.exports.vector_scalar_complex = (c,a,b) => {
    for (let ndx = 0;ndx < a.length;ndx++) {
	const ar = a.real[ndx];
	const ai = (a.imag[ndx]|0);
	const br = b.real;
	const bi = b.imag;
	const r = cdiv(ar,ai,br,bi);
	c.real[ndx] = r[0];
	c.imag[ndx] = r[1];
    }
}

module.exports.scalar_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < b.length;ndx++) {
	c.real[ndx] = a.real / b.real[ndx];
    }
}

module.exports.scalar_vector_complex = (c,a,b) => {
    for (let ndx = 0; ndx < b.length;ndx++) {
	const ar = a.real;
	const ai = a.imag;
	const br = b.real[ndx];
	const bi = (b.imag[ndx]|0);
	const r = cdiv(ar,ai,br,bi);
	c.real[ndx] = r[0];
	c.imag[ndx] = r[1];
    }
}

module.exports.vector_vector_real = (c,a,b) => {
    for (let ndx = 0; ndx < a.length; ndx++) {
	c.real[ndx] = a.real[ndx] / b.real[ndx];
    }
}

module.exports.vector_vector_complex = (c,a,b) => {
    for (let ndx = 0; ndx < a.lengthe; ndx++) {
	const ar = a.real[ndx];
	const ai = a.imag[ndx]|0;
	const br = b.real[ndx];
	const bi = (b.imag[ndx]|0);
	const r = cdiv(ar,ai,br,bi);
	c.real[ndx] = r[0];
	c.imag[ndx] = r[1];
    }
}
