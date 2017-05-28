import { suite, test } from "mocha-typescript";
import { assert } from "chai";
import { ColonGenerator } from "../colon";

@suite
export class ColonGeneratorTests {
    @test "should correctly handle a positive integer set with increasing values"() {
        const p = new ColonGenerator(1, 1, 1000);
        assert.equal(p.length, 1000);
        let ndx = 1;
        while (!p.done()) {
            assert.equal(p.next(), ndx);
            ndx = ndx + 1;
        }
    }
    @test "should correctly handle a positive integer set with decreasing values"() {
        const p = new ColonGenerator(1000, -1, 1);
        assert.equal(p.length, 1000);
        let ndx = 1;
        while (!p.done()) {
            assert.equal(p.next(), 1001 - ndx);
            ndx = ndx + 1;
        }
    }
    @test "should correctly handle a negative integer set with increasing values"() {
        const p = new ColonGenerator(-1000, 1, -1);
        assert.equal(p.length, 1000);
        let ndx = 1;
        while (!p.done()) {
            assert.equal(p.next(), -1001 + ndx);
            ndx = ndx + 1;
        }
    }
    @test "should correctly handle a negative integer set with decreasing values"() {
        const p = new ColonGenerator(-1, -1, -1000);
        assert.equal(p.length, 1000);
        let ndx = 1;
        while (!p.done()) {
            assert.equal(p.next(), -ndx);
            ndx = ndx + 1;
        }
    }
    @test "should correctly handle non-exact fraction representations with increasing values"() {
        const p = new ColonGenerator(0, 0.1, 1);
        assert.equal(p.length, 11);
        let ndx = 1;
        while (!p.done()) {
            assert.closeTo(p.next(), (ndx * 0.1 - 0.1), 1e-12)
            ndx = ndx + 1;
        }
    }
    @test "should correctly handle non-exact fraction representations with decreasing values"() {
        const p = new ColonGenerator(1, -0.1, 0);
        assert.equal(p.length, 11);
        let ndx = 1;
        while (!p.done()) {
            assert.closeTo(p.next(), 1.0 - (ndx * 0.1 - 0.1), 1e-12)
            ndx = ndx + 1;
        }
    }
    @test "should avoid underflow with small values"() {
        const p = new ColonGenerator(-1e-15, 1e-16, 1e-15);
        assert.equal(p.length, 21);
        let ndx = 0;
        while (!p.done()) {
            const pn = p.next() * 1e15;
            assert.closeTo(pn, -1 + ndx * 0.1, 1e-15);
            ndx = ndx + 1;
        }
    }
    @test "should handle non-binary representable step sizes correctly"() {
        const p = new ColonGenerator(-0.12, 0.03, 0.12);
        assert.equal(p.length, 9);
        let ndx = 0;
        while (!p.done()) {
            assert.closeTo(p.next(), -0.12 + ndx * 0.03, 1e-15);
            ndx = ndx + 1;
        }
    }
}
