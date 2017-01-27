'use strict';
const mat = require('./build/Release/mat');

// For speed purposes (and yes, I benchmarked first)
// it makes sense to have 6 permutations of each operator.
//   scalar real
//   scalar complex
//   vec + scalar real
//   vec + scalar complex
//   scalar + vec real
//   scalar + vec complex
//  Some of the combinations are left out in this process,
//  but these are the most important ones.  While this is not
//  super_DRY, consider the output of bench4 on my chromebook:
// func per point
//    elapsed time: 242.8813049979508
//    elapsed time: 220.03684999793768
//     ... snip ...
//    elapsed time: 201.5645989999175
//    elapsed time: 205.98275800049305
// average: 221.89251170009373
// loop custom
//    elapsed time: 39.733474001288414
//    elapsed time: 52.88780099526048
//     ... snip ...
//    elapsed time: 43.13788800314069
//    elapsed time: 48.27436499670148
// average: 46.927580600231884
// This represents a 5x penalty for putting a function around each
// point. You can get it down to a 3x penalty with some
// optimizations.  But it already represents a 2x penalty over the c++
// version (FreeMat).  

import op_and = require('./ops/and.js');
import op_or = require('./ops/or.js');
import op_xor = require('./ops/xor.js');
import op_lt = require('./ops/lt.js');
import op_gt = require('./ops/gt.js');
import op_le = require('./ops/le.js');
import op_ge = require('./ops/ge.js');
import op_eq = require('./ops/eq.js');
import op_ne = require('./ops/ne.js');
import op_add = require('./ops/add.js');
import op_subtract = require('./ops/subtract.js');
import op_times = require('./ops/multiply.js');
import op_rdivide = require('./ops/rdivide.js');
import op_ldivide = require('./ops/ldivide.js');

type Scalar = DoubleScalar | ComplexScalar | LogicalScalar | number;

type FreeMatArray = number[] | Float64Array;

function isArrayLike(x: Scalar | DoubleArray | LogicalArray): x is (DoubleArray | LogicalArray) {
    return (x instanceof DoubleArray) || (x instanceof LogicalArray);
}

function is_complex(x: DoubleArray | LogicalArray | Scalar): boolean {
    if (typeof (x) === 'number') return false;
    return x.is_complex;
}

export function is_scalar(x: any): x is (number | DoubleScalar | ComplexScalar | LogicalScalar | DoubleArray | LogicalArray) {
    return ((typeof (x) === 'number') ||
        (x instanceof DoubleScalar) ||
        (x instanceof ComplexScalar) ||
        (x instanceof LogicalScalar) ||
        (x.is_scalar));
}

export function real_scalar(x: DoubleArray | LogicalArray | Scalar): number {
    if (typeof (x) === 'number') return x;
    if ((x instanceof DoubleArray) || (x instanceof LogicalArray))
        return x.real[0];
    return x.real;
}

export function imag_scalar(x: DoubleArray | LogicalArray | Scalar): number {
    if (!is_complex(x)) return 0;
    if (typeof (x) === 'number') return 0;
    if ((x instanceof LogicalScalar) || (x instanceof LogicalArray)) return 0;
    if (x.is_array) return x.imag[0];
    return x.imag;
}

function compute_ndx(dims: number[], x: FreeMatArray): number {
    if (dims.length === x.length) {
        let ndx = 0;
        let slice_size = 1;
        for (let i = 0; i < x.length; i++) {
            if (x[i] < 1) throw 'Illegal zero or negative index';
            ndx = ndx + (x[i] - 1) * slice_size;
            slice_size *= dims[i];
        }
        return ndx;
    }
    throw "What?";
}

function is_vector(dims: number[]): boolean {
    const cdim = count(dims);
    return ((cdim === dims[0]) || (cdim === dims[1]));
}

function is_row_vector(dims: number[]): boolean {
    return (is_vector(dims) && (dims[0] === 1));
}

function count(array: number[]): number {
    return array.reduce((x, y) => x * y, 1);
}

function exceeds_limits(x: number[], lim: number[]): boolean {
    for (let i = 0; i < x.length; i++) {
        if (x[i] > (lim[i] || 1)) return true;
    }
    return false;
}

function new_size(x: number[], lim: number[]): number[] {
    let ret: number[];
    for (let i = 0; i < Math.max(x.length, lim.length); i++) {
        ret[i] = Math.max((x[i] || 1), (lim[i] || 1));
    }
    return ret;
}

