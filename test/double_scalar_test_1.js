'use strict';
const chai = require('chai');
const assert = chai.assert;
const dbl = require('../double.js');
const tst = require('../test_help.js');
const real = dbl.real_scalar;
const imag = dbl.imag_scalar;

function dmsc(x,y) {
    return dbl.make_scalar(x,y);
}

function dmsr(x) {
    return dbl.make_scalar(x,0);
}

function dml(x) {
    return dbl.make_logical_scalar(x);
}

function vector_vector_test(a,b,op) {
    const complex_flag = (a.is_complex || b.is_complex);
    const c = op.func(a,b);
    for (let p=1;p<=c.length;p++) {
	const av = a.get(p);
	const bv = b.get(p);
	const cv = c.get(p);
	var dv;
	if (complex_flag)
	    dv = op.op_complex(av,bv);
	else
	    dv = op.op_real(av,bv);
	assert.isTrue(dv.equals(cv).bool());
    }
}

function scalar_vector_test(a,b,op) {
    const complex_flag = (a.is_complex || b.is_complex);
    const c = op.func(a,b);
    for (let p=1;p<=c.length;p++) {
	const bv = b.get(p);
	var cv;
	if (complex_flag)
	    cv = op.op_complex(a,bv);
	else
	    cv = op.op_real(a,bv);
	assert.isTrue(cv.equals(c.get(p)).bool());
    }
}

function vector_scalar_test(a,b,op) {
    const complex_flag = (a.is_complex || b.is_complex);
    const c = op.func(a,b);
    for (let p=1;p<=c.length;p++) {
	const av = a.get(p);
	var cv;
	if (complex_flag)
	    cv = op.op_complex(av,b);
	else
	    cv = op.op_real(av,b);
	assert.isTrue(cv.equals(c.get(p)).bool());
    }
}

function vectest(a,b,op) {
    if (a.is_scalar) return scalar_vector_test(a,b,op);
    if (b.is_scalar) return vector_scalar_test(a,b,op);
    return vector_vector_test(a,b,op);
}

const cases = [{name: 'addition',
                func: (x,y) => x.plus(y),
                op_real: (a,b) => dmsr(real(a)+real(b)),
                op_complex: (c,d) => dmsc(real(c)+real(d),imag(c)+imag(d))
               },
	       {name: 'subtraction',
		func: (x,y) => x.minus(y),
		op_real: (a,b) => dmsr(real(a)-real(b)),
		op_complex: (c,d) => dmsc(real(c)-real(d),imag(c)-imag(d))
	       },
	       {name: 'element-wise multiplication',
		func: (x,y) => x.times(y),
		op_real: (a,b) => dmsr(real(a)*real(b)),
		op_complex: (c,d) => dmsc(real(c)*real(d) - imag(c)*imag(d),
					  real(c)*imag(d) + imag(c)*real(d))
	       },
	       {name: 'element-wise right division',
		func: (x,y) => x.rdivide(y),
		op_real: (a,b) => dmsr(real(a)/real(b)),
		op_complex: (a,b) => {
		    const ar = real(a);
		    const ai = imag(a);
		    const br = real(b);
		    const bi = imag(b);
		    const ratio = bi / br ;
		    const den = br * (1 + ratio*ratio);
		    const c0 = ((ar + ai*ratio) / den);
		    const c1 = ((ai - ar*ratio) / den);
		    return dmsc(c0,c1);
		}},
	       {name: 'element-wise left division',
		func: (x,y) => x.ldivide(y),
		op_real: (b,a) => dmsr(real(a)/real(b)),
		op_complex: (b,a) => {
		    const ar = real(a);
		    const ai = imag(a);
		    const br = real(b);
		    const bi = imag(b);
		    const ratio = bi / br ;
		    const den = br * (1 + ratio*ratio);
		    const c0 = ((ar + ai*ratio) / den);
		    const c1 = ((ai - ar*ratio) / den);
		    return dmsc(c0,c1);
		}},
               {
                   name: 'less than',
                   func: (x,y) => x.lt(y),
                   op_real: (a,b) => dml(real(a)<real(b)),
                   op_complex: (a,b) => dml(real(a) < real(b))
               },
               {
                   name: 'greater than',
                   func: (x,y) => x.gt(y),
                   op_real: (a,b) => dml(real(a)>real(b)),
                   op_complex: (a,b) => dml(real(a)>real(b))
               }
              ];

