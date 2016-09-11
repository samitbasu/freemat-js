const mat = require('./build/Release/mat');

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
    complexify() {
        if (this.is_complex) return this;
        this.imag = allocate(this.length);
        this.is_complex = true;
        return this;
    }
    get(where) {
        let ndx = 0;
        if (where.is_scalar) {
            ndx = where - 1;
        } else if (where.every(is_scalar)) {
            ndx = compute_ndx(this.dims,where);
        } else {
            throw "unhandled case for get in DoubleArray";
        }
        if (!this.is_complex)
            return make_scalar(this.real[ndx]);
        else
            return make_scalar(this.real[ndx],this.imag[ndx]);
    }
    set(where,what) {
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
    plus(other) {
        if (other.is_scalar && other.is_complex) {
            return new ComplexScalar(this.real + other.real,
                                     this.imag + other.imag);
        }
        if (other.is_scalar && !other.is_complex) {
            return new ComplexScalar(this.real + other.real,
                                     this.imag);
        }
        let ret = make_array(other.dims).complexify();
        let cnt = count(ret.dims);
        for (let ndx=0;ndx<cnt;ndx++) {
            ret.real[ndx] = this.real + other.real[ndx];
        }
        if (other.is_complex) {
            for (let ndx=0;ndx<cnt;ndx++) {
                ret.imag[ndx] = this.imag + other.imag[ndx];
            }
        } else {
            for (let ndx=0;ndx<cnt;ndx++) {
                ret.imag[ndx] = this.imag;
            }
        }
        return ret;        
    }
};

class LogicalScalar {
    constructor(real) {
        this.real = real;
    };
    bool() {
        return (this.real != 0);
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
    plus(other) {
        if (other.is_scalar && !other.is_complex) 
            return new DoubleScalar(this.real+other.real);
        if (other.is_scalar && other.is_complex)
            return new ComplexScalar(this.real+other.real,other.imag);
	let ret = make_array(other.dims);
        let cnt = count(ret.dims);
        for (let ndx=0;ndx<cnt;ndx++) {
            ret.real[ndx] = this.real + other.real[ndx];
        }
        if (other.is_complex) {
            for (let ndx=0;ndx<cnt;ndx++) {
                ret.imag[ndx] = other.imag[ndx];
            }
        }
        return ret;
    };
    equals(other) {
        if (other.is_scalar && !other.is_complex)
            return new LogicalScalar(this.real === other.real);
        if (other.is_scalar && other.is_complex)
            return new LogicalScalar((this.real === other.real) && (other.imag === 0));
        return new LogicalScalar(false);
    }
    times(other) {
        if (other.is_scalar && !other.is_complex) 
            return new DoubleScalar(this.real*other.real);
        if (other.is_scalar && other.is_complex) 
            return new ComplexScalar(this.real*other.real,
                                     this.real*other.imag);
    };
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
module.exports.print = print;
module.exports.is_scalar = is_scalar;
