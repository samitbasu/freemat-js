// Can you pass something that is array like in the sense that


interface NumericArray {
    readonly length: number;
    [index: number]: number;
}

interface ComplexArray {
    readonly length: number;
    real: NumericArray;
    imag?: NumericArray;
}

function sum(x: NumericArray): number {
    let accum = 0;
    for (let i = 0; i < x.length; i++) {
        accum = accum + x[i];
    }
    return accum;
}

function p() {
    let q = new Float64Array(100);
    let z = sum(q);
    let h = sum([1, 2, 3, 4, 5]);
    let h1 = sum(new Int8Array(100));
}