function same_size(a: number[], b: number[]): boolean {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if ((a[i] || 1) !== (b[i] || 1)) return false;
    }
    return true;
}

//May need work...
function allocate(len: number): FreeMatArray {
    if (len < 100) {
        return Array(len).fill(0);
    }
    return new Float64Array(len);
}

function extend_dims(dims: number[], len: number): void {
    for (let i = dims.length; i < len; i++) dims[i] = 1;
}

function dot(x: number[], y: number[]): number {
    let accum = 0;
    for (let i = 0; i < x.length; i++)
        accum += (x[i] * y[i]);
    return accum;
}

function stride(dims: number[]): number[] {
    let ret = [1];
    for (let i = 1; i < dims.length; i++)
        ret[i] = ret[i - 1] * dims[i - 1];
    return ret;
}

function increment_ripple(x: number[], limits: number[], dim: number): void {
    x[dim]++;
    for (let i = dim; i < x.length; i++) {
        if (x[i] >= limits[i]) {
            x[i] = 0;
            x[i + 1]++;
        }
    }
}

interface CopyResults {
    dims: number[];
    capacity: number;
    array: FreeMatArray;
}

function copyLoop(orig_dims: number[], array: FreeMatArray, new_dims: number[]): CopyResults {
    const capacity = count(new_dims) * 2;
    let op = allocate(capacity);
    // Normalize the dimensions so that they match
    let dim_len = Math.max(new_dims.length, orig_dims.length);
    extend_dims(orig_dims, dim_len);
    extend_dims(new_dims, dim_len);
    const a_rows = orig_dims[0];
    // Calculate the number of iterations
    const iterations = count(orig_dims) / a_rows;
    // Calculate the stride vector
    const stride_vec = stride(new_dims);
    // Create an index vector
    let ndx = Array(dim_len).fill(0);
    let offset = 0;
    for (let iter = 0; iter < iterations; iter++) {
        let start = dot(ndx, stride_vec);
        for (let row = 0; row < a_rows; row++) {
            op[row + start] = array[offset + row];
        }
        offset = offset + a_rows;
        increment_ripple(ndx, orig_dims, 1);
    }
    return { dims: new_dims, capacity: capacity, array: op };
}

type Indexable = Scalar | DoubleArray | LogicalArray;

class LogicalArray {
    is_scalar: boolean;
    readonly is_array: boolean = true;
    readonly is_complex: boolean = true;
    dims: number[];
    length: number;
    capacity: number;
    real: FreeMatArray;
    constructor(dims: number[], real?: FreeMatArray) {
        this.dims = dims;
        this.length = count(dims);
        this.capacity = this.length;
        if (real) {
            this.real = real;
            if (this.real.length !== this.length)
                throw "Real part length mismatch";
        } else {
            this.real = allocate(this.length);
        }
        this.is_scalar = (this.length === 1);
    }
    get(where: Indexable | Indexable[]) {
        let ndx = 0;
        if (is_scalar(where) || (typeof (where) === 'number')) {
            ndx = real_scalar(where) - 1;
        } else if (isArrayLike(where) && where.every(is_scalar)) {
            ndx = compute_ndx(this.dims, where);
        } else {
            throw "unhandled case for get in LogicalArray " + where;
        }
        return make_logical_scalar(this.real[ndx]);
    }
}


