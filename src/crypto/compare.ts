export function constantTimeStringEquality(a: string, b: string) {
    const alen = a.length;
    const blen = b.length;
    let mismatch = alen !== blen ? 1 : 0;
    if (alen !== blen) {
        b = a;
    }
    for (let i = 0; i < alen; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}
