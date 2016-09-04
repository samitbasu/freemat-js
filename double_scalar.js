module.exports = class DoubleScalar {
    constructor(real, imag = 0) {
        this.real = real;
        this.imag = imag;
    };
    plus(other) {
        if (other instanceof DoubleScalar) {
            return new DoubleScalar(this.real + other.real,
                                    this.imag + other.imag);
        }
        throw "What?";
    };
    times(other) {
        if (other instanceof DoubleScalar) {
            return new DoubleScalar(this.real*other.real -
                                    this.imag*other.imag,
                                    this.real*other.imag +
                                    this.imag*other.real);
        }
    };
}
