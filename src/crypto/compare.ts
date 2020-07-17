export function constantTimeStringEquality(a: string, b: string) {
    let alen = a.length;
    let blen = b.length;
    let mismatch = alen !== blen ? 1 : 0;
    if (alen !== blen) {
        b = a;
    }
    for (let i = 0; i < alen; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}
