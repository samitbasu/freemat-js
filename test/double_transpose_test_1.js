'use strict';
const chai = require('chai');
const assert = chai.assert;
const dbl = require('../double.js');
const tst = require('../test_help.js');

function validate_transposed(C,D) {
    assert(D.dims[0] == C.dims[1]);
    assert(D.dims[1] == C.dims[0]);
    for (let i=1;i<=C.dims[0];i++) {
        for (let j=1;j<=C.dims[1];j++) {
            assert.isTrue(C.get([i,j]).equals(D.get([j,i])).bool());
        }
    }
}

function validate_hermitian(C,D) {
    assert(D.dims[0] == C.dims[1]);
    assert(D.dims[1] == C.dims[0]);
    for (let i=1;i<=C.dims[0];i++) {
        for (let j=1;j<=C.dims[1];j++) {
            assert.isTrue(C.get([i,j]).equals(D.get([j,i]).conjugate()).bool());
        }
    }
}

describe('transpose tests', function() {
    let sizes = [2,4,8,32,100,200];
    const cases = [{description: "real square", row_size: x => x, col_size: x => x, gen : tst.randMat},
                   {description: "real rect (wide)", row_size: x => x, col_size: x => 2*x, gen: tst.randMat},
                   {description: "real rect (tall)", row_size: x => 2*x, col_size: x => x, gen: tst.randMat},
                   {description: "complex square", row_size: x => x, col_size: x => x, gen : tst.randMatComplex},
                   {description: "complex rect (wide)", row_size: x => x, col_size: x => 2*x, gen: tst.randMatComplex},
                   {description: "complex rect (tall)", row_size: x => 2*x, col_size: x => x, gen: tst.randMatComplex}];
    for (let op of cases) {
        for (let dim of sizes) {
            const rows = op.row_size(dim);
            const cols = op.col_size(dim);
            it(`should correctly transpose a ${op.description} matrix of size ${rows}x${cols}`, () => {
                const C = op.gen([rows,cols]);
                const D = C.transpose();
                validate_transposed(C,D);
            });
            it(`should correctly hermite transpose a ${op.description} matrix of size ${rows}x${cols}`, () => {
                const C = op.gen([rows,cols]);
                const D = C.hermitian();
                validate_hermitian(C,D);
            });
        }
    }
    it('should refuse to transpose a multidimensional array', () => {
        const C = dbl.make_array([3,4,5]);
        assert.throws(() => {C.transpose();}, 'function throws an error');
    });
    it('should refuse to hermitian transpose a multidimensional array', () => {
        const C = dbl.make_array([3,4,5]);
        assert.throws(() => {C.hermitian();}, 'function throws an error');
    });
    it('should be (transpose) idempotent for real scalars', () => {
        const C = dbl.make_scalar(5);
        const D = C.transpose();
        assert.isTrue(C.equals(D).bool());
    });
    it('should be (transpose) idempotent for complex scalars', () => {
        const C = dbl.make_scalar(5,3);
        const D = C.transpose();
        assert.isTrue(C.equals(D).bool());
    });
    it('should be (hermitian) idempotent for real scalars', () => {
        const C = dbl.make_scalar(5);
        const D = C.hermitian();
        assert.isTrue(C.equals(D).bool());
    });
    it('should be (hermitian) equivalent to conjugation for complex scalars', () => {
        const C = dbl.make_scalar(5,3);
        const D = C.hermitian();
        assert.isTrue(C.conjugate().equals(D).bool());
    });
});
