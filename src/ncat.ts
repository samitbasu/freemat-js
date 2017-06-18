import { FMArray, mkArray, FMValue } from './arrays';

export function ncat(args_v: FMValue[], dim: number): FMArray {
    let args : FMArray[] = [];
    for (let i = 0;i<args_v.length;i++)
        args.push(mkArray(args_v[i]));
    if (args.length === 1)
        return args[0];
    let maxdims = 0;
    for (let d of args)
        maxdims = Math.max(d.dims.length, maxdims);
    for (let d of args)
        for (let ndx = 0; ndx < maxdims; ndx++)
            if ((ndx !== dim) && ((d.dims[ndx] || 0) !== (args[0].dims[ndx] || 0)))
                throw "Dimensions mismatch";
    let outputSize = args[0].dims.slice(0);
    let aggregated_size = 0;
    for (let d of args)
        aggregated_size += d.dims[dim];
    outputSize[dim] = aggregated_size;
    let pagesize: number[] = [];
    let offsets: number[] = [];
    for (let ndx = 0; ndx < args.length; ndx++) {
        let pagesze: number = 1;
        for (let j = 0; j <= dim; j++) {
            pagesze *= args[ndx].dims[j];
        }
        pagesize[ndx] = pagesze;
        offsets[ndx] = 0;
    }
    let op = new FMArray(outputSize);
    let outputOffset = 0;
    let outputCount = op.length;
    let k = 0;
    while (outputOffset < outputCount) {
        for (let ndx = 0; ndx < pagesize[k]; ndx++) {
            op.real[outputOffset + ndx] = args[k].real[ndx + offsets[k]];
        }
        outputOffset += pagesize[k];
        offsets[k] += pagesize[k];
        k = (k + 1) % args.length;
    }
    return op;
}
