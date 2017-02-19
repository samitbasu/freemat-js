export type NumericArray = Array<number> | Float64Array | Float32Array;

export enum ArrayType {
    Double = 1,
    Logical = 2,
    Single = 3
}

export function AllocateNumericArray(length: number, typecode?: ArrayType): NumericArray {
    // TODO - check corner cases where we have a single-precision number that is actually
    // represented as a double...
    if (length === 1)
        return [0];
    if (length === 0)
        return [];
    if (length < 100) {
        let foo = new Array<number>(length);
        for (let t = 0; t < length; t++) foo[t] = 0;
        return foo;
    }
    if (!typecode || (typecode === ArrayType.Double) || (typecode === ArrayType.Logical))
        return new Float64Array(length);
    return new Float32Array(length);
}

export function Elements(dims: number[]): number {
    return dims.reduce((x: number, y: number): number => x * y, 1);
}

function print_real(A: FMArray): string {
    let line = '';
    for (let i = 0; i < A.dims[0]; i++) {
        for (let j = 0; j < A.dims[1]; j++) {
            line += A.real[i + j * A.dims[0]] + " ";
        }
        line += '\n';
    }
    return line;
}

function print_complex(A: FMArray): string {
    let line = '';
    for (let i = 0; i < A.dims[0]; i++) {
        for (let j = 0; j < A.dims[1]; j++) {
            line += A.real[i + j * A.dims[0]] + "+" + A.imag[i + j * A.dims[0]] + "i  ";
        }
        line += '\n';
    }
    return line;
}

export class FMArray {
    readonly length: number;
    readonly capacity: number;
    readonly mytype: ArrayType;
    readonly dims: number[];
    real: NumericArray;
    imag?: NumericArray;
    constructor(dims: number | number[], real?: NumericArray, imag?: NumericArray, typecode?: ArrayType) {
        if (typeof (dims) === 'number') {
            this.length = dims;
            this.dims = [1, dims];
        } else {
            this.length = Elements(dims);
            this.dims = dims;
        }
        this.capacity = this.length;
        if (real)
            this.real = real;
        else
            this.real = AllocateNumericArray(this.length, typecode);
        if (imag)
            this.imag = imag;
        if (typecode)
            this.mytype = typecode;
        else
            this.mytype = ArrayType.Double;
    }
    toString(): string {
        if (this.imag)
            return print_complex(this);
        return print_real(this);
    }
    inspect(depth: number, options: any): string {
        depth; options;
        return this.toString();
    }
};

export function MakeComplex(x: FMArray): FMArray {
    if (x.imag) return x;
    x.imag = AllocateNumericArray(x.length);
    return x;
}

export function FnMakeScalarReal(t: number): FMArray {
    let f = new FMArray(1);
    f.real[0] = t;
    return f;
}

export function FnMakeScalarComplex(t: [number, number]): FMArray {
    let f = new FMArray(1);
    f.real[0] = t[0];
    f.imag = [t[1]];
    return f;
}

function DimString(dims: number[]): string {
    return '[' + dims.toString() + ']';
}

function SameDims(a: number[], b: number[]): boolean {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if ((a[i] || 1) !== (b[i] || 1)) return false;
    }
    return true;
}

export function ComputeBinaryOpOutputDim(a: FMArray, b: FMArray): number[] {
    if ((a.length === 1) && (b.length === 1)) return [1, 1];
    if (a.length === 1) return b.dims;
    if (b.length === 1) return a.dims;
    if ((a.length !== b.length) || !SameDims(a.dims, b.dims))
        throw new TypeError("Cannot apply an operator to variables of size " + DimString(a.dims) + " and " + DimString(b.dims));
    return a.dims;
}

export function Copy(from: FMArray, to: FMArray): void {
    for (let ndx = 0; ndx < from.length; ndx++)
        to.real[ndx] = from.real[ndx];
    if (from.imag) {
        for (let ndx = 0; ndx < from.length; ndx++)
            to.imag[ndx] = from.imag[ndx];
    }
}

export function ToType(a: FMArray, totype: ArrayType): FMArray {
    if (a.mytype === totype)
        return a;
    let p: FMArray = new FMArray(a.dims, undefined, undefined, totype);
    if (a.imag) p = MakeComplex(p);
    Copy(a, p);
    return p;
}
