# 👾 Friendly Proof of Work (PoW) 

The PoW challenge library used by FriendlyCaptcha.

It has a mirror implementation in both WASM and JS (as fallback for very old browsers). The WASM build is an order of magnitude faster (determined empirically).
Here we will call the computation challenge the computer has to solve the **puzzle**, the client has to find one or more **solutions** that can later be verified.

## Implementation
The WASM is compiled from AssemblyScript, which is more or less a subset of Typescript. The WASM build entrypoint is found at [`src/entryWasm.ts`](./src/entryWasm.ts). The wrappers for the JS and WASM build are found in the `src/api` folder, they both have the same interface.

## Puzzle format
The Puzzle is represented as a 32 byte to 64 byte message (depending on whether any user data is passed), let's call this the puzzle buffer. Encoded in this byte buffer is metadata such as when the puzzle was created, its difficulty, and a nonce, this is described in more detail later.

A solution consists of one or more 8 byte values.

### Puzzle difficulty
The difficulty of a puzzle is encoded in the challenge buffer as a single byte `d`. The *difficulty threshold* `T` is computed using the formula:

```
T = floor(2^((255.999-d)/8)))
```

In Javascript this is defined as:

```javascript
const T = (Math.pow(2, (255.999 - d)/8.0) >>> 0) // >>> 0 forces it to unsigned 32bit value
```

### Solving the puzzle
First the puzzle buffer is padded with zeroes until it is 128 bytes long. Then the goal is to change the last 8 bytes of this buffer (which we will call the `solution`) until the [`blake2b-256`](https://en.wikipedia.org/wiki/BLAKE_(hash_function)) hash of this buffer meets this criteria:

The first 4 bytes of the `blake2b-256` hash are read as a little-endian unsigned 32 bit integer. If this integer smaller than the *difficulty threshold* `T` for the puzzle, the `solution` is **valid**.

The only way to solve the puzzle is to exhaustively try different solutions. The probability of getting a solution per attempt is given by `T/(2^32-1)` (note the denominator is the maximum uint32 value), the expected number of attempts required is the inverse of that probability.

### Multiple puzzles

One could get lucky or unlucky in how many attempts are required to find a solution. In order to reduce the variance and allow us to show a progress bar to the user we actually have the client find multiple solutions (with a lower difficulty threshold). This number of solutions (`n`) required is also encoded in the puzzle buffer as single byte value.

The final solution to the whole puzzle are `n` of these 8 byte `solutions` concatenated together.


## Puzzle format
The puzzle is described by a byte array up to 64 bytes (the `puzzle buffer`). It consists of

```
 The input to solve consists of bytes (and their corresponding trailing offsets AKA cumulative sum of bytes)
 * 4 (Puzzle Timestamp)    | 4
 * 4 (Account ID)          | 8
 * 4 (App ID)              | 12
 * 1 (Puzzle version)      | 13
 * 1 (Puzzle expiry)       | 14
 * 1 (Number of solutions) | 15
 * 1 (Puzzle difficulty)   | 16
 * 8 (Reserved, 0 for now) | 24
 * 8 (Puzzle Nonce)        | 32
 * 32 (Optional user data) | 64

Or as characters (without user data):
tttt aaaa bbbb v e n d 00000000 pppppppp
```
The timestamp is in seconds since unix epoch (as unsigned 32 bit integer), the challenge nonce is a cryptographically secure random 8 byte value.

When sent over the network the puzzle is base64 encoded. Along with the puzzle buffer a signature is also sent (more details below). The mesage consists of those two parts with a `.` separating them:

```
<signature>.<base64 encoded puzzle buffer>
```

### Puzzle expiry
This byte encodes how long a solution for the puzzle can be submitted for. The duration in seconds is derived from this byte multiplying it by 300 (=5 minutes):

```
expiration_in_seconds = expiration_byte_value * 300
```

This implies that the maximum possible time is 21 hours and 15 minutes of validity. A value of 0 means the challenge does not expire (not recommended as you would have to keep the token indefinitely to prevent replay attacks, in FriendlyCaptcha this will not be allowed).

The client is responsible for fetching and solving another puzzle if theirs is about to expire.

### Puzzle version
Currently always 1, in the future this can be bumped if breaking changes are made.

### User data
(In the future) the user could add their own data to the puzzle and later verify these values are as expected. 

### Signature
The puzzle buffer is signed by the FriendlyCaptcha servers using a *signing secret*. The puzzle buffer's first 16 bytes are the [`HMAC-256-128`](https://tools.ietf.org/html/draft-ietf-ipsec-ciph-sha-256-01) of `(signing_secret, puzzle_buffer)` with the buffer base64 encoded. 

This signature is sent over the wire hex encoded.

## Solution format
Repeating from above: a number of solutions is required for the puzzle (up to 255), and every solution is an 8 byte value. These 8 byte solutions are concatenated together into one byte array. The solution payload is a string that consists of the signature, puzzle, solutions and diagnostics (detailed below), the last 3 of these are base64 encoded, with a `.` separating them:

```
<signature>.<base 64 of puzzle buffer>.<base 64 of solutions>.<base 64 of diagnostics>
```

## Diagnostics
The client sends 3 bytes of information that helps give insight into what the experience is like for users (in particular how long it takes), this allows the website host that used FriendlyCaptcha to tweak the difficulty to what makes sense for their audience. 

```
byte 0: what solver was used, 0 for unspecified, 1 for JS fallback, 2 for WASM32.
byte 1-2: how many seconds the solve took in total as an unsigned 16 bit integer.
```

## Verification
Verification can be done as follows:
* **Integrity**: The puzzle buffer integrity is verified by checking that the signature matches.
* **Check Account and App ID**: Check whether the puzzle was for this account + website (section).
* **Expiration**: Timestamp and expiry time is compared to current time.
* **Version**: The version of the puzzle is checked to be sure we support that version.
* **Solution Count**: Check that we have enough solutions to the puzzle and that there are no duplicates.
* **Replay check**: Check whether this puzzle has been submitted before.
* **Solution verification**: Each of the solutions are verified to produce a correct hash given the difficulty.

These steps can happen in any order.

## License
MIT
