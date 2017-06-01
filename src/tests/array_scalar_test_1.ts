import { suite, test } from "mocha-typescript";

import { assert } from "chai";

import { Get, FMValue, isFMArray, basicValue, length, realScalar, imagScalar } from "../arrays";

import { rand_array, rand_array_complex, test_mat, test_mat_complex, mks, mkc, mkl } from "./test_utils";

import { plus, minus, times, rdivide, ldivide, lt, gt, le, ge, eq, ne } from "../math";

import {cdiv} from '../complex';

import {is_complex, is_scalar} from '../inspect';


interface test_op {
    name: string,
    func: (a: FMValue, b: FMValue) => FMValue,
    op_real: (a: FMValue, b: FMValue) => FMValue,
    op_complex: (a: FMValue, b: FMValue) => FMValue
}

const real = realScalar;
const imag = imagScalar;

const cases = [
    {
        name: 'addition',
        func: plus,
        op_real: (a: FMValue, b: FMValue) => mks(real(a) + real(b)),
        op_complex: (c: FMValue, d: FMValue) => mkc(real(c) + real(d), imag(c) + imag(d))
    },
    {
        name: 'subtraction',
        func: minus,
        op_real: (a: FMValue, b: FMValue) => mks(real(a) - real(b)),
        op_complex: (c: FMValue, d: FMValue) => mkc(real(c) - real(d), imag(c) - imag(d))
    },
    {
        name: 'element-wise multiplication',
        func: times,
        op_real: (a: FMValue, b: FMValue) => mks(real(a) * real(b)),
        op_complex: (c: FMValue, d: FMValue) =>
            mkc(real(c) * real(d) - imag(c) * imag(d),
                real(c) * imag(d) + imag(c) * real(d))
    },
    {
        name: 'element-wise right division',
        func: rdivide,
        op_real: (a: FMValue, b: FMValue) => mks(real(a) / real(b)),
        op_complex: (a: FMValue, b: FMValue) => {
            const ar = real(a);
            const ai = imag(a);
            const br = real(b);
            const bi = imag(b);
            const f = cdiv({real: ar, imag: ai}, {real: br, imag: bi});
            return mkc(f.real,f.imag);
        },
    },
    {
        name: 'element-wise left division',
        func: ldivide,
        op_real: (b: FMValue, a: FMValue) => mks(real(a) / real(b)),
        op_complex: (b: FMValue, a: FMValue) => {
            const ar = real(a);
            const ai = imag(a);
            const br = real(b);
            const bi = imag(b);
            const f = cdiv({real: ar, imag: ai}, {real: br, imag: bi});
            return mkc(f.real,f.imag);
        },
    },
    {
        name: 'less than',
        func: lt,
        op_real: (a: FMValue, b: FMValue) => mkl(real(a) < real(b)),
        op_complex: (a: FMValue, b: FMValue) => mkl(real(a) < real(b)),
    },
    {
        name: 'greater than',
        func: gt,
        op_real: (a: FMValue, b: FMValue) => mkl(real(a) > real(b)),
        op_complex: (a: FMValue, b: FMValue) => mkl(real(a) > real(b)),
    },
    {
        name: 'less equals',
        func: le,
        op_real: (a: FMValue, b: FMValue) => mkl(real(a) <= real(b)),
        op_complex: (a: FMValue, b: FMValue) => mkl(real(a) <= real(b)),
    },
    {
        name: 'greater equals',
        func: ge,
        op_real: (a: FMValue, b: FMValue) => mkl(real(a) >= real(b)),
        op_complex: (a: FMValue, b: FMValue) => mkl(real(a) >= real(b)),
    },
    {
        name: 'equals',
        func: eq,
        op_real: (a: FMValue, b: FMValue) => mkl(real(a) === real(b)),
        op_complex: (a: FMValue, b: FMValue) => mkl((real(a) === real(b)) && (imag(a) === imag(b))),
    },
    {
        name: 'not equals',
        func: ne,
        op_real: (a: FMValue, b: FMValue) => mkl(real(a) !== real(b)),
        op_complex: (a: FMValue, b: FMValue) => mkl((real(a) !== real(b)) || (imag(a) !== imag(b))),
    }
];

const fm_true = mkl(true);
const fm_false = mkl(false);

function scalar_equals(a: FMValue, b: FMValue): boolean {
    const c = eq(a, b);
    if (isFMArray(c))
        return ((c.length === 1) &&
            (c.real[0] === 1));
    return (basicValue(c) !== 0);
}

function scalar_isNaN(a: FMValue): boolean {
    const c = ne(a, a);
    if (isFMArray(c))
        return ((c.length === 1) &&
            (c.real[0] === 1));
    return (basicValue(c) !== 0);
}

