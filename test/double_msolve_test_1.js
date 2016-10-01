'use strict';
const chai = require('chai');
const assert = chai.assert;
const dbl = require('../double.js').init();
const tst = require('../test_help.js');

describe('msolve tests', function() {
    let sizes = [2, 4, 8, 32, 100, 200];
    for (let dim of sizes) {
        it(`should correctly solve A x = b for real square matrices of size ${dim} x ${dim}`, () => {
            let C = dbl.make_array([dim,dim]);
            for (let i=1;i<=dim;i++) {
                C = C.set([i,i],1);
                if (i < dim)
                    C = C.set([i+1,i],1);
            }
            let B = dbl.make_array([dim,1]);
            for (let i=1;i<=dim;i++) {
                B = B.set(i,1);
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
    for (let dim of [2,4,8,32,64,128]) {
        it(`should correctly solve A x = b for complex matrices of size ${dim} x ${dim}`, () => {
            let C = dbl.make_array([dim,dim]);
            for (let i=1;i<=dim;i++) {
                C = C.set([i,i],dbl.make_scalar(1,1));
                if (i < dim)
                    C = C.set([i+1,i],dbl.make_scalar(1,-1));
            }
            let B = dbl.make_array([dim,1]);
            for (let i=1;i<=dim;i++) {
                B = B.set(i,dbl.make_scalar(i,-i));
            }
            const D = dbl.matsolve(C,B);
            let T = dbl.make_array([dim,1]);
            let recip_alpha = dbl.make_scalar(0.5,-0.5);
            let beta = dbl.make_scalar(1,-1);
            let prev = dbl.make_scalar(0);
            for (let i=1;i<=dim;i++) {
                T = T.set(i,(B.get(i).minus(prev.times(beta))).times(recip_alpha));
                prev = T.get(i);
            }
            for (let i=1;i<=dim;i++) {
                assert.isTrue(T.get(i).equals(D.get(i)).bool());
            }
        });
    }
    for (let dim of sizes) {
        it(`should correctly solve A x = b for real rectangular matrices of size ${2*dim} x ${dim}`, () => {
            let C = dbl.make_array([2*dim,dim]);
            for (let i=1;i<=dim;i++) {
                C = C.set([i,i],1);
                C = C.set([i+dim,i],1);
            }
            let B = dbl.make_array([2*dim,1]);
            for (let i=1;i<=2*dim;i++) {
                B = B.set([i,1],i);
            }
            const D = dbl.matsolve(C,B);
            for (let i=1;i<=dim;i++) {
                assert.closeTo(D.get(i).real,(i+i+dim)/2.0,1e-10);
            }
        });
    }
    for (let dim of sizes) {
        it(`should correctly solve A x = B for real rectangular matrices of size ${2*dim} x ${dim}, and right hand sides of size ${dim} x 4`, () => {
            let C = dbl.make_array([2*dim,dim]);
            for (let i=1;i<=dim;i++) {
                C = C.set([i,i],1);
                C = C.set([i+dim,i],1);
            }
            let B = dbl.make_array([2*dim,4]);
            for (let i=1;i<=2*dim;i++) {
                for (let j=1;j<=4;j++) {
                    B = B.set([i,j],i*j);
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
        it(`should correctly solve A x = b for real rectangular matrices of size ${dim} x ${2*dim}, and right hand vectors`, () => {
            let C = dbl.make_array([dim,2*dim]);
            for (let i=1;i<=dim;i++) {
                C = C.set([i,i],1);
                C = C.set([i,i+dim],1);
            }
            let B = dbl.make_array([dim,1]);
            for (let i=1;i<=dim;i++) {
                B = B.set([i,1],i);
            }
            const D = dbl.matsolve(C,B);
            for (let i=1;i<=dim;i++) {
                assert.closeTo(D.get(i).real,B.get(i).real/2.0,1e-10);
                assert.closeTo(D.get(i+dim).real,B.get(i).real/2.0,1e-10);
            }
        });
    }
});
