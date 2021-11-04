/**
 * Maps a value between 0 and 255 to a difficulty threshold (as uint32)
 * Difficulty 0 maps to 99.99% probability of being right on the first attempt
 * Anything above 250 needs 2^32 tries on average to solve.
 * 150 to 180 seems reasonable
 */
export function difficultyToThreshold(value: u8): u32 {
  if (value > 255) {
    value = 255;
  } else if (value < 0) {
    value = 0;
  }

  return (Math.pow(2, (255.999 - (value as f64)) / 8.0) as u32) >>> 0;
}

/**
 * Maps a value between 0 and 255 to a time duration in seconds that a puzzle is valid for.
 */
export function expiryToDurationInSeconds(value: u8): u32 {
  if (value > 255) {
    value = 255;
  } else if (value < 0) {
    value = 0;
  }

  return (value as u32) * 300;
}
