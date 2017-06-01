import { isBasic, basicValue, FMValue } from './arrays';
import { ne } from './math';


export function is_nan(x: FMValue): FMValue {
    return ne(x, x);
}

export function real(x: FMValue): number {
    if (isBasic(x)) return basicValue(x);
    return x.real[0];
}

export function imag(x: FMValue): number {
    if (isBasic(x)) return 0;
    if (x.imag) return x.imag[0];
    return 0;
}

export function is_complex(x: FMValue): boolean {
    if (typeof (x) === 'number') return false;
    if (typeof (x) === 'boolean') return false;
    return (x.imag !== undefined);
}

export function is_scalar(x: FMValue): boolean {
    if (isBasic(x)) return true;
    return x.length === 1;
}
