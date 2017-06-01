import { suite, test } from "mocha-typescript";

import { FMArray, Set, Get, FnMakeScalarReal } from "../arrays";

import { plus, times, mtimes } from "../math";

import { assert } from "chai";

import { mat_equal, test_mat, test_mat_complex } from "./test_utils";

const mks = FnMakeScalarReal;


function matmul(A: FMArray, B: FMArray): FMArray {
    const Arows = A.dims[0];
    const Acols = A.dims[1];
    const Brows = B.dims[0];
    const Bcols = B.dims[1];
    assert.equal(Acols, Brows);
    let C = new FMArray([Arows, Bcols]);
    for (let row = 1; row <= Arows; row++) {
        for (let col = 1; col <= Bcols; col++) {
            let accum = mks(0);
            for (let ndx = 1; ndx <= Acols; ndx++) {
                accum = plus(accum, times(Get(A, [row, ndx]), Get(B, [ndx, col])));
            }
            Set(C, [mks(row), mks(col)], accum);
        }
    }
    return C;
}

function mtimes_test(C: FMArray, D: FMArray): void {
    const G = mtimes(C, D);
    const F = matmul(C, D);
    assert.isTrue(mat_equal(F, G));
}

const sizes = [1, 2, 4, 8, 100];

@suite
export class MTimesTests {
    @test "should correctly multiply real square matrices"() {
        for (let dim of sizes) {
            const C = test_mat(dim, dim);
            const D = test_mat(dim, dim);
            mtimes_test(C, D);
            console.log("Multiply test for ", [dim, dim]);
        }
    }
    @test "should correctly multiply real rectangular matrices"() {
        for (let dim of sizes) {
            const C = test_mat(dim, dim * 2);
            const D = test_mat(2 * dim, dim);
            mtimes_test(C, D);
            console.log("Multiply test for ", [dim, 2 * dim]);
        }
    }
    @test "should correctly multiply complex rectangular matrices"() {
        for (let dim of sizes) {
            const C = test_mat_complex(dim, dim * 2);
            const D = test_mat_complex(2 * dim, dim);
            mtimes_test(C, D);
            console.log("Multiply test for ", [dim, 2 * dim]);
        }
    }
}

