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

const op_add = require('./add.js');
const op_subtract = require('./subtract.js');
const op_times = require('./multiply.js');
const op_rdivide = require('./rdivide.js');
const op_ldivide = {
    scalar_real : (a,b) => op_rdivide.scalar_real(b,a),
    scalar_complex: (ar,ai,br,bi) =>
	op_rdivide.scalar_complex(br,bi,ar,ai), 
    vector_scalar_real: (c,a,b) =>
	op_rdivide.scalar_vector_real(c,b,a),
    vector_scalar_complex: (c,a,b) =>
	op_rdivide.scalar_vector_complex(c,b,a),
    scalar_vector_real: (c,a,b) =>
	op_rdivide.vector_scalar_real(c,b,a),
    scalar_vector_complex: (c,a,b) =>
	op_rdivide.vector_scalar_complex(c,b,a),
    vector_vector_real: (c,a,b) =>
	op_rdivide.vector_vector_real(c,b,a),
    vector_vector_complex: (c,a,b) =>
	op_rdivide.vector_vector_complex(c,b,a)
}

function is_scalar(x) {
    return ((typeof(x) === 'number') || (x.is_scalar));
}

function real_part(x) {
    if (typeof(x) === 'number') return x;
    return x.real;
}

function compute_ndx(dims,x) {
    if (dims.length === x.length) {
        let ndx = 0;
        let slice_size = 1;
        for (let i=0;i<x.length;i++) {
            if (x[i] < 1) throw 'Illegal zero or negative index';
            ndx = ndx + (x[i]-1)*slice_size;
            slice_size *= dims[i];
        }
        return ndx;
    }
    throw "What?";
}

function is_vector(dims) {
    const cdim = count(dims);
    return ((cdim === dims[0]) || (cdim === dims[1]));
}

function is_row_vector(dims) {
    return (is_vector(dims) && (dims[0] === 1));
}

function count(array) {
    return array.reduce((x,y) => x*y,1);
}

function exceeds_limits(x,lim) {
    for (let i=0;i<x.length;i++) {
        if (x[i] > (lim[i] || 1)) return true;
    }
    return false;
}

function new_size(x,lim) {
    let ret = [];
    for (let i=0;i<Math.max(x.length,lim.length);i++) {
        ret[i] = Math.max((x[i] || 1),(lim[i] || 1));
    }
    return ret;
}

function allocate(len) {
    if (len < 100) {
        return Array(len).fill(0);
    }
    return new Float64Array(len);
}

function extend_dims(dims, len) {
    for (let i=dims.length;i<len;i++) dims[i] = 1;
}

function dot(x,y) {
    let accum = 0;
    for (let i=0;i<x.length;i++)
        accum += (x[i]*y[i]);
    return accum;
}

function stride(dims) {
    let ret = [1];
    for (let i=1;i<dims.length;i++)
        ret[i] = ret[i-1]*dims[i-1];
    return ret;
}

function increment_ripple(x,limits,dim) {
    x[dim]++;
    for (let i=dim;i<x.length;i++) {
        if (x[i] >= limits[i]) {
            x[i] = 0;
            x[i+1]++;
        }
    }
}

function copyLoop(orig_dims, array, new_dims) {
    const capacity = count(new_dims)*2;
    let op = allocate(capacity);
    // Normalize the dimensions so that they match
    let dim_len = Math.max(new_dims.length,orig_dims.length);
    extend_dims(orig_dims,dim_len);
    extend_dims(new_dims,dim_len);
    const a_rows = orig_dims[0];
    // Calculate the number of iterations
    const iterations = count(orig_dims)/a_rows;
    // Calculate the stride vector
    const stride_vec = stride(new_dims);
    // Create an index vector
    let ndx = Array(dim_len).fill(0);
    let offset = 0;
    for (let iter=0;iter < iterations;iter++) {
        let start = dot(ndx,stride_vec);
        for (let row=0;row<a_rows;row++) {
            op[row+start] = array[offset+row];
        }
        offset = offset + a_rows;
        increment_ripple(ndx,orig_dims,1);
    }
    return {dims: new_dims, capacity: capacity, array: op};
}

