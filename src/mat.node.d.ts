import { FMArray, NumericArray } from './arrays';

type RealMaker = (dims: number[], real: NumericArray) => FMArray;
type ComplexMaker = (dims: number[], real: NumericArray, imag: NumericArray) => FMArray;
type Logger = (msg: string) => void;

export function DGEMM(A: FMArray, B: FMArray, maker: RealMaker): FMArray;
export function ZGEMM(A: FMArray, B: FMArray, maker: ComplexMaker): FMArray;
export function DTRANSPOSE(A: FMArray, maker: RealMaker): FMArray;
export function ZTRANSPOSE(A: FMArray, maker: ComplexMaker): FMArray;
export function ZHERMITIAN(A: FMArray, maker: ComplexMaker): FMArray;
export function DSOLVE(A: FMArray, B: FMArray, logger: Logger, maker: RealMaker): FMArray;
export function ZSOLVE(A: FMArray, B: FMArray, logger: Logger, maker: ComplexMaker): FMArray;
