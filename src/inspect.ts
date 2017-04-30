import { FMArray } from './arrays';
import { NotEquals } from './math';

export function is_complex(x: FMArray): boolean {
    return (x.imag !== undefined);
}

export function is_nan(x: FMArray): FMArray {
    return NotEquals(x, x);
}

