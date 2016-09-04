'use strict';
const dbl = require('./double.js');


function testMat(N,M,imag_scale = 0) {
    let C = dbl.make_array([N,M]);
    for (let row=1;row<=N;row++)
        for (let col=1;col<=M;col++)
            C.set([row,col],dbl.make_scalar(row*M+col,imag_scale*(col*M+row)));
    return C;
}

function tic() {
    let t = process.hrtime();
    return t[0]+t[1]/1.0e9;
}

function time_it(func,limits) {
    let t1 = module.exports.tic();
    func();
    return (module.exports.tic() - t1);    
}

function mat_print(A) {
    for (let row=1;row<=A.dims[0];row++) {
        let row = '';
        for (let col=1;col<=A.dims[1];col++) {
            row += A.get([row,col]).real + ' ';
        }
        console.log(row);
    }
}

function mat_equal(A,B) {
    if (A.dims.length !== B.dims.length) return false;
    if (A.dims.length !== 2) return false;
    if (A.dims[0] !== B.dims[0]) return false;
    if (A.dims[1] !== B.dims[1]) return false;
    for (let row=1;row<=A.dims[0];row++) {
        for (let col=1;col<=A.dims[1];col++) {
            if (!A.get([row,col]).equals(B.get([row,col]))) {
                console.log(`Unequal: ${JSON.stringify(A.get([row,col]))} ${JSON.stringify(B.get([row,col]))}`);
                mat_print(A);
                mat_print(B);
                return false;
            }
        }
    }
    return true;
}


module.exports.tic = tic;
module.exports.time_it = time_it;
module.exports.testMat = (N,M) => testMat(N,M);
module.exports.testMatComplex = (N,M,iscale) => testMat(N,M,1);
module.exports.mat_print = mat_print;
module.exports.mat_equal = mat_equal;
