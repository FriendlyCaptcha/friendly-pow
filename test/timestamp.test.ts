import {
  getTimestampInSeconds,
  dateToTimestampInSeconds,
  timestampInSecondsToDate,
} from "../src/timestamp";

describe("timestamp utils", () => {
  test("unix time in seconds as u32", () => {
    const t = 1591632913 as u32;
    expect<u32>(getTimestampInSeconds()).toBeGreaterThan(t); // Time of writing this test
    expect(getTimestampInSeconds()).toBeLessThan(t + 1000000000); // Many years (~30) into the future
  });

  test("unix timestamp to date conversion stable", () => {
    const ts = dateToTimestampInSeconds(new Date(1592879769186));
    const d = timestampInSecondsToDate(ts);
    const tsRevert = dateToTimestampInSeconds(d);
    const dRevert = timestampInSecondsToDate(tsRevert);

    expect(dRevert.getTime()).toBe(d.getTime());
  });
});
