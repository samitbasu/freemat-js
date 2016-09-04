'use strict';
const chai = require('chai');
const assert = chai.assert;
const dbl = require('../double.js');
const tst = require('../test_help.js');

describe('basic timing tests', function() {
    let A = dbl.make_array([512,512,10]);
    it('should fill a 10x512x512 array in under 0.7 seconds', () => {
        assert.isBelow(tst.time_it( () => {
            for (let z=1;z<=10;z++) {
                for (let i=1;i<=512;i++) {
                    for (let j=1;j<=512;j++) {
                        A.set([j,i,z],dbl.make_scalar(i-j,0));
                    }
                }
            }
        } ), 0.7);
    });
    it('should increment a large array in under 30 milliseconds', () => {
        assert.isBelow(tst.time_it( () => {
            A = dbl.make_scalar(1,0).plus(A);
        } ), 0.030);
    });
    it('should multiply a pair of 1000x1000 matrices in under 100 milliseconds', () => {
        let C = tst.testMat(1000,1000);
        let D = tst.testMat(1000,1000);
        assert.isBelow(tst.time_it( () => {
            let G = C.mtimes(D);
        } ), 0.100);
    });
});
