import { difficultyToThreshold } from "../src/encoding";
import { solveBlake2bEfficient } from "../src/solver";
import { instantiateWasmSolver } from "../src/loader";
import { base64 } from "../dist/wasm/optimized.wrap";
import { decode } from "../src/base64";

//@ts-ignore
const globalScope =
  (typeof window !== "undefined" && window) || (typeof global !== "undefined" && global) || self;
Object.assign(globalScope, { ASC_TARGET: 0 });

const threshold = difficultyToThreshold(175);
let myModule: any;
const imports = {
  console: {
    log: (msgPtr: number) => {
      console.log(myModule.exports.__getString(msgPtr));
    },
  },
};

console.log("Threshold:", threshold);

const wasmBytes = decode(base64);
const wasmModule = WebAssembly.compile(wasmBytes);

wasmModule.then((module: any) =>
  instantiateWasmSolver(module).then((w) => {
    myModule = w;

    const arrPtr = w.exports.__retain(
      w.exports.__allocArray(w.exports.Uint8Array_ID, new Uint8Array(128))
    );
    let solution = w.exports.__getUint8Array(arrPtr);
    solution.set([1, 2, 3]);

    console.time("solve-time");
    const hashPtr = w.exports.solveBlake2b(arrPtr, threshold, 100000000);
    console.timeEnd("solve-time");
    const wasmHash = w.exports.__getUint8Array(hashPtr);
    w.exports.__release(hashPtr);
    const jsHash = solveBlake2bEfficient(solution, threshold, 1); // Only 1 attempt required as we start from the solution.

    console.log("Solution WASM:", solution.slice(-8));
    console.log("Solution JS", solution.slice(-8));
    console.log(
      "hash equal:",
      jsHash.every((val, index) => val === wasmHash[index])
    );
    w.exports.__release(arrPtr);
  })
);
