'use strict';
const chai = require('chai');
const assert = chai.assert;
const dbl = require('../double.js').init();
const tst = require('../test_help.js');

describe('resize tests', function() {
    let sizes = [2, 4, 8, 32, 50, 100];
    let zero = dbl.make_scalar(0);
    for (let dim of sizes) {
        it(`should correctly resize a real matrix of size ${dim} x ${dim} to size ${dim*2} x ${dim}`, () => {
            let p = tst.testMat(dim,dim);
            let q = p.resize([dim*2,dim]);
            assert(q.dims[0] === dim*2);
            assert(q.dims[1] === dim);
            for (let row=1;row<=dim;row++)
                for (let col=1;col<=dim;col++)
                    assert.isTrue(p.get([row,col]).equals(q.get([row,col])).bool());
            for (let row=dim+1;row<=2*dim;row++)
                for (let col=1;col<=dim;col++)
                    assert.isTrue(p.get([row,col]).equals(zero).bool());
        });
        it(`should correctly resize a real matrix of size ${dim} x ${dim} to size ${dim} x ${2*dim}`, () => {
            let p = tst.testMat(dim,dim);
            let q = p.resize([dim,dim*2]);
            assert(q.dims[0] === dim);
            assert(q.dims[1] === dim*2);
            for (let row=1;row<=dim;row++)
                for (let col=1;col<=dim;col++)
                    assert.isTrue(p.get([row,col]).equals(q.get([row,col])).bool());
            for (let row=1;row<=dim;row++)
                for (let col=dim+1;col<=2*dim;col++)
                    assert.isTrue(p.get([row,col]).equals(zero).bool());            
        });
        it(`should correctly resize a complex matrix of size ${dim} x ${dim} to size ${dim*2} x ${dim}`, () => {
            let p = tst.testMatComplex(dim,dim);
            let q = p.resize([dim*2,dim]);
            assert(q.dims[0] === dim*2);
            assert(q.dims[1] === dim);
            for (let row=1;row<=dim;row++)
                for (let col=1;col<=dim;col++)
                    assert.isTrue(p.get([row,col]).equals(q.get([row,col])).bool());
            for (let row=dim+1;row<=2*dim;row++)
                for (let col=1;col<=dim;col++)
                    assert.isTrue(p.get([row,col]).equals(zero).bool());
        });
        it(`should correctly resize a complex matrix of size ${dim} x ${dim} to size ${dim} x ${dim*2}`, () => {
            let p = tst.testMatComplex(dim,dim);
            let q = p.resize([dim,dim*2]);
            assert(q.dims[0] === dim);
            assert(q.dims[1] === dim*2);
            for (let row=1;row<=dim;row++)
                for (let col=1;col<=dim;col++)
                    assert.isTrue(p.get([row,col]).equals(q.get([row,col])).bool());
            for (let row=1;row<=dim;row++)
                for (let col=dim+1;col<=2*dim;col++)
                    assert.isTrue(p.get([row,col]).equals(zero).bool());
        });
        it(`should correctly resize a real n-dim array of size ${dim}x${dim*2}x${dim*3} to size ${dim*2}x${dim*2}x${dim*3}`, () => {
            let odims = [dim,2*dim,3*dim];
            let ndims = [2*dim,2*dim,3*dim];
            let p = tst.randMat(odims);
            let q = p.resize(ndims);
            for (let slice=1;slice<=3*dim;slice+=8)
                for (let col=1;col<=2*dim;col+=2)
                    for (let row=1;row<=dim;row+=2)
                        assert.isTrue(p.get([row,col,slice]).equals(q.get([row,col,slice])).bool());
        });
    }
    it('should correctly vector-resize a matrix', () => {
        let p = dbl.make_array([3,4]);
        p.real = [1,2,3,4,5,6,7,8,9,10,11,12];
        p = p.set(13,1);
        for (let ndx=1;ndx<=12;ndx++) {
            assert.isTrue(p.get(ndx).equals(dbl.make_scalar(ndx)).bool());
        }
        assert.isTrue(p.get(13).equals(dbl.make_scalar(1)).bool());
    });
    it('should preserve the columness of a vector when resizing', () => {
        let p = dbl.make_array([4,1]);
        p.real = [1,2,3,4];
        p = p.set(13,1);
        assert.equal(p.dims[0],13);
        assert.equal(p.dims[1],1);
    });
    it('should preserve the rowness of a vector when resizing', () => {
        let p = dbl.make_array([1,4]);
        p.real = [1,2,3,4];
        p = p.set(13,1);
        assert.equal(p.dims[0],1);
        assert.equal(p.dims[1],13);
    });
});
