import { suite, test } from "mocha-typescript";
import { assert } from "chai";
import { mkArray, FMArray, Get } from "../arrays";
import { hermitian, transpose, conj } from "../math";
import { rand_array, rand_array_complex } from "./test_utils";


function validate_transposed(C: FMArray, D: FMArray): void {
    assert.equal(D.dims[0], C.dims[1]);
    assert.equal(D.dims[1], C.dims[0]);
    for (let i = 1; i <= C.dims[0]; i++) {
        for (let j = 1; j <= C.dims[1]; j++) {
            assert.deepEqual(Get(C, [i, j]), Get(D, [j, i]));
        }
    }
}

function validate_hermitian(C: FMArray, D: FMArray): void {
    assert.equal(D.dims[0], C.dims[1]);
    assert.equal(D.dims[1], C.dims[0]);
    for (let i = 1; i <= C.dims[0]; i++) {
        for (let j = 1; j <= C.dims[1]; j++) {
            assert.deepEqual(Get(C, [i, j]), conj(Get(D, [j, i])));
        }
    }
}

const cases = [
    {
        description: "real square",
        row_size: (x: number) => { return x },
        col_size: (x: number) => { return x },
        gen: rand_array
    },
    {
        description: "real rect (wide)",
        row_size: (x: number) => { return x },
        col_size: (x: number) => { return 2 * x },
        gen: rand_array
    },
    {
        description: "real rect (tall)",
        row_size: (x: number) => { return 2 * x },
        col_size: (x: number) => { return x },
        gen: rand_array
    },
    {
        description: "complex square",
        row_size: (x: number) => { return x },
        col_size: (x: number) => { return x },
        gen: rand_array_complex
    },
    {
        description: "complex rect (wide)",
        row_size: (x: number) => { return x },
        col_size: (x: number) => { return 2 * x },
        gen: rand_array_complex
    },
    {
        description: "complex rect (tall)",
        row_size: (x: number) => { return 2 * x },
        col_size: (x: number) => { return x },
        gen: rand_array_complex
    }];

const sizes = [2, 4, 8, 32, 100];

@suite
export class TransposeTests {
    @test "should correctly transpose a matrix"() {
        for (let op of cases) {
            for (let dim of sizes) {
                const rows = op.row_size(dim);
                const cols = op.col_size(dim);
                const C = op.gen([rows, cols]);
                const D = transpose(C);
                validate_transposed(C, mkArray(D));
                console.log("      Case: ", op.description, " size: ", rows, "x", cols);
            }
        }
    }
    @test "should correctly hermite transpose a matrix"() {
        for (let op of cases) {
            for (let dim of sizes) {
                const rows = op.row_size(dim);
                const cols = op.col_size(dim);
                const C = op.gen([rows, cols]);
                const D = hermitian(C);
                validate_hermitian(C, mkArray(D));
                console.log("      Case: ", op.description, " size: ", rows, "x", cols);
            }
        }
    }
}
/*
    it(`should correctly hermite transpose a ${op.description} matrix of size ${rows}x${cols}`, () => {
        const C = op.gen([rows, cols]);
        const D = C.hermitian();
        validate_hermitian(C, D);
    });
        }
    }
it('should refuse to transpose a multidimensional array', () => {
    const C = dbl.make_array([3, 4, 5]);
    assert.throws(() => { C.transpose(); }, TypeError, /matrix operation is not 2D/);
});
it('should refuse to hermitian transpose a multidimensional array', () => {
    const C = dbl.make_array([3, 4, 5]);
    assert.throws(() => { C.hermitian(); }, TypeError, /matrix operation is not 2D/);
});
it('should be (transpose) idempotent for real scalars', () => {
    const C = dbl.make_scalar(5);
    const D = C.transpose();
    assert.isTrue(C.equals(D).bool());
});
it('should be (transpose) idempotent for complex scalars', () => {
    const C = dbl.make_scalar(5, 3);
    const D = C.transpose();
    assert.isTrue(C.equals(D).bool());
});
it('should be (hermitian) idempotent for real scalars', () => {
    const C = dbl.make_scalar(5);
    const D = C.hermitian();
    assert.isTrue(C.equals(D).bool());
});
it('should be (hermitian) equivalent to conjugation for complex scalars', () => {
    const C = dbl.make_scalar(5, 3);
    const D = C.hermitian();
    assert.isTrue(C.conjugate().equals(D).bool());
});
});
*/
