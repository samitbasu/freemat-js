// Can you pass something that is array like in the sense that
import tst = require('../test_help');

type NumericArray = Array<number> | Float64Array;

class MyArray {
    readonly length: number;
    real: NumericArray;
    imag?: NumericArray;
    constructor(length: number) {
        this.length = length;
        if (length < 100)
            this.real = Array<number>(length);
        else
            this.real = new Float64Array(length);
    }
};

function addr(a: MyArray, b: MyArray): MyArray {
    if ((a.length === 1) && (b.length === 1)) {
        let c = new MyArray(1);
        c.real[0] = a.real[0] + b.real[0];
    }
    return new MyArray(1);
}

function tester(): void {
    const a = new MyArray(1);
    const b = new MyArray(512 * 512 * 10);
    let c = new MyArray(512 * 512 * 10);
    for (let ndx = 0; ndx < b.length; ndx++) {
        const aval = new MyArray(1);
        const bval = new MyArray(1);
        aval.real[0] = a.real[0];
        bval.real[0] = b.real[ndx];
        const cval = addr(aval, bval);
        c.real[ndx] = cval.real[0];
    }
}

tst.rep_time(tester, 10);
