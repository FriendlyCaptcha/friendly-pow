export function uint8ArrayWithValues(values: Array<number>): Uint8Array {
    const arr = new Uint8Array(values.length);
    arr.set(values);
    return arr;
}

export function uint32ArrayWithValues(values: Array<number>): Uint32Array {
    const arr = new Uint32Array(values.length);
    arr.set(values);
    return arr;
}
