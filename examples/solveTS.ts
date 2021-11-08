import { solveBlake2bEfficient } from "../src/solver";
import { difficultyToThreshold } from "../src/encoding";

const threshold = difficultyToThreshold(175);

console.log("Threshold:", threshold);

//@ts-ignore
const globalScope =
  (typeof window !== "undefined" && window) || (typeof global !== "undefined" && global) || self;
Object.assign(globalScope, { ASC_TARGET: 0 });

const input = new Uint8Array(128);
input.set([1, 2, 3]);
console.time("solve-time");
const h = solveBlake2bEfficient(input, threshold, 10000000);
console.timeEnd("solve-time");

console.log(input.slice(-8));
console.log(h);
