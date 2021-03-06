import { cnumber } from './complex';

import {is_complex, is_scalar} from './inspect';

export type NumericArray = Array<number> | Float64Array | Float32Array;

export enum ArrayType {
    Double = 1,
    Logical = 2,
    Single = 3
}

function NewSize(x: number[], lim: NumericArray): number[] {
    let ret: number[] = [];
    for (let i = 0; i < Math.max(x.length, lim.length); i++) {
        ret[i] = Math.max((x[i] || 1), (lim[i] || 1));
    }
    return ret;
}

function IncrementRipple(x: NumericArray, limits: NumericArray, dim: number): void {
    x[dim]++;
    for (let i = dim; i < x.length; i++) {
        if (x[i] >= limits[i]) {
            x[i] = 0;
            x[i + 1]++;
        }
    }
}


function Dot(x: NumericArray, y: NumericArray): number {
    let accum = 0;
    for (let i = 0; i < x.length; i++)
        accum += (x[i] * y[i]);
    return accum;
}

function ExtendDims(dims: NumericArray, len: number): number[] {
    let ret: number[] = [];
    for (let i = 0; i < dims.length; i++)
        ret[i] = dims[i];
    for (let i = dims.length; i < len; i++)
        ret[i] = 1;
    return ret;
}

function Count(x: number[]): number {
    return x.reduce((x: number, y: number) => x * y, 1);
}

function Stride(dims: number[]): number[] {
    let ret = [1];
    for (let i = 1; i < dims.length; i++)
        ret[i] = ret[i - 1] * dims[i - 1];
    return ret;
}

function VectorResizeDim(x: number[], newlen: number): number[] {
    const cdim = Count(x);
    if (cdim === 1) {
        return [1, newlen];
    }
    let ret: number[] = [];
    for (let i = 0; i < x.length; i++)
        if (x[i] === cdim) {
            ret[i] = newlen;
        } else {
            ret[i] = 1;
        }
    return ret;
}

function IsVector(x: number[]): boolean {
    const cdim = Count(x);
    return (x.indexOf(cdim) !== -1);
}