function vector_vector_test(a: FMValue, b: FMValue, op: test_op) {
    const complex_flag = (is_complex(a) || is_complex(b));
    const c = op.func(a, b);
    for (let p = 1; p <= length(c); p++) {
        const av = Get(a, [mks(p)]);
        const bv = Get(b, [mks(p)]);
        const cv = Get(c, [mks(p)]);
        let dv: FMValue;
        if (complex_flag)
            dv = op.op_complex(av, bv);
        else
            dv = op.op_real(av, bv);
        if (!(scalar_isNaN(dv) && scalar_isNaN(cv))) {
            if (!scalar_equals(dv, cv)) {
                console.log(a);
                console.log(b);
                console.log(c);
                console.log("Stop at p = " + p + " with ", dv, " versus ", cv, " and av=", av, " bv=", bv);
            }
            assert.isTrue(scalar_equals(dv, cv));
        }
    }
}

function scalar_vector_test(a: FMValue, b: FMValue, op: test_op) {
    const complex_flag = (is_complex(a) || is_complex(b));
    const c = op.func(a, b);
    for (let p = 1; p <= length(c); p++) {
        const bv = Get(b, [mks(p)]);
        let cv: FMValue;
        if (complex_flag)
            cv = op.op_complex(a, bv);
        else
            cv = op.op_real(a, bv);
        const dv = Get(c, [mks(p)]);
        if (!(scalar_isNaN(cv) && scalar_isNaN(dv))) {
            if (!scalar_equals(cv, dv)) {
                console.log(a);
                console.log(b);
                console.log(c);
                console.log("Stop at p = " + p + " with ", dv, " versus ", cv, " and a=", a, " bv=", bv);
            }
            assert.isTrue(scalar_equals(dv, cv));
        }
    }
}

function vector_scalar_test(a: FMValue, b: FMValue, op: test_op) {
    const complex_flag = (is_complex(a) || is_complex(b));
    const c = op.func(a, b);
    for (let p = 1; p <= length(c); p++) {
        const av = Get(a, [mks(p)]);
        let cv: FMValue;
        if (complex_flag)
            cv = op.op_complex(av, b);
        else
            cv = op.op_real(av, b);
        const dv = Get(c, [mks(p)]);
        if (!(scalar_isNaN(cv) && scalar_isNaN(dv))) {
            if (!scalar_equals(cv, dv)) {
                console.log(a);
                console.log(b);
                console.log(c);
                console.log("Stop at p = " + p + " with ", dv, " versus ", cv, " and av=", av, " b=", b);
            }
            assert.isTrue(scalar_equals(dv, cv));
        }
    }
}

function vectest(a: FMValue, b: FMValue, op: test_op) {
    console.log("      -> Testing ", op.name);
    if (is_scalar(a)) return scalar_vector_test(a, b, op);
    if (is_scalar(b)) return vector_scalar_test(a, b, op);
    return vector_vector_test(a, b, op);
}