const scalar_cases = [
    {
        describe: 'scalars are true scalars',
        real: dmsr,
        complex: dmsc,
        eq: (x,y) => x.equals(y).bool()
    },
    {
        describe: 'scalars are 1x1 matrices',
        real: x => dbl.make_array([1,1],[x]),
        complex: (x,y) => dbl.make_array([1,1],[x],[y]),
        eq: (x,y) => ((dbl.real_scalar(x) === dbl.real_scalar(y)) &&
                      (dbl.imag_scalar(x) === dbl.imag_scalar(y)))
    }
];

for (let mk of scalar_cases) {
    const dmsr = mk.real;
    const dmsc = mk.complex;
    const equ = mk.eq;
    describe('scalar double tests where ' + mk.describe, function() {
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
            assert.isTrue(equ(dmsr(5),dmsr(5)));
        });
        it('should return a logical false for unequal real values', () => {
            assert.isFalse(equ(dmsr(5),dmsr(7)));
        });
        it('should return a logical true for equal complex values', () => {
            assert.isTrue(equ(dmsc(5,2),dmsc(5,2)));
        });
        it('should return a logical false for unequal complex values', () => {
            assert.isFalse(equ(dmsc(5,2),dmsc(5,1)));
            assert.isFalse(equ(dmsc(5,2),dmsc(4,2)));
            assert.isFalse(equ(dmsc(5,2),dmsc(4,1)));
        });
        for (let op of cases) {
            it(`should perform scalar ${op.name} correctly with real values`, () => {
                let a = dmsr(5);
                let b = dmsr(7);
                let c = op.func(a,b);
                let d = op.op_real(a,b);
                assert.isTrue(equ(c,d));
                assert.isFalse(c.is_complex);
            });
            it(`should perform scalar ${op.name} correctly with complex values`, () => {
                let a = dmsc(5,3);
                let b = dmsc(7,6);
                let c = op.func(a,b);
                let d = op.op_complex(a,b);
                assert.isTrue(equ(c,d));
                assert.isTrue(c.is_logical || c.is_complex);
            });
            it(`should perform scalar ${op.name} correctly with a real and complex value`, () => {
                let a = dmsr(5);
                let b = dmsc(7,6);
                let c = op.func(a,b);
                let d = op.op_complex(a,b);
                assert.isTrue(equ(c,d));
                let e = op.func(b,a);
                let f = op.op_complex(b,a);
                assert.isTrue(equ(e,f));
            });
            it(`should broadcast ${op.name} over an array with real values`, () => {
                let c = dmsr(5);
                let d = tst.testMat(3,5);
	        vectest(c,d,op);
            });
            it(`should broadcast ${op.name} over an array with complex values`, () => {
                let c = dmsr(5);
                let d = tst.testMat(3,5,1);
	        vectest(c,d,op);
            });
            it(`should support broadcast ${op.name} over an array with real values and a complex scalar`, () => {
                let c = dmsc(5,3);
                let d = tst.testMat(3,4);
	        vectest(c,d,op);
            });
            it(`should support ${op.name} over an array with complex values and a complex scalar`, () => {
                let c = dmsc(5,3);
                let d = tst.testMat(3,4,1);
	        vectest(c,d,op);
            });
            it(`should broadcast ${op.name} over an array with real values`, () => {
                let c = tst.testMat(3,5);
                let d = dmsr(5);
	        vectest(c,d,op);
	    });
            it(`should broadcast ${op.name} over an array with complex values`, () => {
                let c = tst.testMat(3,5,1);
                let d = dmsr(5);
	        vectest(c,d,op);
            });
            it(`should support broadcast ${op.name} over an array with real values and a complex scalar`, () => {
                let c = tst.testMat(3,4);
                let d = dmsc(5,3);
	        vectest(c,d,op);
            });
            it(`should support ${op.name} over an array with complex values and a complex scalar`, () => {
                let c = tst.testMat(3,4,1);
                let d = dmsc(5,3);
	        vectest(c,d,op);
            });
            it(`should support ${op.name} of arrays of real values`, () => {
                let c = tst.testMat(3,4);
                let d = tst.testMat(3,4);
	        vectest(c,d,op);
            });
            it(`should support ${op.name} of arrays of real and complex values`, () => {
                let c = tst.testMat(3,4);
                let d = tst.testMat(3,4,1);
	        vectest(c,d,op);
            });
            it(`should support ${op.name} of arrays of complex and real values`, () => {
                let c = tst.testMat(3,4,1);
                let d = tst.testMat(3,4);
	        vectest(c,d,op);
            });
            it(`should support ${op.name} of arrays of complex values`, () => {
                let c = tst.testMat(3,4,1);
                let d = tst.testMat(3,4,1);
	        vectest(c,d,op);
            });
        }
    });
}
