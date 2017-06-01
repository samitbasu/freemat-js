import { cnumber } from './complex';

export interface Comparator {
    op_real(a: number, b: number): boolean;
    op_complex(a: cnumber, b: cnumber): boolean;
};

export class LessThan implements Comparator {
    op_real(a: number, b: number): boolean {
        return a < b;
    }
    // To quote MLAB docs: lt compares only the real part of the elements in A.
    op_complex(a: cnumber, b: cnumber): boolean {
        return a.real < b.real;
    }
};

export class LessEquals implements Comparator {
    op_real(a: number, b: number): boolean {
        return a <= b;
    }
    // To quote MLAB docs: lt compares only the real part of the elements in A.
    op_complex(a: cnumber, b: cnumber): boolean {
        return a.real <= b.real;
    }
};

export class GreaterThan implements Comparator {
    op_real(a: number, b: number): boolean {
        return a > b;
    }
    // To quote MLAB docs: gt compares only the real part of the elements in A.
    op_complex(a: cnumber, b: cnumber): boolean {
        return a.real > b.real;
    }
};

export class GreaterEquals implements Comparator {
    op_real(a: number, b: number): boolean {
        return a >= b;
    }
    // To quote MLAB docs: lt compares only the real part of the elements in A.
    op_complex(a: cnumber, b: cnumber): boolean {
        return a.real >= b.real;
    }
};

export class Equals implements Comparator {
    op_real(a: number, b: number): boolean {
        return a === b;
    }
    op_complex(a: cnumber, b: cnumber): boolean {
        return ((a.real === b.real) && (a.imag === b.imag));
    }
};

export class NotEquals implements Comparator {
    op_real(a: number, b: number): boolean {
        return a !== b;
    }
    // To quote MLAB docs: lt compares only the real part of the elements in A.
    op_complex(a: cnumber, b: cnumber): boolean {
        return ((a.real !== b.real) || (a.imag !== b.imag));
    }
};