function AllZeros(x: NumericArray): boolean {
    for (let i = 0; i < x.length; i++) {
        if (x[i] !== 0) return false;
    }
    return true;
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
    if (!A.imag) return print_real(A);
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
        if (real) {
            this.real = real;
            this.capacity = real.length;
        } else {
            this.real = AllocateNumericArray(this.length, typecode);
            this.capacity = this.length;
        }
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


export type basic = number | boolean;

export function length(x: FMValue): number {
  if (isBasic(x)) return 1;
  return x.length;
}

export function isBasic(x: FMValue): x is basic {
    return (!isFMArray(x));
}

export function basicValue(x: basic): number {
    if (typeof (x) === 'number') return x;
    return (x ? 1 : 0);
}

export function realScalar(x : FMValue): number {
    if (isBasic(x)) return basicValue(x);
    return x.real[0];
}

export function imagScalar(x: FMValue): number {
    if (isBasic(x)) return 0;
    if (!x.imag) return 0;
    return x.imag[0];
}

export type FMValue = FMArray | basic;


export function MakeComplex(x: FMArray): FMArray {
    if (x.imag) return x;
    x.imag = AllocateNumericArray(x.length);
    return x;
}

/*
export function FnMakeScalarReal(t: number): FMArray {
    let f = new FMArray(1);
    f.real[0] = t;
    return f;
}*/

export function FnMakeScalarReal(t: number): FMValue {
    return t;
}

export function FnMakeScalarComplex(real: number, imag: number): FMArray {
    let f = new FMArray(1);
    f.real[0] = real;
    f.imag = [imag];
    return f;
}

export function FnMakeScalarLogical(t: boolean): FMValue {
    return t;
}

export function FnMakeArrayFromCNumber(t: cnumber) : FMArray {
  return FnMakeScalarComplex(t.real,t.imag)
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
        throw new TypeError("Cannot apply an operator to variables of size " + DimString(a.dims) + " and " + DimString(b.dims) + " - mismatch in dimensions");
    return a.dims;
}

export function Copy(from: FMArray, to: FMArray): void {
    for (let ndx = 0; ndx < from.length; ndx++)
        to.real[ndx] = from.real[ndx];
    if (from.imag && to.imag) {
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

function CopyLoop(orig_dims: number[], array: NumericArray, typecode: ArrayType, new_dims: number[]): NumericArray {
    const capacity = Count(new_dims) * 2;
    let op = AllocateNumericArray(capacity, typecode);
    // Normalize the dimensions so that they match
    let dim_len = Math.max(new_dims.length, orig_dims.length);
    orig_dims = ExtendDims(orig_dims, dim_len);
    new_dims = ExtendDims(new_dims, dim_len);
    const a_rows = orig_dims[0];
    // Calculate the number of iterations
    const iterations = Count(orig_dims) / a_rows;
    // Calculate the stride vector
    const stride_vec = Stride(new_dims);
    // Create an index vector
    let ndx = Array<number>(dim_len).fill(0);
    let offset = 0;
    for (let iter = 0; iter < iterations; iter++) {
        let start = Dot(ndx, stride_vec);
        for (let row = 0; row < a_rows; row++) {
            op[row + start] = array[offset + row];
        }
        offset = offset + a_rows;
        IncrementRipple(ndx, orig_dims, 1);
    }
    return op;
}

function RealDemote(to: FMArray): FMArray {
    if (!to.imag) return to;
    if (AllZeros(to.imag)) to.imag = undefined;
    return to;
}

function ComputeInner2(mydims: number[], coords: NumericArray): number {
    if ((coords[0] < 1) || (coords[0] > mydims[0]) ||
        (coords[1] < 1) || (coords[1] > mydims[1])) return -1;
    return (coords[0] - 1 +
        (coords[1] - 1) * mydims[0]);
}

function ComputeInner3(mydims: number[], coords: NumericArray): number {
    if ((coords[0] < 1) || (coords[0] > mydims[0]) ||
        (coords[1] < 1) || (coords[1] > mydims[1]) ||
        (coords[2] < 1) || (coords[2] > mydims[2])) return -1;
    return (coords[0] - 1 +
        (coords[1] - 1) * mydims[0] +
        (coords[2] - 1) * mydims[0] * mydims[1]);
}

function ComputeIndexInner(mydims: number[], coords: NumericArray): number {
    if (coords.length === 3)
        return ComputeInner3(mydims, coords);
    if (coords.length === 2)
        return ComputeInner2(mydims, coords);
    let ndx = 0;
    let slice_size = 1;
    for (let i = 0; i < coords.length; i++) {
        if ((coords[i] < 1) || (coords[i] > mydims[i])) return -1;
        ndx = ndx + (coords[i] - 1) * slice_size;
        slice_size *= mydims[i];
    }
    return ndx;
}

function ComputeIndex(mydims: number[], coords: NumericArray): number {
    if (mydims.length === coords.length) {
        return ComputeIndexInner(mydims, coords);
    }
    if (coords.length > mydims.length)
        return ComputeIndex(ExtendDims(mydims, coords.length), coords);
    else
        return ComputeIndex(mydims, ExtendDims(coords, mydims.length));
}

export function Resize(x: FMArray, new_dims: number[]): FMArray {
    // Resize the array to the new dimensions.  There are several considerations:
    //  1.  If the resize is a vector one and this is a vector and the capacity
    //      is adequate, we can simply adjust the dimension
    if (IsVector(x.dims) && IsVector(new_dims) && (x.capacity >= Count(new_dims))) {
        return new FMArray(new_dims, x.real, x.imag, x.mytype);
    }
    //  2.  If the current array is empty, a resize is the same as an allocate
    if (x.length === 0) {
        return new FMArray(new_dims, undefined, undefined, x.mytype);
    }
    //  3.  If the capacity is large enough, we can move the data
    /*
      if (this.capacity >= count(new_dims)) {
      return moveLoop(this,new_dims);
      }*/
    //  4.  Otherwise, we have to copy
    const real_part = CopyLoop(x.dims, x.real, x.mytype, new_dims);
    if (!x.imag) {
        return new FMArray(new_dims, real_part, undefined, x.mytype);
    }
    const imag_part = CopyLoop(x.dims, x.imag, x.mytype, new_dims);
    return new FMArray(new_dims, real_part, imag_part, x.mytype);
}

function Vectorize(x: FMArray): FMArray {
    return new FMArray([x.length, 1], x.real, x.imag, x.mytype);
}


// This covers the case A(i,j,k) = m,
// where m is a scalar, and i, j, k are scalars too
function SetNDimScalar(to: FMArray, where: FMValue[], what: FMValue): FMArray {
    let scalars: number[] = [];
    for (let i = 0; i < where.length; i++) {
        scalars[i] = realScalar(where[i]);
    }
    let ndx = ComputeIndex(to.dims, scalars);
    if (ndx >= 0) {
        to.real[ndx] = realScalar(what);
        if (to.imag) {
            to.imag[ndx] = imagScalar(what);
            return RealDemote(to);
        }
        return to;
    }
    return SetNDimScalar(Resize(to, NewSize(to.dims, scalars)), where, what);

}

function GetNDimScalar(frm: FMArray, where: FMValue[]): FMValue {
    let scalars: number[] = [];
    for (let i=0;i < where.length;i++) {
        scalars[i] = realScalar(where[i]);
    }
    let ndx = ComputeIndex(frm.dims, scalars);
    if (frm.imag) {
        return FnMakeScalarComplex(frm.real[ndx], frm.imag[ndx]);
    }
    return FnMakeScalarReal(frm.real[ndx]);
}

function SetScalar(to: FMArray, where: FMValue, what: FMValue): FMArray {
    const ndx = realScalar(where);
    if (ndx > to.length) {
        if (IsVector(to.dims)) {
            return SetScalar(Resize(to, VectorResizeDim(to.dims, ndx)), where, what);
        } else {
            return SetScalar(Resize(Vectorize(to), [ndx, 1]), where, what);
        }
    }
    if (!is_complex(what)) {
        to.real[ndx - 1] = realScalar( what);
        if (to.imag) {
            to.imag[ndx - 1] = 0;
            return RealDemote(to);
        }
        return to;
    }
    if (to.imag) {
        to.real[ndx - 1] = realScalar(what);
        to.imag[ndx - 1] = imagScalar(what);
    }
    return to;
}

export function Set(to: FMValue, where: FMValue[], what: FMValue): FMArray {
    // Target of a Set should always be an array
    to = mkArray(to);
    // If we need complex promotion, do it first
    if (is_complex(what) && !is_complex(to)) {
        return Set(MakeComplex(to), where, what);
    }
    // Handle scalar case first
    if ((where.length === 1) && (is_scalar(what))) {
        return SetScalar(to, where[0], what);
    }
    if (is_scalar(what)) {
        return SetNDimScalar(to, where, what);
    }
    throw new TypeError("Cannot apply Set function in this way");
}


function GetScalar(frm: FMArray, where: FMValue): FMValue {
    let n = realScalar(where) - 1;
    if (frm.imag)
        return FnMakeScalarComplex(frm.real[n], frm.imag[n]);
    else
        return FnMakeScalarReal(frm.real[n]);
}

export function Get(frm: FMValue, where: FMValue[]): FMValue {
    frm = mkArray(frm);
    if (where.length === 1 && is_scalar(where[0]) )
        return GetScalar(frm,where[0]);
    return GetNDimScalar(frm, where);
}

export function isFMArray(A: FMValue): A is FMArray {
    return !((typeof (A) === 'number') ||
        (typeof (A) === 'boolean'));
}

export function mkArray(A: FMValue): FMArray {
    if (isFMArray(A)) return A;
    if (typeof (A) === 'number')
        return new FMArray(1, [A]);
    return new FMArray(1, [A ? 1 : 0], undefined, ArrayType.Logical);
}