// Class that uses a typed array as backing for the data
// Useful for medium to large arrays.
class DoubleArray {
    constructor(dims, real = null, imag = []) {
        this.dims = dims;
        this.length = count(dims);
        this.capacity = this.length;
        if (real)
            this.real = real;
        else
            this.real = allocate(this.length);
        this.imag = imag;
        this.is_complex = (imag.length !== 0);
        this.is_scalar = (this.length === 1);
    }
    resize(new_dims) {
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
            const real_part = copyLoop(this.dims,this.real,new_dims);
            this.dims = real_part.dims;
            this.capacity = real_part.capacity;
            this.real = real_part.array;
            this.length = count(this.dims);
            this.is_scalar = (this.length === 1);
        } else {
            const real_part = copyLoop(this.dims,this.real,new_dims);
            const imag_part = copyLoop(this.dims,this.imag,new_dims);
            this.dims = real_part.dims;
            this.capacity = real_part.capacity;
            this.real = real_part.array;
            this.imag = imag_part.array;
            this.length = count(this.dims);
            this.is_scalar = (this.length === 1);
        }
        return this;
    }
    slice(offset,dims) {
	let slice_len = count(dims);
	if (this.real instanceof Float64Array) 
	    return new DoubleArray(dims, new Float64Array(this.real.buffer,
							  offset*8,slice_len));
	throw "What?";
    }
    complexify() {
        if (this.is_complex) return this;
        this.imag = allocate(this.length);
        this.is_complex = true;
        return this;
    }
    fast_get(where) {
	return this.real[where|0];
    }
    get(where) {
        let ndx = 0;
        if (where.is_scalar) {
            ndx = where - 1;
        } else if (where.every(is_scalar)) {
            ndx = compute_ndx(this.dims,where);
        } else {
            throw "unhandled case for get in DoubleArray " + where;
        }
        if (!this.is_complex)
            return make_scalar(this.real[ndx]);
        else
            return make_scalar(this.real[ndx],this.imag[ndx]);
    }
    fast_set(a,b) {
	this.real[a] = b;
    }
    set(where,what) {
        if (!this.is_complex && what.is_complex) {
            this.complexify();
        }
        if ((where.is_scalar) && (where > this.length)) {
            if (this.is_scalar || is_row_vector(this.dims)) {
                let that = this.resize([1,where]);
                return that.set(where,what);
            } else {
                this.dims = [this.length,1];
                let that = this.resize([where,1]);
                return that.set(where,what);
            }
        }
	if ((where.is_scalar||0) && (what.is_scalar||0) && !what.is_complex) {
	    this.real[where-1] = real_part(what);
	    return this;
	}
        if ((where.is_scalar||0) && (what.is_scalar||0) && (what.is_complex||0)) {
            this.real[where-1] = what.real;
            this.imag[where-1] = what.imag;
            return this;
        }
        const scalar_case = where.every(is_scalar);
        if (scalar_case && exceeds_limits(where,this.dims)) {
            let that = this.resize(new_size(where,this.dims));
            return that.set(where,what);
        }
        if (scalar_case && what.is_scalar && !what.is_complex) {
            const ndx = compute_ndx(this.dims,where);
            this.real[ndx] = real_part(what);
            return this;
        }
        if (scalar_case && what.is_scalar && what.is_complex) {
            const ndx = compute_ndx(this.dims,where);
            this.real[ndx] = what.real;
            this.imag[ndx] = what.imag;
            return this;
        }
        throw `unhandled case for set in DoubleArray ${where} and ${JSON.stringify(what)}`;
    }
    binop(other,op) {
        if (this.is_scalar && other.is_scalar) {
            if (other.is_complex || this.is_complex) {
                let ret = make_scalar(0,0);
                op.scalar_scalar_complex(ret,this,other);
                return ret;
            }
            let ret = make_scalar(0);
            op.scalar_scalar_real(ret,this,other);
            return ret;
        }
        if (other.is_scalar) {
            if (other.is_complex || this.is_complex) {
                // Case real_vec + complex_scalar
                let ret = make_array(this.dims).complexify();
		op.vector_scalar_complex(ret,this,other);
                return ret;
            }
	    // Case real_vec + real_scalar
	    let ret = make_array(this.dims);
	    op.vector_scalar_real(ret,this,other);
	    return ret;
	}
	// real, real
	if (!this.is_complex && !other.is_complex) {
	    let ret = make_array(this.dims);
	    op.vector_vector_real(ret,this,other);
	    return ret;
	}
	let ret = make_array(this.dims).complexify();
	op.vector_vector_complex(ret,this,other);
	return ret;
    }
    plus(other) {
        return this.binop(other,op_add);
    }
    minus(other) {
	return this.binop(other,op_subtract);
    }
    times(other) {
	return this.binop(other,op_times);
    }
    rdivide(other) {
	return this.binop(other,op_rdivide);
    }
    ldivide(other) {
	return this.binop(other,op_ldivide);
    }
    mtimes(other) {
        if (other instanceof DoubleArray) {
            return new DoubleArray([this.dims[0],other.dims[1]], new Float64Array(mat.DGEMM(this,other)));
        }
        throw "unhandled case for matrix times";
    }
}

