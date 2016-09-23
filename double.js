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

class FMArray {
    constructor(x) {
        if (x instanceof Float64Array) {
            this.val = x.slice(0);
        } else {
            this.val = x;
        }
    }
    count() {
        if (this.x instanceof Float64Array) {
            return this.x.length;
        } else {
            return 1;
        }
    }
    isScalar() {
        return !(this.x instanceof Float64Array);
    }
    scalarValue() {
        if (this.x instanceof Float64Array) {
            return this.x[0];
        } else {
            return this.x;
        }
    }
}

/*
module.exports = class Double {
    constructor(real, imag = 0) {
        this.real = new FMArray(real);
        this.imag = new FMArray(imag);
    };
    isScalar() {
        return this.real.isScalar();
    }
    realScalar() {
        return this.real.scalarValue();
    }
    imagScalar() {
        return this.imag.scalarValue();
    }
    plus(other) {
        if (this.isScalar() && other.isScalar()) {
            return new Double(this.realScalar()+other.realScalar(),
                              this.imagScalar()+other.imagScalar());
        }
        return new Double(0,0);
    };
}
*/

function is_complex(x) {
    return ((typeof(x) === 'number') || x.complex_flag);
            
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

function count(array) {
    return array.reduce((x,y) => x*y,1);
}

function allocate(len) {
    if (len < 100) {
        return Array(len).fill(0);
    }
    return new Float64Array(len);
}

// Class that uses a typed array as backing for the data
// Useful for medium to large arrays.
class DoubleArray {
    constructor(dims, real = null) {
        this.dims = dims;
        this.length = count(dims);
        if (real)
            this.real = real;
        else
            this.real = allocate(this.length);
        this.imag = [];
        this.is_complex = false;
        this.is_scalar = false;
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
	if (where.is_scalar && what.is_scalar) {
	    this.real[where-1] = real_part(what);
	    return;
	}
        const scalar_case = where.every(is_scalar);
        if (scalar_case && what.is_scalar) {
            const ndx = compute_ndx(this.dims,where);
            this.real[ndx] = real_part(what);
            return;
        }
        if (is_complex(what) && !this.is_complex) {
            this.complexify();
        }
        if (scalar_case && (what instanceof ComplexScalar)) {
            const ndx = compute_ndx(this.dims,where);
            this.real[ndx] = what.real;
            this.imag[ndx] = what.imag;
            return;
        }
        throw `unhandled case for set in DoubleArray ${where} and ${JSON.stringify(what)}`;
    }
    binop(other,op) {
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
}

const make_scalar = function(real,imag = 0) {
    if (imag === 0)
        return new DoubleScalar(real);
    else
        return new ComplexScalar(real,imag);
}

const make_array = function(dims) {
    return new DoubleArray(dims);
}

function matmul_GEMM(a,b) {
    return new DoubleArray([a.dims[0],b.dims[1]],new Float64Array(mat.DGEMM(a,b)));
}

function matsolve_GEMM(a,b) {
    return new DoubleArray([a.dims[1],b.dims[1]],
                           new Float64Array(mat.DSOLVE(a,b,(x) => {
                               console.log(x);
                           })));
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
module.exports.matmul = matmul_GEMM;
module.exports.matsolve = matsolve_GEMM;
module.exports.print = print;
module.exports.is_scalar = is_scalar;
