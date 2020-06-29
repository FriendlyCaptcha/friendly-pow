import Crypto from './hmacSHA256';
import { constantTimeStringEquality } from './compare';

export function generatePuzzleBufferSignature(base64PuzzleBuffer: string, signingSecret: string): string {
    const hmac = Crypto.HmacSHA256(base64PuzzleBuffer, signingSecret);
    // The digest hex encoded is 64 characters for HMAC-256.
    const digest = hmac.toString(Crypto.enc.Hex);

    // Take the first half as this is HMAC-SHA256-128
    return digest.slice(0, 32);
}

export function checkSignature(base64PuzzleBuffer: string, signature: string, signingSecret: string): boolean {
    const expectedSignature = generatePuzzleBufferSignature(base64PuzzleBuffer, signingSecret);
    return constantTimeStringEquality(signature, expectedSignature);
}