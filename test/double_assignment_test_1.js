'use strict';
const chai = require('chai');
const assert = chai.assert;
const dbl = require('../double.js');
const tst = require('../test_help.js');

describe('double assignment tests', function() {
    it('should allow set/get row operations on an array with real values', () => {
        let a = dbl.make_array([10,1]);
        for (let i=1;i<=10;i++) {
            a = a.set(i,dbl.make_scalar(i));
        }
        for (let i=1;i<=10;i++) {
            assert.isTrue(a.get(i).equals(dbl.make_scalar(i)).bool());
        }
    });
    it('should allow set/get row operations on an array with complex values', () => {
        let a = dbl.make_array([10,1]);
        for (let i=1;i<=10;i++) {
            a = a.set(i,dbl.make_scalar(i,i+1));
        }
        for (let i=1;i<=10;i++) {
            assert.isTrue(a.get(i).equals(dbl.make_scalar(i,i+1)).bool());
        }
    });
    it('should have a valid imaginary part for real arrays', () => {
        let a = dbl.make_array([10,1]);
        for (let i=1;i<=10;i++) {
            a = a.set(i,dbl.make_scalar(i));
        }
        for (let i=1;i<=10;i++) {
            assert.isTrue(a.get(i).imag === 0);
        }
        assert.isFalse(a.is_complex);
    });
    it('should automatically promote real arrays to complex ones', () => {
        let a = dbl.make_array([10,1]);
        for (let i=1;i<=10;i++) {
            a = a.set(i,dbl.make_scalar(i));
        }
        a = a.set(1,dbl.make_scalar(1,1));
        for (let i=2;i<=10;i++) {
            assert.isTrue(a.get(i).imag === 0);
        }
        assert.isTrue(a.get(1).imag === 1);
        assert.isTrue(a.is_complex);
    });
    it('should choose complex arrays for insertion into an empty one', () => {
        let a = dbl.make_array([4,1]);
        for (let i=1;i<=4;i++)
            a = a.set(i,dbl.make_scalar(i,-i));
        assert.isTrue(a.is_complex);
        for (let i=1;i<=4;i++)
            assert.isTrue(a.get(i).equals(dbl.make_scalar(i,-i)).bool());
    });
    it('should automatically demote complex arrays to real ones', () => {
        let a = dbl.make_array([10,1]);
        for (let i=1;i<=10;i++) {
            a = a.set(i,dbl.make_scalar(i));
        }
        a = a.set(1,dbl.make_scalar(1,1));
        assert.isTrue(a.is_complex);
        a = a.set(1,dbl.make_scalar(1));
        assert.isFalse(a.is_complex);
    });
    it('should allow for multidimensional gets/sets in a multidimensional array (real)', () => {
        let a = dbl.make_array([3,4,5]);
        for (let i=1;i<=5;i++) {
            for (let j=1;j<=4;j++) {
                for (let k=1;k<=3;k++) {
                    let p = k + (j-1)*3 + (i-1)*4*3;
                    a = a.set([k,j,i],dbl.make_scalar(p));
                }
            }
        }
        for (let i=1;i<=5;i++) {
            for (let j=1;j<=4;j++) {
                for (let k=1;k<=3;k++) {
                    let p = k + (j-1)*3 + (i-1)*4*3;
                    assert.isTrue(a.get([k,j,i]).equals(dbl.make_scalar(p)).bool());
                }
            }
        }        
    });
    it('should allow for multidimensional gets/sets in a multidimensional array (complex)', () => {
        let a = dbl.make_array([3,4,5]);
        for (let i=1;i<=5;i++) {
            for (let j=1;j<=4;j++) {
                for (let k=1;k<=3;k++) {
                    let p = k + (j-1)*3 + (i-1)*4*3;
                    a = a.set([k,j,i],dbl.make_scalar(p,p+1));
                }
            }
        }
        for (let i=1;i<=5;i++) {
            for (let j=1;j<=4;j++) {
                for (let k=1;k<=3;k++) {
                    let p = k + (j-1)*3 + (i-1)*4*3;
                    assert.isTrue(a.get([k,j,i]).equals(dbl.make_scalar(p,p+1)).bool());
                }
            }
        }        
    });
    it('should allow for column addressing for sets in a multidimensional array', () => {
        let a = dbl.make_array([3,4,5]);
        for (let i=1;i<=(3*4*5);i++) {
            a = a.set(i,dbl.make_scalar(i));
        }
        for (let i=1;i<=5;i++) {
            for (let j=1;j<=4;j++) {
                for (let k=1;k<=3;k++) {
                    let p = k + (j-1)*3 + (i-1)*4*3;
                    assert.isTrue(a.get([k,j,i]).equals(dbl.make_scalar(p)).bool());
                }
            }
        }
    });
    it('should allow for column addressing for gets in a multidimensional array', () => {
        let a = dbl.make_array([3,4,5]);
        for (let i=1;i<=5;i++) {
            for (let j=1;j<=4;j++) {
                for (let k=1;k<=3;k++) {
                    let p = k + (j-1)*3 + (i-1)*4*3;
                    a = a.set([k,j,i],dbl.make_scalar(p));
                    assert.isTrue(a.get([k,j,i]).equals(dbl.make_scalar(p)).bool());
                }
            }
        }        
        for (let i=1;i<=(3*4*5);i++) {
            a = a.set(i,dbl.make_scalar(i));
        }
    });
    it('should expand a scalar to a row-vector upon vector assignment', () => {
        let a = dbl.make_scalar(1);
        a = a.set(3,dbl.make_scalar(3));
        assert.isFalse(a.is_scalar);
        assert.isFalse(a.is_complex);
        assert.equal(a.length,3);
        assert.equal(a.dims[0],1);
        assert.equal(a.dims[1],3);
        assert.isTrue(a.get(3).equals(dbl.make_scalar(3)).bool());
    });
    it('should expand a scalar to a column-vector upon row-explicit assignment', () => {
        let a = dbl.make_scalar(1);
        a = a.set([3,1],dbl.make_scalar(3));
        assert.isFalse(a.is_scalar);
        assert.isFalse(a.is_complex);
        assert.equal(a.length,3);
        assert.equal(a.dims[0],3);
        assert.equal(a.dims[1],1);
        assert.isTrue(a.get(3).equals(dbl.make_scalar(3)).bool());
    });
    it('should expand a scalar to a multi-dimensional array upon multi-dim assignment', () => {
        let a = dbl.make_scalar(1);
        a = a.set([3,4,5],dbl.make_scalar(3));
        assert.isFalse(a.is_scalar);
        assert.isFalse(a.is_complex);
        assert.equal(a.length,3*4*5);
        assert.equal(a.dims[0],3);
        assert.equal(a.dims[1],4);
        assert.equal(a.dims[2],5);
        assert.isTrue(a.get([3,4,5]).equals(dbl.make_scalar(3)).bool());
    });
});
