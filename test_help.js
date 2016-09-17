'use strict';
const dbl = require('./double.js');

function randMat(dims) {
    let C = dbl.make_array(dims);
    for (let ndx=0;ndx<C.length;ndx++)
	C.real[ndx] = Math.floor(Math.random()*10);
    return C;
}

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

function rep_time(func,reps) {
    let sum = 0;
    for (let ndx = 0;ndx < reps;ndx++) {
	let t1 = tst.tic()*1000;
	func();
	let t2 = tst.tic()*1000;
	console.log("   elapsed time: " + (t2-t1));
	sum = sum + (t2-t1);
    }
    console.log("average: " + sum/reps);
}

function mat_print(A) {
    for (let row=1;row<=(A.dims[0] | 0);row++) {
        let line = '';
        for (let col=1;col<=(A.dims[1] | 0);col++) {
            line += A.get([row,col]).real + ' ';
        }
        console.log(line);
    }
}

function array_print(A) {
    if (A.dims.length == 2)
	return mat_print(A);
    for (let page=1;page<=(A.dims[2] | 0);page++) {
	console.log("page = (:,:," + page + ")");
	for (let row=1;row<=(A.dims[0] | 0);row++) {
            let line = '';
            for (let col=1;col<=(A.dims[1] | 0);col++) {
		line += A.get([row,col,page]).real + ' ';
            }
            console.log(line);
	}
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
module.exports.rep_time = rep_time;
module.exports.randMat = (dims) => randMat(dims);
module.exports.testMat = (N,M) => testMat(N,M);
module.exports.testMatComplex = (N,M,iscale) => testMat(N,M,1);
module.exports.mat_print = array_print;
module.exports.mat_equal = mat_equal;
