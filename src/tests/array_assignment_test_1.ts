import { suite, test } from "mocha-typescript";

import { FMArray, Set, Get, FnMakeScalarReal, FnMakeScalarComplex } from "../arrays";

import { plus } from "../math";

import { assert } from "chai";

const mks = FnMakeScalarReal;
const mkc = FnMakeScalarComplex;

@suite("Double array assignment statements")
export class ArrayAssignments {
    @test "should allow set/get row operations on an array with real values"() {
        let a = new FMArray([10, 1]);
        for (let i = 1; i <= 10; i++) {
            let I = mks(i);
            a = Set(a, I, mks(i));
        }
        for (let i = 1; i <= 10; i++) {
            let I = mks(i);
            assert.deepEqual(Get(a, I), I);
        }
    }
    @test "should be reasonably fast"() {
        let a = new FMArray([512, 512, 10]);
        for (let i = 1; i <= 512 * 512 * 10; i++) {
            let I = mks(i);
            Set(a, I, plus(Get(a, I), I));
        }
    }
    @test "should allow set/get row operations on an array with complex values"() {
        let a = new FMArray([10, 1]);
        for (let i = 1; i <= 10; i++) {
            let I = mks(i);
            a = Set(a, I, mkc([i, i + 1]));
        }
        for (let i = 1; i <= 10; i++) {
            let I = mks(i);
            assert.deepEqual(Get(a, I), mkc([i, i + 1]));
        }
    }
    @test "should have an undefined imaginary part for real arrays"() {
        let a = new FMArray([10, 1]);
        for (let i = 1; i <= 10; i++) {
            let I = mks(i);
            a = Set(a, I, mks(i));
        }
        assert.isUndefined(a.imag);
    }
    @test "should automatically promote real arrays to complex ones"() {
        let a = new FMArray([10, 1]);
        for (let i = 1; i <= 10; i++) {
            let I = mks(i);
            a = Set(a, I, mks(i));
        }
        Set(a, mks(1), mkc([1, 1]));
        assert.deepEqual(Get(a, mks(1)), mkc([1, 1]));
        for (let i = 2; i <= 10; i++) {
            assert.deepEqual(Get(a, mks(i)), mkc([i, 0]));
        }
    }
    @test "should choose complex arrays for insertion into an empty one"() {
        let a = new FMArray([10, 1]);
        for (let i = 1; i <= 10; i++) {
            let I = mks(i);
            a = Set(a, I, mkc([i, -i]));
        }
        for (let i = 1; i <= 10; i++) {
            assert.deepEqual(Get(a, mks(i)), mkc([i, -i]));
        }

    }
    @test "should automatically demote complex arrays to real ones"() {
        let a = new FMArray([10, 1]);
        a = Set(a, mks(1), mkc([1, 1]));
        assert.isDefined(a.imag);
        a = Set(a, mks(1), mks(1));
        assert.isUndefined(a.imag);
    }
    @test "should allow for multidimensional gets/sets in a multidim array (real)"() {
        let a = new FMArray([3, 4, 5]);
        for (let i = 1; i <= 5; i++) {
            for (let j = 1; j <= 4; j++) {
                for (let k = 1; k <= 3; k++) {
                    let p = k + (j - 1) * 3 + (i - 1) * 4 * 3;
                    let q = new FMArray([3, 1]);
                    q = Set(q, mks(1), mks(k));
                    q = Set(q, mks(2), mks(j));
                    q = Set(q, mks(3), mks(i));
                    a = Set(a, q, mks(p));
                }
            }
        }
        for (let i = 1; i <= 5; i++) {
            for (let j = 1; j <= 4; j++) {
                for (let k = 1; k <= 3; k++) {
                    let p = k + (j - 1) * 3 + (i - 1) * 4 * 3;
                    let q = new FMArray([3, 1]);
                    q = Set(q, mks(1), mks(k));
                    q = Set(q, mks(2), mks(j));
                    q = Set(q, mks(3), mks(i));
                    assert.deepEqual(Get(a, q), mks(p));
                }
            }
        }
    }
    @test "should allow for multidimensional gets/sets in a multidim array (complex)"() {
        let a = new FMArray([3, 4, 5]);
        for (let i = 1; i <= 5; i++) {
            for (let j = 1; j <= 4; j++) {
                for (let k = 1; k <= 3; k++) {
                    let p = k + (j - 1) * 3 + (i - 1) * 4 * 3;
                    let q = new FMArray([3, 1]);
                    q = Set(q, mks(1), mks(k));
                    q = Set(q, mks(2), mks(j));
                    q = Set(q, mks(3), mks(i));
                    a = Set(a, q, mkc([p, -p]));
                }
            }
        }
        for (let i = 1; i <= 5; i++) {
            for (let j = 1; j <= 4; j++) {
                for (let k = 1; k <= 3; k++) {
                    let p = k + (j - 1) * 3 + (i - 1) * 4 * 3;
                    let q = new FMArray([3, 1]);
                    q = Set(q, mks(1), mks(k));
                    q = Set(q, mks(2), mks(j));
                    q = Set(q, mks(3), mks(i));
                    assert.deepEqual(Get(a, q), mkc([p, -p]));
                }
            }
        }
    }
    @test "should allow for column addressing for sets in a multidimensional array"() {
        let a = new FMArray([3, 4, 5]);
        for (let i = 1; i <= (3 * 4 * 5); i++) {
            a = Set(a, mks(i), mks(i));
        }
        for (let i = 1; i <= 5; i++) {
            for (let j = 1; j <= 4; j++) {
                for (let k = 1; k <= 3; k++) {
                    let p = k + (j - 1) * 3 + (i - 1) * 4 * 3;
                    let q = new FMArray([3, 1]);
                    q.real[0] = k; q.real[1] = j; q.real[2] = i;
                    assert.deepEqual(Get(a, q), mks(p));
                }
            }
        }
    }
    @test "should allow for column addressing for gets in a multidimensional array"() {
        let a = new FMArray([3, 4, 5]);
        for (let i = 1; i <= 5; i++) {
            for (let j = 1; j <= 4; j++) {
                for (let k = 1; k <= 3; k++) {
                    let p = k + (j - 1) * 3 + (i - 1) * 4 * 3;
                    let q = new FMArray(3, [k, j, i]);
                    a = Set(a, q, mks(p));
                }
            }
        }
        for (let i = 1; i <= (3 * 4 * 5); i++) {
            assert.deepEqual(Get(a, mks(i)), mks(i));
        }
    }
    @test "should expand a scalar to a row-vector upon vector assignment"() {
        let a = mks(1);
        a = Set(a, mks(3), mks(3));
        assert.equal(a.length, 3);
        assert.equal(a.dims[0], 1);
        assert.equal(a.dims[1], 3);
        assert.equal(a.real[2], 3);
    }
    @test "should expand a scalar to a column-vector upon row-explicit assignment"() {
        let a = mks(1);
        let q = new FMArray(2, [3, 1]);
        a = Set(a, q, mks(3));
        assert.equal(a.length, 3);
        assert.equal(a.dims[0], 3);
        assert.equal(a.dims[1], 1);
        assert.equal(a.real[2], 3);
    }
    @test "should expand a scalar to a multi-dimensional array upon multi-dim assignment"() {
        let a = mks(1);
        let q = new FMArray([3, 1], [3, 4, 5]);
        a = Set(a, q, mks(3));
        assert.equal(a.length, 3 * 4 * 5);
        assert.equal(a.dims[0], 3);
        assert.equal(a.dims[1], 4);
        assert.equal(a.dims[2], 5);
        assert.deepEqual(Get(a, q), mks(3));
    }
}

