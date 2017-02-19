export interface Comparator {
    op_real(a: number, b: number): boolean;
    op_complex(a_real: number, a_imag: number, b_real: number, b_imag: number): boolean;
};

export class LessThan implements Comparator {
    op_real(a: number, b: number): boolean {
        return a < b;
    }
    // To quote MLAB docs: lt compares only the real part of the elements in A.
    op_complex(a_real: number, _a_imag: number, b_real: number, _b_imag: number): boolean {
        return a_real < b_real;
    }
};

export class LessEquals implements Comparator {
    op_real(a: number, b: number): boolean {
        return a <= b;
    }
    // To quote MLAB docs: lt compares only the real part of the elements in A.
    op_complex(a_real: number, _a_imag: number, b_real: number, _b_imag: number): boolean {
        return a_real <= b_real;
    }
};

export class GreaterThan implements Comparator {
    op_real(a: number, b: number): boolean {
        return a > b;
    }
    // To quote MLAB docs: gt compares only the real part of the elements in A.
    op_complex(a_real: number, _a_imag: number, b_real: number, _b_imag: number): boolean {
        return a_real > b_real;
    }
};

export class GreaterEquals implements Comparator {
    op_real(a: number, b: number): boolean {
        return a >= b;
    }
    // To quote MLAB docs: lt compares only the real part of the elements in A.
    op_complex(a_real: number, _a_imag: number, b_real: number, _b_imag: number): boolean {
        return a_real >= b_real;
    }
};

export class Equals implements Comparator {
    op_real(a: number, b: number): boolean {
        return a === b;
    }
    // To quote MLAB docs: lt compares only the real part of the elements in A.
    op_complex(a_real: number, a_imag: number, b_real: number, b_imag: number): boolean {
        return ((a_real === b_real) && (a_imag === b_imag));
    }
};

export class NotEquals implements Comparator {
    op_real(a: number, b: number): boolean {
        return a !== b;
    }
    // To quote MLAB docs: lt compares only the real part of the elements in A.
    op_complex(a_real: number, a_imag: number, b_real: number, b_imag: number): boolean {
        return ((a_real !== b_real) || (a_imag !== b_imag));
    }
};