// Class that uses a typed array as backing for the data
// Useful for medium to large arrays.
class DoubleArray {
    is_scalar: boolean;
    is_complex: boolean;
    readonly is_array: boolean = true;
    dims: number[];
    length: number;
    capacity: number;
    real: FreeMatArray;
    imag: FreeMatArray;
    constructor(dims: number[], real = null, imag = []) {
        this.dims = dims;
        this.length = count(dims);
        this.capacity = this.length;
        if (real) {
            this.real = real;
            if (this.real.length !== this.length)
                throw "Real part length mismatch";
        }
        else
            this.real = allocate(this.length);
        this.imag = imag;
        this.is_complex = (imag.length !== 0);
        this.is_scalar = (this.length === 1);
    }
    to_scalar() {
        if (this.is_scalar) {
            if (this.is_complex)
                return make_scalar(this.real[0], this.imag[0]);
            return make_scalar(this.real[0]);
        }
        throw "Error!";
    }
    resize(new_dims: number[]): this {
        // Resize the array to the new dimensions.  There are several considerations:
        //  1.  If the resize is a vector one and this is a vector and the capacity
        //      is adequate, we can simply adjust the dimension
        if (is_vector(this.dims) && is_vector(new_dims) &&
            (this.capacity >= count(new_dims))) {
            this.dims = new_dims;
            return this;
        }
        //  2.  If the current array is empty, a resize is the same as an allocate
        if (this.length === 0) {
            return new DoubleArray(new_dims);
        }
        //  3.  If the capacity is large enough, we can move the data
        /*
        if (this.capacity >= count(new_dims)) {
            return moveLoop(this,new_dims);
        }*/
        //  4.  Otherwise, we have to copy
        if (!this.is_complex) {
            const real_part = copyLoop(this.dims, this.real, new_dims);
            this.dims = real_part.dims;
            this.capacity = real_part.capacity;
            this.real = real_part.array;
            this.length = count(this.dims);
            this.is_scalar = (this.length === 1);
        } else {
            const real_part = copyLoop(this.dims, this.real, new_dims);
            const imag_part = copyLoop(this.dims, this.imag, new_dims);
            this.dims = real_part.dims;
            this.capacity = real_part.capacity;
            this.real = real_part.array;
            this.imag = imag_part.array;
            this.length = count(this.dims);
            this.is_scalar = (this.length === 1);
        }
        return this;
    }
    slice(offset, dims) {
        let slice_len = count(dims);
        if (this.real instanceof Float64Array)
            return new DoubleArray(dims, new Float64Array(this.real.buffer,
                offset * 8, slice_len));
        throw "What?";
    }
    complexify() {
        if (this.is_complex) return this;
        this.imag = allocate(this.length);
        this.is_complex = true;
        return this;
    }
    decomplexify() {
        if (!this.is_complex) return this;
        if (!this.imag.every(x => (x === 0))) return this;
        this.imag = [];
        this.is_complex = false;
        return this;
    }
    fast_get(where) {
        return this.real[where || 0];
    }
    get(where) {
        let ndx = 0;
        if (where.is_scalar) {
            ndx = where - 1;
        } else if (where.every(is_scalar)) {
            ndx = compute_ndx(this.dims, where);
        } else {
            throw "unhandled case for get in DoubleArray " + where;
        }
        if (!this.is_complex)
            return make_scalar(this.real[ndx]);
        else
            return make_scalar(this.real[ndx], this.imag[ndx]);
    }
    fast_set(a, b) {
        this.real[a] = b;
    }
    set(where, what) {
        if (!this.is_complex && what.is_complex) {
            this.complexify();
        }
        if ((where.is_scalar) && (where > this.length)) {
            if (this.is_scalar || is_row_vector(this.dims)) {
                let that = this.resize([1, where]);
                return that.set(where, what);
            } else {
                this.dims = [this.length, 1];
                let that = this.resize([where, 1]);
                return that.set(where, what);
            }
        }
        if ((where.is_scalar || 0) && (what.is_scalar || 0) && !what.is_complex) {
            this.real[where - 1] = real_scalar(what);
            return this;
        }
        if ((where.is_scalar || 0) && (what.is_scalar || 0) && (what.is_complex || 0)) {
            this.real[where - 1] = what.real;
            this.imag[where - 1] = what.imag;
            return this;
        }
        const scalar_case = where.every(is_scalar);
        if (scalar_case && exceeds_limits(where, this.dims)) {
            let that = this.resize(new_size(where, this.dims));
            return that.set(where, what);
        }
        if (scalar_case && what.is_scalar && !what.is_complex) {
            const ndx = compute_ndx(this.dims, where);
            this.real[ndx] = real_scalar(what);
            return this;
        }
        if (scalar_case && what.is_scalar && what.is_complex) {
            const ndx = compute_ndx(this.dims, where);
            this.real[ndx] = what.real;
            this.imag[ndx] = what.imag;
            return this;
        }
        throw `unhandled case for set in DoubleArray ${where} and ${JSON.stringify(what)}`;
    }
    logop(other, op) {
        if (other.is_scalar && other.is_array) {
            other = other.to_scalar();
        }
        if (this.is_complex) {
            this.decomplexify();
        }
        if (other.is_complex) {
            other.decomplexify();
        }
        if (this.is_complex || other.is_complex)
            throw "Cannot use complex values in logical operations";
        if (this.is_scalar && other.is_scalar) {
            return op.scalar_real(real_scalar(this),
                real_scalar(other),
                make_logical_scalar);
        }
        if (this.is_scalar) {
            let that = this.to_scalar();
            return that.logop(other, op);
        }
        let ret = make_logical_array(this.dims);
        if (other.is_scalar) {
            op.vector_scalar_real(ret, this, other);
            return ret;
        }
        if (!same_size(this.dims, other.dims))
            throw new TypeError("mismatch dimensions to operator")
        op.vector_vector_real(ret, this, other);
        return ret;
    }
    cmpop(other, op) {
        if (other.is_scalar && other.is_array) {
            other = other.to_scalar();
        }
        if (this.is_scalar && other.is_scalar) {
            if (other.is_complex || this.is_complex)
                return op.scalar_complex(real_scalar(this), imag_scalar(this),
                    real_scalar(other), imag_scalar(other),
                    make_logical_scalar);
            return op.scalar_real(real_scalar(this),
                real_scalar(other),
                make_logical_scalar);
        }
        if (this.is_scalar) {
            let that = this.to_scalar();
            return that.cmpop(other, op);
        }
        let ret = make_logical_array(this.dims);
        if (other.is_scalar) {
            if (other.is_complex || this.is_complex) {
                op.vector_scalar_complex(ret, this, other);
                return ret;
            }
            op.vector_scalar_real(ret, this, other);
            return ret;
        }
        if (!same_size(this.dims, other.dims))
            throw new TypeError("mismatch dimensions to operator")
        if (!this.is_complex && !other.is_complex) {
            op.vector_vector_real(ret, this, other);
            return ret;
        }
        op.vector_vector_complex(ret, this, other);
        return ret;
    }
    binop(other, op) {
        if (other.is_scalar && other.is_array) {
            other = other.to_scalar();
        }
        if (this.is_scalar && other.is_scalar) {
            if (other.is_complex || this.is_complex)
                return op.scalar_complex(real_scalar(this), imag_scalar(this),
                    real_scalar(other), imag_scalar(other),
                    make_scalar);
            return op.scalar_real(real_scalar(this),
                real_scalar(other),
                make_scalar);
        }
        if (this.is_scalar) {
            let that = this.to_scalar();
            return that.binop(other, op);
        }
        if (other.is_scalar) {
            if (other.is_complex || this.is_complex) {
                // Case real_vec + complex_scalar
                let ret = make_array(this.dims).complexify();
                op.vector_scalar_complex(ret, this, other);
                return ret;
            }
            // Case real_vec + real_scalar
            let ret = make_array(this.dims);
            op.vector_scalar_real(ret, this, other);
            return ret;
        }
        if (!same_size(this.dims, other.dims))
            throw new TypeError("mismatch dimensions to operator")
        // real, real
        if (!this.is_complex && !other.is_complex) {
            let ret = make_array(this.dims);
            op.vector_vector_real(ret, this, other);
            return ret;
        }
        let ret = make_array(this.dims).complexify();
        op.vector_vector_complex(ret, this, other);
        return ret;
    }
    plus(other) {
        return this.binop(other, op_add);
    }
    minus(other) {
        return this.binop(other, op_subtract);
    }
    times(other) {
        return this.binop(other, op_times);
    }
    rdivide(other) {
        return this.binop(other, op_rdivide);
    }
    ldivide(other) {
        return this.binop(other, op_ldivide);
    }
    lt(other) {
        return this.cmpop(other, op_lt);
    }
    le(other) {
        return this.cmpop(other, op_le);
    }
    gt(other) {
        return this.cmpop(other, op_gt);
    }
    ge(other) {
        return this.cmpop(other, op_ge);
    }
    eq(other) {
        return this.cmpop(other, op_eq);
    }
    ne(other) {
        return this.cmpop(other, op_ne);
    }
    or(other) {
        return this.logop(other, op_or);
    }
    and(other) {
        return this.logop(other, op_and);
    }
    xor(other) {
        return this.logop(other, op_xor);
    }
    mldivide(other) {
        if (this.is_scalar || other.is_scalar)
            return this.ldivide(other);
        if (!this.is_complex && !other.is_complex)
            return mat.DSOLVE(this, other, console.log, make_array);
        return mat.ZSOLVE(this, other, console.log, make_array);
    }
    mrdivide(other) {
        if (this.is_scalar || other.is_scalar)
            return this.rdivide(other);
        if (!this.is_complex && !other.is_complex)
            return mat.DSOLVE(other.transpose(), this.transpose(), console.log, make_array).transpose();
        return mat.ZSOLVE(other.transpose(), this.transpose(), console.log, make_array).transpose();
    }
    mtimes(other) {
        if (this.is_scalar || other.is_scalar)
            return this.times(other);
        if (!this.is_complex && !other.is_complex)
            return mat.DGEMM(this, other, make_array);
        return mat.ZGEMM(this, other, make_array);
    }
    transpose() {
        if (this.is_complex)
            return mat.ZTRANSPOSE(this, make_array);
        return mat.DTRANSPOSE(this, make_array);
    }
    hermitian() {
        if (this.is_complex)
            return mat.ZHERMITIAN(this, make_array);
        return mat.DTRANSPOSE(this, make_array);
    }
}

