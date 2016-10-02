
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
    temp = real*Math.sqrt(1.0 + temp*temp);  /*overflow!!*/
    return(temp);
}

module.exports.scalar_real = (a,b) => Math.pow(a,b);


module.exports.scalar_complex = (ar,ai,br,bi) => {
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

