// From https://gist.github.com/Yaffle/4654250

const EPSILON = Math.pow(2, -52);
const MAX_VALUE = (2 - EPSILON) * Math.pow(2, 1023);
const MIN_VALUE = Math.pow(2, -1022);

function nextUp(x: number): number {
    if (x !== x) {
        return x;
    }
    if (x === -1 / 0) {
        return -MAX_VALUE;
    }
    if (x === +1 / 0) {
        return +1 / 0;
    }
    if (x === +MAX_VALUE) {
        return +1 / 0;
    }
    let y = x * (x < 0 ? 1 - EPSILON / 2 : 1 + EPSILON);
    if (y === x) {
        y = MIN_VALUE * EPSILON > 0 ? x + MIN_VALUE * EPSILON : x + MIN_VALUE;
    }
    if (y === +1 / 0) {
        y = +MAX_VALUE;
    }
    const b = x + (y - x) / 2;
    if (x < b && b < y) {
        y = b;
    }
    const c = (y + x) / 2;
    if (x < c && c < y) {
        y = c;
    }
    return y === 0 ? -0 : y;
};


export function nextAfter(x: number, y: number) {
    return y < x ? -nextUp(-x) : (y > x ? nextUp(x) : (x !== x ? x : y));
}
