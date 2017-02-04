// Can you pass something that is array like in the sense that

type NumericArray = Array<number> | Float64Array;

export class MyArray {
    readonly length: number;
    real: NumericArray;
    imag?: NumericArray;
    constructor(length: number) {
        this.length = length;
        if (length === 1)
            this.real = [0];
        else if (length < 100) {
            this.real = new Array<number>(length);
            for (let t = 0; t < length; t++) this.real[t] = 0;
        } else
            this.real = new Float64Array(length);
    }
};


function addr(a: MyArray, b: MyArray): MyArray {
    if ((a.length === 1) && (b.length === 1)) {
        let c = new MyArray(1);
        c.real[0] = a.real[0] + b.real[0];
        return c;
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

interface Operator {
    op_real(a: number, b: number): number;
};


class Adder implements Operator {
    op_real(a: number, b: number): number {
        return (a + b);
    }
};

function addr2(a: MyArray, b: MyArray, op: Operator): MyArray {
    if ((a.length === 1) && (b.length === 1)) {
        let c = new MyArray(1);
        c.real[0] = op.op_real(a.real[0], b.real[0]);
        return c;
    }
    if (a.length === b.length) {
        let c = new MyArray(a.length);
        for (let ndx = 0; ndx < a.length; ndx++)
            c.real[ndx] = op.op_real(a.real[ndx], b.real[ndx]);
        return c;
    }
    return new MyArray(1);
}

function tester2(): void {
    const a = new MyArray(1);
    const b = new MyArray(512 * 512 * 10);
    let c = new MyArray(512 * 512 * 10);
    const adder = new Adder;
    for (let ndx = 0; ndx < b.length; ndx++) {
        const aval = new MyArray(1);
        const bval = new MyArray(1);
        aval.real[0] = a.real[0];
        bval.real[0] = b.real[ndx];
        const cval = addr2(aval, bval, adder);
        c.real[ndx] = cval.real[0];
    }
}

function tester3(): void {
    const adder = new Adder;
    const a = new MyArray(512 * 512 * 10);
    const b = new MyArray(512 * 512 * 10);
    const c = addr2(a, b, adder);
}

function tester4(): void {
    const adder = new Adder;
    const a = new MyArray(512 * 512 * 10);
    const b = new MyArray(512 * 512 * 10);
    const c = new MyArray(512 * 512 * 10);
    for (let ndx = 0; ndx < 512 * 512 * 10; ndx++)
        c.real[ndx] = a.real[ndx] + b.real[ndx];
}

function tic() {
    let t = process.hrtime();
    return t[0] + t[1] / 1.0e9;
}

export function rep_time(func, reps) {
    let sum = 0;
    for (let ndx = 0; ndx < reps; ndx++) {
        let t1 = tic() * 1000;
        func();
        let t2 = tic() * 1000;
        console.log("   elapsed time: " + (t2 - t1));
        sum = sum + (t2 - t1);
    }
    console.log("average: " + sum / reps);
}


rep_time(tester4, 10);

rep_time(tester3, 10);

rep_time(tester, 10);

rep_time(tester2, 10);