class ComplexScalar {
    readonly is_array: boolean = false;
    readonly is_scalar: boolean = true;
    readonly is_complex: boolean = true;
    readonly is_logical: boolean = false;
    real: number;
    imag: number;
    constructor(real: number, imag: number) {
        this.real = real;
        this.imag = imag;
    }
    isNaN() {
        return Number.isNaN(this.real) || Number.isNaN(this.imag);
    }
    equals(other) {
        if (other instanceof ComplexScalar) {
            return make_logical_scalar((this.real === other.real) && (this.imag === other.imag));
        }
        if (other instanceof DoubleScalar) {
            return make_logical_scalar((this.real === other.real) && (this.imag === 0));
        }
        return false;
    }
    cmpop(other, op) {
        if (other.is_scalar) {
            return op.scalar_complex(this.real, this.imag,
                real_scalar(other), imag_scalar(other),
                make_logical_scalar);
        }
        let ret = make_logical_array(other.dims);
        op.scalar_vector_complex(ret, this, other);
        return ret;
    }
    binop(other, op) {
        if (other.is_scalar) {
            return op.scalar_complex(this.real, this.imag,
                real_scalar(other), imag_scalar(other),
                make_scalar);
        }
        let ret = make_array(other.dims).complexify();
        op.scalar_vector_complex(ret, this, other);
        return ret;
    }
    plus(other) {
        return this.binop(other, op_add);
    }
    minus(other) {
        return this.binop(other, op_subtract);
    }
    times(other) {
        return this.binop(other, op_times);
    }
    rdivide(other) {
        return this.binop(other, op_rdivide);
    }
    ldivide(other) {
        return this.binop(other, op_ldivide);
    }
    set(where, what) {
        let that = make_array([1, 1], [this.real], [this.imag]);
        return that.set(where, what);
    }
    conjugate() {
        return new ComplexScalar(this.real, -this.imag);
    }
    hermitian() {
        return this.conjugate();
    }
    transpose() {
        return new ComplexScalar(this.real, this.imag);
    }
    lt(other) {
        return this.cmpop(other, op_lt);
    }
    gt(other) {
        return this.cmpop(other, op_gt);
    }
    le(other) {
        return this.cmpop(other, op_le);
    }
    ge(other) {
        return this.cmpop(other, op_ge);
    }
    eq(other) {
        return this.cmpop(other, op_eq);
    }
    ne(other) {
        return this.cmpop(other, op_ne);
    }
};

