import { cnumber, cmul, cdiv } from './complex';

export interface Operator {
    op_real(a: number, b: number): number;
    op_complex(a: cnumber, b: cnumber): cnumber;
};

export class Adder implements Operator {
    op_real(a: number, b: number): number {
        return (a + b);
    }
    op_complex(a: cnumber, b: cnumber): cnumber {
        return {
            real: a.real + b.real,
            imag: a.imag + b.imag
        };
    }
};

export class Subtractor implements Operator {
    op_real(a: number, b: number): number {
        return (a - b);
    }
    op_complex(a: cnumber, b: cnumber): cnumber {
        return {
            real: a.real - b.real,
            imag: a.imag - b.imag
        };
    }
};


export class Multiplier implements Operator {
    op_real(a: number, b: number): number {
        return a * b;
    }
    op_complex(a: cnumber, b: cnumber): cnumber {
        return cmul(a, b);
    }
};

export class RightDivider implements Operator {
    op_real(a: number, b: number): number {
        return a / b;
    }
    op_complex(a: cnumber, b: cnumber): cnumber {
        return cdiv(a, b);
    }
}

export class LeftDivider implements Operator {
    op_real(a: number, b: number): number {
        return b / a;
    }
    op_complex(a: cnumber, b: cnumber): cnumber {
        return cdiv(b, a);
    }
}

