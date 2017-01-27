
'use strict';

const op_utils = require('./op_utils');

function complex_abs(real, imag) {
    let swap;
    if (real < 0)
	real = -real;
    if (imag < 0)
	imag = -imag;
    if(imag > real){
	swap = real;
	real = imag;
	imag = swap;
    }
    if((real+imag) == real)
	return(real);
    let temp = imag/real;
    temp = real*Math.sqrt(1.0 + temp*temp);
    return(temp);
}

module.exports.scalar_real = (a,b) => Math.pow(a,b);


/* This version is for real arguments and real exponents */
function powrr(ar,br) {
    let logr, logi, x, y;
    let cr, ci;
    let mag = Math.abs(ar);
    if (mag == 0) {
      cr = 0;
      ci = 0;
      return [cr,ci];
    }
    logr = Math.log(mag);
    // if ar > 0, logi = 0, if ar < 0, logi = PI
    logi = (ar > 0) ? 0 : Math.PI;
    
    x = Math.exp( logr * br );
    y = logi * br;
    // cos(y) == 0 if y = N*PI/2 where N is an odd integer
    // but y = br*PI, so if br*2 is an integer
    let N = Math.round(br*2);
    if ((br*2 === N) && (N & 1)) {
        return [0,x*Math.sin(y)];
    }
    if ((br*2 === N) && !(N & 1)) {
        return [x*Math.cos(y),0];
    }
    cr = x * Math.cos(y);
    ci = x * Math.sin(y);    
    return [cr,ci];
}

/* This version is for imaginary arguments and real exponents */
function powir(ai,br) {
    let logr, logi, x, y;
    let cr, ci;
    let mag = Math.abs(ai);
    if (mag == 0) {
      cr = 0;
      ci = 0;
      return [cr,ci];
    }
    logr = Math.log(mag);
    // if ar > 0, logi = 0, if ar < 0, logi = PI
    logi = (ai > 0) ? Math.PI/2 : -Math.PI/2;
    
    x = Math.exp( logr * br );
    y = logi * br;
    // cos(y) == 0 if y = N*PI/2 where N is an odd integer
    // but y = br*PI/2, so if br is an integer
    let N = Math.round(br);
    // And it is odd
    if ((br === N) && (N & 1)) {
        return [0,x*Math.sin(y)];
    }
    // If it is even
    if ((br === N) && !(N & 1)) {
        return [x*Math.cos(y),0];
    }
    // General case
    cr = x * Math.cos(y);
    ci = x * Math.sin(y);    
    return [cr,ci];
}


/* This is the fully generic complex power function */
module.exports.cpow = (ar,ai,br,bi) => {
    if ((ai === 0) && (bi === 0)) return powrr(ar,br);
    if ((ar === 0) && (bi === 0)) return powir(ai,br);
    let logr, logi, x, y;
    let cr, ci;
    let mag = complex_abs(ar, ai);
    if (mag == 0) {
      cr = 0;
      ci = 0;
      return [cr,ci];
    }
    logr = Math.log(mag);
    logi = Math.atan2(ai, ar);
    
    x = Math.exp( logr * br - logi * bi );
    y = logr * bi + logi * br;
    
    cr = x * Math.cos(y);
    ci = x * Math.sin(y);    
    return [cr,ci];
}


module.exports.vector_scalar_real = (c,a,b) =>
    op_utils.vector_scalar_complex(c,a,b,Math.pow);

