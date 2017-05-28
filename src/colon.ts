import { nextAfter } from "./ulp"

export class ColonGenerator {
    readonly length: number;
    readonly minval: number;
    readonly stepsize: number;
    readonly maxval: number;
    ndx: number;
    readonly use_double_sided: boolean;
    constructor(minval: number, stepsize: number, maxval: number) {
        this.minval = minval;
        this.maxval = maxval;
        this.stepsize = stepsize;
        this.ndx = 0;
        if (stepsize === 0)
            throw "Step size must be nonzero in colon expression"; // FIXME - type
        if (!Number.isFinite(minval) ||
            !Number.isFinite(maxval) ||
            !Number.isFinite(stepsize)) {
            this.length = 0;
            return;
        }
        const ntest_min = nextAfter(maxval - minval, 0) / nextAfter(stepsize, stepsize + stepsize);
        const ntest_max = nextAfter(maxval - minval, maxval - minval + stepsize) / nextAfter(stepsize, 0);
        let npts = Math.floor(ntest_max);
        this.use_double_sided = (ntest_min <= npts) && (npts <= ntest_max);
        npts++;
        if (npts < 0) npts = 0;
        this.length = npts;
    }
    done(): boolean {
        return (this.ndx >= this.length);
    }
    next(): number {
        let p: number;
        if (!this.use_double_sided) {
            p = this.minval + this.ndx * this.stepsize;
        } else {
            // Odd case
            if (this.ndx < this.length / 2)
                p = this.minval + this.ndx * this.stepsize;
            else {
                const myndx = this.length - 1 - this.ndx;
                p = this.maxval - myndx * this.stepsize;
            }
        }
        this.ndx++;
        return p;
    }
}
