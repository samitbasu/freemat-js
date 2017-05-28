import { suite, test } from "mocha-typescript";

import { assert } from "chai";

import { Resize, Get, FMArray, Set } from "../arrays";

import { rand_array, test_mat, test_mat_complex, mkv, mks } from "./test_utils";

const sizes = [2, 4, 8, 32, 50, 100];

@suite("resize tests")
export class ResizeTests {
    @test "should correctly resize a real matrix to 2X rows"() {
        for (let dim of sizes) {
            let P = test_mat(dim, dim);
            let Q = Resize(P, [dim * 2, dim]);
            assert.equal(Q.dims[0], dim * 2);
            assert.equal(Q.dims[1], dim);
            for (let row = 1; row <= dim; row++)
                for (let col = 1; col <= dim; col++)
                    assert.deepEqual(Get(P, mkv([row, col])), Get(Q, mkv([row, col])));
            console.log("Passed with ", [dim * 2, dim]);
        }
    }
    @test "should correctly resize a real matrix to 2X cols"() {
        for (let dim of sizes) {
            let P = test_mat(dim, dim);
            let Q = Resize(P, [dim, dim * 2]);
            assert.equal(Q.dims.length, 2);
            assert.equal(Q.dims[0], dim);
            assert.equal(Q.dims[1], dim * 2);
            for (let row = 1; row <= dim; row++)
                for (let col = 1; col <= dim; col++)
                    assert.deepEqual(Get(P, mkv([row, col])), Get(Q, mkv([row, col])));
            console.log("Passed with ", [dim, dim * 2]);
        }
    }
    @test "should correctly resize a real matrix to 2X cols, 2X rows"() {
        for (let dim of sizes) {
            let P = test_mat(dim, dim);
            let Q = Resize(P, [dim * 2, dim * 2]);
            assert.equal(Q.dims.length, 2);
            assert.equal(Q.dims[0], dim * 2);
            assert.equal(Q.dims[1], dim * 2);
            for (let row = 1; row <= dim; row++)
                for (let col = 1; col <= dim; col++)
                    assert.deepEqual(Get(P, mkv([row, col])), Get(Q, mkv([row, col])));
            console.log("Passed with ", [dim * 2, dim * 2]);
        }
    }
    @test "should correctly resize a complex matrix to 2X rows"() {
        for (let dim of sizes) {
            let P = test_mat_complex(dim, dim);
            let Q = Resize(P, [dim * 2, dim]);
            assert.equal(Q.dims[0], dim * 2);
            assert.equal(Q.dims[1], dim);
            for (let row = 1; row <= dim; row++)
                for (let col = 1; col <= dim; col++)
                    assert.deepEqual(Get(P, mkv([row, col])), Get(Q, mkv([row, col])));
            console.log("Passed with ", [dim * 2, dim]);
        }
    }
    @test "should correctly resize a complex matrix to 2X cols"() {
        for (let dim of sizes) {
            let P = test_mat_complex(dim, dim);
            let Q = Resize(P, [dim, dim * 2]);
            assert.equal(Q.dims.length, 2);
            assert.equal(Q.dims[0], dim);
            assert.equal(Q.dims[1], dim * 2);
            for (let row = 1; row <= dim; row++)
                for (let col = 1; col <= dim; col++)
                    assert.deepEqual(Get(P, mkv([row, col])), Get(Q, mkv([row, col])));
            console.log("Passed with ", [dim, dim * 2]);
        }
    }
    @test "should correctly resize a complex matrix to 2X cols, 2X rows"() {
        for (let dim of sizes) {
            let P = test_mat_complex(dim, dim);
            let Q = Resize(P, [dim * 2, dim * 2]);
            assert.equal(Q.dims.length, 2);
            assert.equal(Q.dims[0], dim * 2);
            assert.equal(Q.dims[1], dim * 2);
            for (let row = 1; row <= dim; row++)
                for (let col = 1; col <= dim; col++)
                    assert.deepEqual(Get(P, mkv([row, col])), Get(Q, mkv([row, col])));
            console.log("Passed with ", [dim * 2, dim * 2]);
        }
    }
    @test "should correctly resize a real n-dim array of size NxMxP -> 2NxMxP"() {
        for (let dim of sizes) {
            let odims = [dim, 2 * dim, 3 * dim];
            let ndims = [2 * dim, 2 * dim, 3 * dim];
            let P = rand_array(odims);
            let Q = Resize(P, ndims);
            for (let slice = 1; slice <= 3 * dim; slice += 8)
                for (let col = 1; col <= 2 * dim; col += 3)
                    for (let row = 1; row <= dim; row += 4)
                        assert.deepEqual(Get(P, mkv([row, col, slice])), Get(Q, mkv([row, col, slice])));
            console.log("Passed with ", [dim, dim * 2, dim * 3]);
        }
    }
    @test "should correctly vector-resize a matrix"() {
        let P = new FMArray([3, 4], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        P = Set(P, [mks(13)], mks(1));
        for (let ndx = 1; ndx <= 12; ndx++) {
            assert.equal(Get(P, mks(ndx)).real[0], ndx);
        }
    }
    @test "should preserve the column-ness of a vector when resizing"() {
        let P = new FMArray([4, 1], [1, 2, 3, 4]);
        P = Set(P, [mks(13)], mks(1));
        assert.equal(P.dims[0], 13);
        assert.equal(P.dims[1], 1);
        for (let ndx = 1; ndx <= 4; ndx++) {
            assert.equal(Get(P, mks(ndx)).real[0], ndx);
        }
    }
    @test "should preserve the row-ness of a vector when resizing"() {
        let P = new FMArray([1, 4], [1, 2, 3, 4]);
        P = Set(P, [mks(13)], mks(1));
        assert.equal(P.dims[0], 1);
        assert.equal(P.dims[1], 13);
        for (let ndx = 1; ndx <= 4; ndx++) {
            assert.equal(Get(P, mks(ndx)).real[0], ndx);
        }
    }
    @test "should preserve the non-singleton dimension of a vector when resizing"() {
        let P = new FMArray([1, 1, 1, 4], [1, 2, 3, 4]);
        P = Set(P, [mks(13)], mks(1));
        assert.deepEqual(P.dims, [1, 1, 1, 13]);
        for (let ndx = 1; ndx <= 4; ndx++) {
            assert.equal(Get(P, mks(ndx)).real[0], ndx);
        }
    }
}
