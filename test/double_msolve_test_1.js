'use strict';
const chai = require('chai');
const assert = chai.assert;
const dbl = require('../double.js').init();
const tst = require('../test_help.js');

describe('msolve tests', function() {
    let sizes = [2, 4, 8, 32, 100, 200];
    for (let dim of sizes) {
        it(`should correctly solve A x = b for real square matrices of size ${dim} x ${dim}`, () => {
            const C = dbl.make_array([dim,dim]);
            for (let i=1;i<=dim;i++) {
                C.set([i,i],1);
                if (i < dim)
                    C.set([i+1,i],1);
            }
            const B = dbl.make_array([dim,1]);
            for (let i=1;i<=dim;i++) {
                B.set(i,1);
            }
            const D = dbl.matsolve(C,B);
            for (let i=1;i<=dim;i++) {
                if (i % 2 == 0) 
                    assert.isTrue(D.get(i).equals(dbl.make_scalar(0)).bool());
                if (i % 2 == 1) 
                    assert.isTrue(D.get(i).equals(dbl.make_scalar(1)).bool());
            }
        });
    }
    for (let dim of sizes) {
        it(`should correctly solve A x = b for rectangular matrices of size ${2*dim} x ${dim}`, () => {
            const C = dbl.make_array([2*dim,dim]);
            for (let i=1;i<=dim;i++) {
                C.set([i,i],1);
                C.set([i+dim,i],1);
            }
            const B = dbl.make_array([2*dim,1]);
            for (let i=1;i<=2*dim;i++) {
                B.set([i,1],i);
            }
            const D = dbl.matsolve(C,B);
            for (let i=1;i<=dim;i++) {
                assert.closeTo(D.get(i).real,(i+i+dim)/2.0,1e-10);
            }
        });
    }
    for (let dim of sizes) {
        it(`should correctly solve A x = B for rectangular matrices of size ${2*dim} x ${dim}, and right hand sides of size ${dim} x 4`, () => {
            const C = dbl.make_array([2*dim,dim]);
            for (let i=1;i<=dim;i++) {
                C.set([i,i],1);
                C.set([i+dim,i],1);
            }
            const B = dbl.make_array([2*dim,4]);
            for (let i=1;i<=2*dim;i++) {
                for (let j=1;j<=4;j++) {
                    B.set([i,j],i*j);
                }
            }
            const D = dbl.matsolve(C,B);
            for (let i=1;i<=dim;i++) {
                for (let j=1;j<=4;j++) {
                    const x = B.get([i,j]).real;
                    const y = B.get([i+dim,j]).real;
                    const p = (x + y)/2.0;
                    assert.closeTo(D.get([i,j]).real,p,1e-10);
                }
            }
        });
    }
    for (let dim of sizes) {
        it(`should correctly solve A x = b for rectangular matrices of size ${dim} x ${2*dim}, and right hand vectors`, () => {
            const C = dbl.make_array([dim,2*dim]);
            for (let i=1;i<=dim;i++) {
                C.set([i,i],1);
                C.set([i,i+dim],1);
            }
            const B = dbl.make_array([dim,1]);
            for (let i=1;i<=dim;i++) {
                B.set([i,1],i);
            }
            const D = dbl.matsolve(C,B);
            for (let i=1;i<=dim;i++) {
                assert.closeTo(D.get(i).real,B.get(i).real/2.0,1e-10);
                assert.closeTo(D.get(i+dim).real,B.get(i).real/2.0,1e-10);
            }
        });
    }
});
