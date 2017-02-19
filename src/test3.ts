import { Operator } from './operators';
import { Adder } from './operators';
import { FMArray, ArrayType, NumericArray } from './arrays';
import { BinOp } from './binop';
import { DGEMM } from './mat.node';
import { plus, times, mtimes, transpose } from './math';


const maker = (n: number[], realv: NumericArray): FMArray => new FMArray(n, realv);

const A = new FMArray([8, 8]);
const B = new FMArray([8, 3]);
for (let i = 0; i < 8; i++) {
    A.real[i * 8 + i] = 1;
}
for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 3; j++) {
        B.real[j * 8 + i] = i + j;
    }
}

const D = DGEMM(A, B, maker);
console.log(A);
console.log(B);
console.log(D);

console.log(transpose(B));

function mattest(): void {
    const a = new FMArray([512, 512]);
    const b = new FMArray([512, 512]);
    const c = mtimes(a, b);
    c;
}

function mattest3(): void {
    const a = new FMArray([512, 512], undefined, undefined, ArrayType.Single);
    const b = new FMArray([512, 512], undefined, undefined, ArrayType.Single);
    const c = mtimes(a, b);
    c;
}

function mattest2(): void {
    const a = new FMArray([512, 512]);
    const b = new FMArray([512, 512]);
    const c = times(a, b);
    c;
}

function tester(): void {
    const a = new FMArray(1);
    const b = new FMArray(512 * 512 * 10);
    const c = plus(a, b);
    c;
}

function addr2(a: FMArray, b: FMArray, op: Operator): FMArray {
    if ((a.length === 1) && (b.length === 1)) {
        let c = new FMArray(1);
        c.real[0] = op.op_real(a.real[0], b.real[0]);
        return c;
    }
    if (a.length === b.length) {
        let c = new FMArray(a.length);
        for (let ndx = 0; ndx < a.length; ndx++)
            c.real[ndx] = op.op_real(a.real[ndx], b.real[ndx]);
        return c;
    }
    return new FMArray(1);
}


function tester3(): void {
    const adder = new Adder;
    const a = new FMArray(512 * 512 * 10);
    const b = new FMArray(512 * 512 * 10);
    const c = addr2(a, b, adder);
    c;
}

function tester4(): void {
    const a = new FMArray(512 * 512 * 10);
    const b = new FMArray(512 * 512 * 10);
    const c = new FMArray(512 * 512 * 10);
    for (let ndx = 0; ndx < 512 * 512 * 10; ndx++)
        c.real[ndx] = a.real[ndx] + b.real[ndx];
}

function tester5(): void {
    const a = new FMArray(512 * 512 * 10);
    const b = new FMArray(512 * 512 * 10);
    const c = BinOp(a, b, new Adder);
    c;
}

function tic() {
    let t = process.hrtime();
    return t[0] + t[1] / 1.0e9;
}

export function rep_time(func: () => void, reps: number): void {
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

rep_time(mattest, 10);

rep_time(mattest2, 10);

rep_time(mattest3, 10);

rep_time(tester5, 10);

rep_time(tester4, 10);

rep_time(tester3, 10);

rep_time(tester, 10);
//
//rep_time(tester2, 10);
//
