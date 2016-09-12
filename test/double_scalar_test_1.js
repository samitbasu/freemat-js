'use strict';
const chai = require('chai');
const assert = chai.assert;
const dbl = require('../double.js');
const tst = require('../test_help.js');

function dmsc(x,y) {
    return dbl.make_scalar(x,y);
}

function dmsr(x) {
    return dbl.make_scalar(x,0);
}



const cases = [{name: 'addition',
                func: (x,y) => x.plus(y),
                op_real: (a,b) => dmsr(a.real+b.real),
                op_complex: (c,d) => {
                    return dmsc(c.real+d.real,c.imag+d.imag);
                }}];

describe('scalar double tests', function() {
    it('should have is_complex false for real values', () => {
        assert.isFalse(dmsr(1).is_complex);
    });
    it('should have is_complex true for complex values', () => {
        assert.isTrue(dmsc(1,3).is_complex);
    });
    it('should have is_scalar true for real or complex scalars', () => {
        assert.isTrue(dmsr(1).is_scalar);
        assert.isTrue(dmsc(1,3).is_scalar);
    });
    it('should return a logical true for equal real values', () => {
        assert.isTrue(dmsr(5).equals(dmsr(5)).bool());
    });
    it('should return a logical false for unequal real values', () => {
        assert.isFalse(dmsr(5).equals(dmsr(7)).bool());
    });
    it('should return a logical true for equal complex values', () => {
        assert.isTrue(dmsc(5,2).equals(dmsc(5,2)).bool());
    });
    it('should return a logical false for unequal complex values', () => {
        assert.isFalse(dmsc(5,2).equals(dmsc(5,1)).bool());
        assert.isFalse(dmsc(5,2).equals(dmsc(4,2)).bool());
        assert.isFalse(dmsc(5,2).equals(dmsc(4,1)).bool());
    });
    for (let op of cases) {
        it(`should perform scalar ${op.name} correctly with real values`, () => {
            let a = dmsr(5);
            let b = dmsr(7);
            let c = op.func(a,b);
            let d = op.op_real(a,b);
            assert.isTrue(c.equals(d).bool());
            assert.isFalse(c.is_complex);
        });
        it(`should perform scalar ${op.name} correctly with complex values`, () => {
            let a = dmsc(5,3);
            let b = dmsc(7,6);
            let c = op.func(a,b);
            let d = op.op_complex(a,b);
            assert.isTrue(c.equals(d).bool());
            assert.isTrue(c.is_complex);
        });
        it(`should perform scalar ${op.name} correctly with a real and complex value`, () => {
            let a = dmsr(5);
            let b = dmsc(7,6);
            let c = op.func(a,b);
            let d = op.op_complex(a,b);
            assert.isTrue(c.equals(d).bool());
            let e = op.func(b,a);
            let f = op.op_complex(b,a);
            assert.isTrue(e.equals(f).bool());
        });
        it(`should broadcast ${op.name} over an array with real values`, () => {
            let c = dmsr(5);
            let d = tst.testMat(3,5);
            let g = op.func(c,d);
            for (let p=1;p<=g.length;p++) {
                let a = g.get(p);
                let b = op.op_real(c,d.get(p));
                assert.isTrue(a.equals(b).bool());
            }
        });
        it(`should broadcast ${op.name} over an array with complex values`, () => {
            let c = dmsr(5);
            let d = tst.testMat(3,5,1);
            let g = op.func(c,d);
            for (let p=1;p<=g.length;p++) {
                let a = g.get(p);
                let b = op.op_complex(c,d.get(p));
                assert.isTrue(a.equals(b).bool());
            }
        });
        it('should support broadcast ${op.name} over an array with real values and a complex scalar', () => {
            let c = dmsc(5,3);
            let d = tst.testMat(3,4);
            let g = op.func(c,d);
            for (let p=1;p<=g.length;p++) {
                let a = g.get(p);
                let b = op.op_complex(c,d.get(p));
                assert.isTrue(a.equals(b).bool());
            }
        });
        it('should support addition over an array with complex values and a complex scalar', () => {
            let c = dmsc(5,3);
            let d = tst.testMat(3,4,1);
            let g = c.plus(d);
            for (let p=1;p<=g.length;p++) {
                assert.isTrue(g.get(p).equals(c.plus(d.get(p))).bool());
            }
        });
        it(`should broadcast ${op.name} over an array with real values`, () => {
            let c = tst.testMat(3,5);
            let d = dmsr(5);
            let g = op.func(c,d);
            for (let p=1;p<=g.length;p++) {
                let a = g.get(p);
                let b = op.op_real(c.get(p),d);
                assert.isTrue(a.equals(b).bool());
            }
        });
        it(`should broadcast ${op.name} over an array with complex values`, () => {
            let c = tst.testMat(3,5,1);
            let d = dmsr(5);
            let g = op.func(c,d);
            for (let p=1;p<=g.length;p++) {
                let a = g.get(p);
                let b = op.op_complex(c.get(p),d);
                assert.isTrue(a.equals(b).bool());
            }
        });
        it('should support broadcast ${op.name} over an array with real values and a complex scalar', () => {
            let c = tst.testMat(3,4);
            let d = dmsc(5,3);
            let g = op.func(c,d);
            for (let p=1;p<=g.length;p++) {
                let a = g.get(p);
                let b = op.op_complex(c.get(p),d);
                assert.isTrue(a.equals(b).bool());
            }
        });
        it('should support addition over an array with complex values and a complex scalar', () => {
            let c = tst.testMat(3,4,1);
            let d = dmsc(5,3);
            let g = c.plus(d);
            for (let p=1;p<=g.length;p++) {
                let a = g.get(p);
                let b = op.op_complex(c.get(p),d);
                assert.isTrue(a.equals(b).bool());
            }
        });
        it('should support addition of arrays of real values', () => {
            let c = tst.testMat(3,4);
            let d = tst.testMat(3,4);
            let g = c.plus(d);
            for (let p=1;p<=g.length;p++) {
                assert.isTrue(g.get(p).equals((c.get(p)).plus(d.get(p))).bool());
            }
        });
    }
});
