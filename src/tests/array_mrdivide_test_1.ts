import { suite, test } from "mocha-typescript";

import { FMArray, Set, Get, FnMakeScalarReal, FnMakeScalarComplex } from "../arrays";

import { mrdivide, times, minus } from "../math";

import { assert } from "chai";

const mks = FnMakeScalarReal;
const mkc = FnMakeScalarComplex;

function mkv(p: number[]): FMArray {
    return new FMArray([1, p.length], p);
}

const sizes = [2, 4, 8, 32, 100, 200];

@suite("mrdivide tests")
export class MRDivideAssignments {
    @test "should correctly solve b/A for real square matrices"() {
        for (let dim of sizes) {
            let C = new FMArray([dim, dim]);
            for (let i = 1; i <= dim; i++) {
                C = Set(C, mkv([i, i]), mks(1));
                if (i < dim)
                    C = Set(C, mkv([i, i + 1]), mks(1));
            }
            let B = new FMArray([1, dim]);
            for (let i = 1; i <= dim; i++) {
                B = Set(B, mks(i), mks(1));
            }
            const D = mrdivide(B, C, console.log);
            for (let i = 1; i <= dim; i++) {
                if (i % 2 == 0)
                    assert.deepEqual(Get(D, mks(i)), mks(0));
                if (i % 2 == 1)
                    assert.deepEqual(Get(D, mks(i)), mks(1));
            }
        }
    }
    @test "should correctly solve b/A for complex matrices"() {
        for (let dim of [2, 4, 8, 32, 64, 128]) {
            let C = new FMArray([dim, dim]);
            for (let i = 1; i <= dim; i++) {
                C = Set(C, mkv([i, i]), mkc([1, 1]));
                if (i < dim)
                    C = Set(C, mkv([i, i + 1]), mkc([1, -1]));
            }
            let B = new FMArray([1, dim]);
            for (let i = 1; i <= dim; i++) {
                B = Set(B, mks(i), mkc([i, -i]));
            }
            const D = mrdivide(B, C, console.log);
            let T = new FMArray([dim, 1]);
            let recip_alpha = mkc([0.5, -0.5]);
            let beta = mkc([1, -1]);
            let prev = mks(0);
            for (let i = 1; i <= dim; i++) {
                let tmp0 = Get(B, mks(i));
                let tmp1 = minus(tmp0, times(prev, beta));
                let tmp2 = times(tmp1, recip_alpha);
                T = Set(T, mks(i), tmp2);
                prev = Get(T, mks(i));
            }
            for (let i = 1; i <= dim; i++) {
                assert.deepEqual(Get(T, mks(i)), Get(D, mks(i)));
            }
        };
    }
    @test "should correctly solve b/A for real rectangular matrices"() {
        for (let dim of sizes) {
            let C = new FMArray([dim, 2 * dim]);
            for (let i = 1; i <= dim; i++) {
                C = Set(C, mkv([i, i]), mks(1));
                C = Set(C, mkv([i, i + dim]), mks(1));
            }
            let B = new FMArray([1, 2 * dim]);
            for (let i = 1; i <= 2 * dim; i++) {
                B = Set(B, mkv([1, i]), mks(i));
            }
            const D = mrdivide(B, C, console.log);
            for (let i = 1; i <= dim; i++) {
                assert.closeTo(Get(D, mks(i)).real[0], (i + i + dim) / 2.0, 1e-10);
            }
        };
    }
    @test "should correctly solve B/A for real rectangular matrices of size 2N x N, and right hand sides of size N x 4"() {
        for (let dim of sizes) {
            let C = new FMArray([dim, 2 * dim]);
            for (let i = 1; i <= dim; i++) {
                C = Set(C, mkv([i, i]), mks(1));
                C = Set(C, mkv([i, i + dim]), mks(1));
            }
            let B = new FMArray([4, 2 * dim]);
            for (let i = 1; i <= 2 * dim; i++) {
                for (let j = 1; j <= 4; j++) {
                    B = Set(B, mkv([j, i]), mks(i * j));
                }
            }
            const D = mrdivide(B, C, console.log);
            for (let i = 1; i <= dim; i++) {
                for (let j = 1; j <= 4; j++) {
                    const x = Get(B, mkv([j, i])).real[0];
                    const y = Get(B, mkv([j, i + dim])).real[0];
                    const p = (x + y) / 2.0;
                    assert.closeTo(Get(D, mkv([j, i])).real[0], p, 1e-10);
                }
            }
        }
    }
    @test "should correctly solve b/A for real rectangular matrices of size N x 2N, and right hand vectors"() {
        for (let dim of sizes) {
            let C = new FMArray([2 * dim, dim]);
            for (let i = 1; i <= dim; i++) {
                C = Set(C, mkv([i, i]), mks(1));
                C = Set(C, mkv([i + dim, i]), mks(1));
            }
            let B = new FMArray([1, dim]);
            for (let i = 1; i <= dim; i++) {
                B = Set(B, mkv([1, i]), mks(i));
            }
            const D = mrdivide(B, C, console.log);
            for (let i = 1; i <= dim; i++) {
                assert.closeTo(Get(D, mks(i)).real[0], Get(B, mks(i)).real[0] / 2.0, 1e-10);
                assert.closeTo(Get(D, mks(i + dim)).real[0], Get(B, mks(i)).real[0] / 2.0, 1e-10);
            }
        }
    }
    @test "should refuse to compute b/A if A and b do not have the same number of columns"() {
        let C = new FMArray([7, 9]);
        let B = new FMArray([8, 3]);
        assert.throws(() => { mrdivide(C, B, console.log); }, TypeError, /conformant/);
    }
}
