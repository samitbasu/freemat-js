'use strict';
const chai = require('chai');
const assert = chai.assert;
const dbl = require('../double.js').init();
const tst = require('../test_help.js');

function matmul(A,B) {
    const Arows = A.dims[0];
    const Acols = A.dims[1];
    const Brows = B.dims[0];
    const Bcols = B.dims[1];
    assert.equal(Acols,Brows);
    let C = dbl.make_array([Arows,Bcols]);
    for (let row=1;row<=Arows;row++) {
        for (let col=1;col<=Bcols;col++) {
            let accum = dbl.make_scalar(0);
            for (let ndx=1;ndx<=Acols;ndx++) {
                accum = accum.plus(A.get([row,ndx]).times(B.get([ndx,col])));
            }
            C = C.set([row,col],accum);
        }
    }
    return C;
}

function mtimes_test(C,D) {
    let G = C.mtimes(D);
    let F = matmul(C,D);
    assert.isTrue(tst.mat_equal(F,G));
}

describe('mtimes tests', function() {
    let sizes = [1, 2, 4, 8, 100, 200];
    this.timeout(10000);
    for (let dim of sizes) {
        it(`should correctly multiply real square matrices of size ${dim} x ${dim}`, () => {
            const C = tst.testMat(dim,dim);
            const D = tst.testMat(dim,dim);
            mtimes_test(C,D);
        });
    }
    for (let dim of sizes) {
        it(`should correctly multiple real rectangular matrices of size ${dim} x ${dim*2}`, () => {
            const C = tst.testMat(dim,2*dim);
            const D = tst.testMat(2*dim,dim);
            mtimes_test(C,D);
        });
    }
    for (let dim of sizes) {
        it(`should correctly multiple complex rectangular matrices of size ${dim} x ${dim*2}`, () => {
            const C = tst.testMatComplex(dim,2*dim);
            const D = tst.testMatComplex(2*dim,dim);
            mtimes_test(C,D);
        });
    }
});