class LogicalScalar {
    readonly is_array: boolean = false;
    readonly is_scalar: boolean = true;
    readonly is_complex: boolean = false;
    readonly is_logical: boolean = true;
    real: number = 0;
    constructor(real: number | boolean) {
        this.real = real;
    };
    bool() {
        return (this.real !== 0);
    }
    plus(other) {
        if (other.is_scalar && !other.is_complex)
            return new DoubleScalar(this.real + other.real);
    }
    equals(other) {
        if (other.is_scalar)
            return make_logical_scalar(this.real === other.real);
        throw "Not supported";
    }
    isNaN() {
        return false;
    }
};

class DoubleScalar {
    readonly is_array: boolean = false;
    readonly is_scalar: boolean = true;
    readonly is_complex: boolean = false;
    readonly is_logical: boolean = false;
    readonly imag: number = 0;
    real: number = 0;
    constructor(real: number) {
        this.real = real;
    };
    isNaN() {
        return Number.isNaN(this.real);
    }
    conjugate() {
        return new DoubleScalar(this.real);
    }
    cmpop(other, op) {
        if (other.is_scalar && !other.is_complex)
            return op.scalar_real(this.real, real_scalar(other), make_logical_scalar);
        if (other.is_scalar && other.is_complex)
            return op.scalar_complex(this.real, 0,
                real_scalar(other), imag_scalar(other),
                make_logical_scalar);
        let ret = make_logical_array(other.dims);
        if (other.is_complex) {
            op.scalar_vector_complex(ret, this, other);
            return ret;
        }
        op.scalar_vector_real(ret, this, other);
        return ret;
    }
    binop(other, op) {
        if (other.is_scalar && !other.is_complex)
            return op.scalar_real(this.real, real_scalar(other), make_scalar);
        if (other.is_scalar && other.is_complex) {
            return op.scalar_complex(this.real, 0,
                real_scalar(other), imag_scalar(other),
                make_scalar);
        }
        if (other.is_complex) {
            let ret = make_array(other.dims).complexify();
            op.scalar_vector_complex(ret, this, other);
            return ret;
        }
        let ret = make_array(other.dims);
        op.scalar_vector_real(ret, this, other);
        return ret;
    };
    equals(other) {
        if (other.is_scalar && !other.is_complex)
            return make_logical_scalar(this.real === other.real);
        if (other.is_scalar && other.is_complex)
            return make_logical_scalar((this.real === other.real) && (other.imag === 0));
        return make_logical_scalar(false);
    }
    plus(other) {
        return this.binop(other, op_add);
    }
    minus(other) {
        return this.binop(other, op_subtract);
    }
    times(other) {
        return this.binop(other, op_times);
    }
    rdivide(other) {
        return this.binop(other, op_rdivide);
    }
    ldivide(other) {
        return this.binop(other, op_ldivide);
    }
    set(where, what) {
        let that = make_array([1, 1], [this.real]);
        return that.set(where, what);
    }
    hermitian() {
        return make_scalar(this.real);
    }
    transpose() {
        return make_scalar(this.real);
    }
    lt(other) {
        return this.cmpop(other, op_lt);
    }
    le(other) {
        return this.cmpop(other, op_le);
    }
    gt(other) {
        return this.cmpop(other, op_gt);
    }
    ge(other) {
        return this.cmpop(other, op_ge);
    }
    eq(other) {
        return this.cmpop(other, op_eq);
    }
    ne(other) {
        return this.cmpop(other, op_ne);
    }
}

