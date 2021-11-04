import { solveBlake2bEfficient } from "../solver";

export async function getJSSolver() {
  return (puzzleBuffer: Uint8Array, threshold: number, n = 4294967295) => {
    const hash = solveBlake2bEfficient(puzzleBuffer, threshold, n);
    return [puzzleBuffer, hash];
  };
}
