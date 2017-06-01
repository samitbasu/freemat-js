import { Set, FMValue, FMArray, FnMakeScalarReal } from "../arrays";
import { assert } from "chai";
import { time_it, test_mat } from "./test_utils";
import { suite, test } from "mocha-typescript";
import { plus, mtimes } from "../math";

let A: FMValue = new FMArray([512, 512, 10]);
const mks = FnMakeScalarReal;

@suite
export class BasicTimingTests {
    @test 'should fill a 10x512x512 array in under 1 second'() {
        assert.isBelow(time_it(() => {
            for (let z = 1; z <= 10; z++) {
                for (let i = 1; i <= 512; i++) {
                    for (let j = 1; j <= 512; j++) {
                        A = Set(A, [j,i,z], i-j);
                    }
                }
            }
        }), 1.0);
    }
    @test 'should increment a large array in under 30 milliseconds'() {
        assert.isBelow(time_it(() => {
            A = plus(A, 1);
        }), 0.030);
    }
    @test 'should multiply a pair of 1000x1000 matrices in under 100 milliseconds'() {
        let C = test_mat(1000, 1000);
        let D = test_mat(1000, 1000);
        assert.isBelow(time_it(() => {
            mtimes(C, D);
        }), 0.100);
    }
}