export function make_scalar(real, imag = 0) {
    if (imag === 0)
        return new DoubleScalar(real);
    else
        return new ComplexScalar(real, imag);
}

export function make_logical_scalar(real) {
    return new LogicalScalar(real ? 1 : 0);
}

export function make_array(dims, real = null, imag = []) {
    return new DoubleArray(dims, real, imag);
}

export function make_logical_array(dims, real = null) {
    return new LogicalArray(dims, real);
}

function print_real(A) {
    let line = '';
    for (let i = 0; i < A.dims[0]; i++) {
        for (let j = 0; j < A.dims[1]; j++) {
            line += A.real[i + j * A.dims[0]] + " ";
        }
        line += '\n';
    }
    return line;
}

function print_complex(A) {
    let line = '';
    for (let i = 0; i < A.dims[0]; i++) {
        for (let j = 0; j < A.dims[1]; j++) {
            line += A.real[i + j * A.dims[0]] + "+" + A.imag[i + j * A.dims[0]] + "i  ";
        }
        line += '\n';
    }
    return line;
}


export function print(A) {
    if (A.is_complex) {
        return print_complex(A);
    } else {
        return print_real(A);
    }
}

DoubleArray.prototype.is_array = true;
DoubleArray.prototype.is_logical = false;
LogicalArray.prototype.is_complex = false;
LogicalArray.prototype.is_logical = true;
Number.prototype.is_scalar = true;
Number.prototype.is_complex = false;
Number.prototype.is_array = false;
Number.prototype.is_logical = true;

//DoubleScalar.prototype.type = module.exports;