@suite
export class ScalarTests {
    @test 'should have is_complex false for real values'() {
        assert.isFalse(is_complex(mks(1)));
    }
    @test 'should have is_complex true for complex values'() {
        assert.isTrue(is_complex(mkc(1,3)));
    }
    @test 'should have is_scalar true for real or complex scalars'() {
        assert.equal(length(mks(1)), 1);
        assert.equal(length(mkc(1, 3)), 1);
    }
    @test 'should return a logical true for equal real values'() {
        assert.deepEqual(eq(mks(5), mks(5)), fm_true);
    };
    @test 'should return a logical false for unequal real values'() {
        assert.deepEqual(eq(mks(5), mks(7)), fm_false);
    };
    @test 'should return a logical true for equal complex values'() {
         console.log("Compare result",eq(mkc(5,2),mkc(5,2)));
       assert.deepEqual(eq(mkc(5, 2), mkc(5, 2)), fm_true);
    };
    @test 'should return a logical false for unequal complex values'() {
        assert.deepEqual(eq(mkc(5, 2), mkc(5, 1)), fm_false);
        assert.deepEqual(eq(mkc(5, 2), mkc(4, 2)), fm_false);
        assert.deepEqual(eq(mkc(5, 2), mkc(4, 1)), fm_false);
    };
    @test 'should perform scalar operations correctly with real values'() {
        for (let op of cases) {
            let a = mks(5);
            let b = mks(7);
            let c = op.func(a, b);
            let d = op.op_real(a, b);
            assert.deepEqual(fm_true, eq(c, d));
            assert.isFalse(is_complex(c));
            console.log("      -> Testing ", op.name);
        }
    }
    @test 'should perform scalar operations correctly with complex values'() {
        for (let op of cases) {
            let a = mkc(5, 3);
            let b = mkc(7, 6);
            let c = op.func(a, b);
            let d = op.op_complex(a, b);
            assert.deepEqual(fm_true, eq(c, d));
            console.log("      -> Testing ", op.name);
        }
    }
    @test 'should perform scalar operations correctly with real and complex values'() {
        for (let op of cases) {
            let a = mks(5);
            let b = mkc(7, 6);
            let c = op.func(a, b);
            let d = op.op_complex(a, b);
            assert.deepEqual(fm_true, eq(c, d));
            let e = op.func(b, a);
            let f = op.op_complex(b, a);
            assert.deepEqual(fm_true, eq(e, f));
            console.log("      -> Testing ", op.name);
        }
    }
    @test 'should broadcast operations over an array with real values'() {
        for (let op of cases) {
            let c = mks(5);
            let d = test_mat(3, 5);
            vectest(c, d, op);
        }
    }
    @test 'should broadcast operations over an array with complex values'() {
        for (let op of cases) {
            let c = mks(5);
            let d = test_mat_complex(3, 5);
            assert.isTrue(is_complex(d));
            vectest(c, d, op);
        }
    }
    @test 'should support broadcast a complex scalar over an array with real values'() {
        for (let op of cases) {
            let c = mkc(5, 3);
            let d = test_mat(3, 4);
            vectest(c, d, op);
        }
    }
    @test 'should support broadcast over an array with complex values and a complex scalar'() {
        for (let op of cases) {
            let c = mkc(5, 3);
            let d = test_mat_complex(3, 4);
            vectest(c, d, op);
        }
    }
    @test 'should broadcast over an array with real values'() {
        for (let op of cases) {
            let c = test_mat(3, 5);
            let d = mks(5);
            vectest(c, d, op);
        }
    }
    @test 'should broadcast over an array with complex values'() {
        for (let op of cases) {
            let c = test_mat_complex(3, 5);
            let d = mks(5);
            assert.isTrue(is_complex(c));
            vectest(c, d, op);
        }
    }
    @test 'should support broadcast over an array with real values and a complex scalar'() {
        for (let op of cases) {
            let c = test_mat(3, 4);
            let d = mkc(5, 3);
            vectest(c, d, op);
        }
    }
    @test 'should support over an array with complex values and a complex scalar'() {
        for (let op of cases) {
            let c = test_mat_complex(3, 4);
            let d = mkc(5, 3);
            assert.isTrue(is_complex(c));
            assert.isTrue(is_complex(d));
            vectest(c, d, op);
        }
    }
    @test 'should support arrays of real values'() {
        for (let op of cases) {
            let c = test_mat(3, 4);
            let d = test_mat(3, 4);
            vectest(c, d, op);
        }
    }
    @test 'should support arrays of real and complex values'() {
        for (let op of cases) {
            let c = test_mat(3, 4);
            let d = test_mat_complex(3, 4);
            assert.isTrue(is_complex(d));
            vectest(c, d, op);
        }
    }
    @test 'should support arrays of complex and real values'() {
        for (let op of cases) {
            let c = test_mat_complex(3, 4);
            let d = test_mat(3, 4);
            assert.isTrue(is_complex(c));
            vectest(c, d, op);
        }
    }
    @test 'should support arrays of complex values'() {
        for (let op of cases) {
            let c = test_mat_complex(3, 4);
            let d = test_mat_complex(3, 4);
            assert.isTrue(is_complex(c));
            assert.isTrue(is_complex(d));
            vectest(c, d, op);
        }
    }
    @test 'should produce correct results with large random real matrices'() {
        for (let op of cases) {
            let c = rand_array([12, 12]);
            let d = rand_array([12, 12]);
            vectest(c, d, op);
        }
    }
    @test 'should produce correct results with large random complex matrices'() {
        for (let op of cases) {
            let c = rand_array_complex([12, 12]);
            let d = rand_array_complex([12, 12]);
            vectest(c, d, op);
        }
    }
    @test 'should produce correct results with large random complex/real/matrices'() {
        for (let op of cases) {
            let c = rand_array([12, 12]);
            let d = rand_array_complex([12, 12]);
            vectest(c, d, op);
        }
    }
    @test 'should refuse to apply operator with unequal sized arrays'() {
        for (let op of cases) {
            let c = rand_array([12, 12]);
            let d = rand_array([3, 5]);
            assert.throws(() => { op.func(c, d); }, TypeError, /mismatch/);
        }
    }
}

