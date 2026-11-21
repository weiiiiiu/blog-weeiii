import { dateToYMDHM, getDateParts, parseDate } from "../lib/date";

describe("date parsing and deterministic prerendering", () => {
  test.each([
    ["2026-07-28", "2026-07-27T16:00:00.000Z"],
    ["2026-01-06 03:04", "2026-01-05T19:04:00.000Z"],
    ["2026-09-09T01:00:00+08:00", "2026-09-08T17:00:00.000Z"],
    ["2026-07-28T00:00:00.000Z", "2026-07-28T00:00:00.000Z"],
  ])("parses %s independently of the machine time zone", (input, expected) => {
    expect(parseDate(input).toISOString()).toBe(expected);
  });

  test("uses the site calendar date for the prerendered snapshot", () => {
    const date = new Date("2026-09-08T17:00:00.000Z");
    expect(dateToYMDHM(date, "Asia/Shanghai")).toBe("2026-09-09 01:00");
    expect(dateToYMDHM(date, "America/Los_Angeles")).toBe("2026-09-08 10:00");
    expect(dateToYMDHM(date, "UTC")).toBe("2026-09-08 17:00");
  });

  test("formats midnight with hour zero and preserves day boundaries", () => {
    expect(
      getDateParts(parseDate("2026-07-28"), "Asia/Shanghai"),
    ).toMatchObject({
      year: "2026",
      month: "07",
      day: "28",
      hour: "00",
      minute: "00",
    });
  });
});