class ComplexScalar {
    constructor(real,imag) {
        this.real = real;
        this.imag = imag;
    }
    equals(other) {
        if (other instanceof ComplexScalar) {
            return new LogicalScalar((this.real === other.real) && (this.imag === other.imag));
        }
        if (other instanceof DoubleScalar) {
            return new LogicalScalar((this.real === other.real) && (this.imag === 0));
        }
        return false;
    }
    binop(other,op) {
        if (other.is_scalar && other.is_complex) {
	    const tmp = op.scalar_complex(this.real,this.imag,other.real,other.imag);
	    return new ComplexScalar(tmp[0],tmp[1]);
        }
        if (other.is_scalar && !other.is_complex) {
	    const tmp = op.scalar_complex(this.real,this.imag,other.real,0);
	    return new ComplexScalar(tmp[0],tmp[1]);
        }
        let ret = make_array(other.dims).complexify();
	op.scalar_vector_complex(ret,this,other);
	return ret;
    }
    plus(other) {
	return this.binop(other,op_add);
    }
    minus(other) {
	return this.binop(other,op_subtract);
    }
    times(other) {
	return this.binop(other,op_times);
    }
    rdivide(other) {
	return this.binop(other,op_rdivide);
    }
    ldivide(other) {
	return this.binop(other,op_ldivide);
    }
    set(where,what) {
        let that = make_array([1,1],[this.real],[this.imag]);
        return that.set(where,what);
    }
};

class LogicalScalar {
    constructor(real) {
        this.real = real;
    };
    bool() {
        return (this.real);
    }
    plus(other) {
        if (other.is_scalar && !other.is_complex)
            return new DoubleScalar(this.real+other.real);
    }
};

class DoubleScalar {
    constructor(real) {
        this.real = real;
    };
    binop(other,op) {
        if (other.is_scalar && !other.is_complex) 
            return new DoubleScalar(op.scalar_real(this.real,other.real));
        if (other.is_scalar && other.is_complex) {
	    const tmp = op.scalar_complex(this.real,0,other.real,other.imag);
	    return new ComplexScalar(tmp[0],tmp[1]);
	}
	if (other.is_complex) {
	    let ret = make_array(other.dims).complexify();
	    op.scalar_vector_complex(ret,this,other);
	    return ret;
	}
	let ret = make_array(other.dims);
	op.scalar_vector_real(ret,this,other);
	return ret;
    };
    equals(other) {
        if (other.is_scalar && !other.is_complex)
            return new LogicalScalar(this.real === other.real);
        if (other.is_scalar && other.is_complex)
            return new LogicalScalar((this.real === other.real) && (other.imag === 0));
        return new LogicalScalar(false);
    }
    plus(other) {
	return this.binop(other,op_add);
    }
    minus(other) {
	return this.binop(other,op_subtract);
    }
    times(other) {
	return this.binop(other,op_times);
    }
    rdivide(other) {
	return this.binop(other,op_rdivide);
    }
    ldivide(other) {
	return this.binop(other,op_ldivide);
    }
    set(where,what) {
        let that = make_array([1,1],[this.real]);
        return that.set(where,what);
    }
}

const make_scalar = function(real,imag = 0) {
    if (imag === 0)
        return new DoubleScalar(real);
    else
        return new ComplexScalar(real,imag);
}

/*
const make_scalar = function(real, imag = 0) {
    if (imag === 0) {
        let p = new DoubleArray([1,1],real);
        p.is_scalar = true;
        return p;
    } else {
        let p = new DoubleArray([1,1],real,imag);
        p.is_scalar = true;
        return p;
    }
}
*/

const make_array = function(dims) {
    return new DoubleArray(dims);
}

function print(A) {
    let line = '';
    for (let i=0;i<A.dims[0];i++) {
        for (let j=0;j<A.dims[1];j++) {
            line += A.real[i+j*A.dims[0]] + " ";
        }
        line += '\n';
    }
    return line;
}
ComplexScalar.prototype.is_scalar = true;
ComplexScalar.prototype.is_complex = true;
DoubleScalar.prototype.is_scalar = true;
DoubleScalar.prototype.is_complex = false;
DoubleScalar.prototype.imag = 0;
DoubleArray.prototype.is_scalar = false;
Number.prototype.is_scalar = true;
Number.prototype.is_complex = false;

function initialize() {
    return this;
}

module.exports.init = initialize;
module.exports.make_scalar = make_scalar;
module.exports.make_array = make_array;
module.exports.matmul = (a,b) => {
    return new DoubleArray([a.dims[0],b.dims[1]],
                           new Float64Array(mat.DGEMM(a,b)));
}
module.exports.matsolve = (a,b) => {
    return new DoubleArray([a.dims[1],b.dims[1]],
                           new Float64Array(mat.DSOLVE(a,b,(x) => {
                               console.log(x);
                           })));
}
module.exports.transpose = (a) => {
    return new DoubleArray([a.dims[1],a.dims[0]],
                           new Float64Array(mat.DTRANSPOSE(a)));
}
module.exports.print = print;
module.exports.is_scalar = is_scalar;
DoubleScalar.prototype.type = module.exports;
