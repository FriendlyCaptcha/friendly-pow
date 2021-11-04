function toU32(value: number): u32 {
  return (value as u32) >>> 0;
}

/**
 * Unix timestamp in seconds since epoch as unsigned 32 bit integer right now.
 */
export function getTimestampInSeconds(): u32 {
  return toU32((Date.now() / 1000) as f64);
}

export function dateToTimestampInSeconds(date: Date): u32 {
  return toU32((date.getTime() / 1000) as f64);
}

export function timestampInSecondsToDate(timestamp: u32): Date {
  return new Date((timestamp as u64) * 1000);
}
