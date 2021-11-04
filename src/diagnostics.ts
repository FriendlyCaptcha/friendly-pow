export function createDiagnosticsBuffer(solverID: 1 | 2, timeToSolved: number) {
  const arr = new Uint8Array(3);
  const view = new DataView(arr.buffer);
  view.setUint8(0, solverID);
  view.setUint16(1, timeToSolved);

  return arr;
}
