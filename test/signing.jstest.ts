import { checkSignature, generatePuzzleBufferSignature } from "../src/crypto/signing";

describe("puzzle signing", () => {
    test("signature has expected length", () => {
        const buffer = "somepuzzlebuffer";
        const s = generatePuzzleBufferSignature(buffer, "secret");
        expect(s).toHaveLength(32);
    });

    test("signature tampering leads to false checks", () => {
        const buffer = "somepuzzlebuffer";
        const s = generatePuzzleBufferSignature(buffer, "secret");
        expect(checkSignature(buffer, s, "secret")).toBeTruthy();

        expect(checkSignature(buffer, s, "becret")).toBeFalsy(); // wrong secret
        expect(checkSignature("somepuzzlebuffar", s, "secret")).toBeFalsy(); //modified message
        expect(checkSignature("somepuzzlebuffar", s, "becret")).toBeFalsy(); //both modified
    });

    test("HMAC-SHA256-128 library has correct output", () => {
        // Example from the spec https://tools.ietf.org/html/draft-ietf-ipsec-ciph-sha-256-01 page 5
        const message = "what do ya want for nothing?";
        const secret = "Jefe";
        expect(generatePuzzleBufferSignature(message, secret)).toBe("5bdcc146bf60754e6a042426089575c7");
    });
});
