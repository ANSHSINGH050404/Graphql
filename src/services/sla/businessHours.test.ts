import { describe, expect, test } from "bun:test";
import { DateTime } from "luxon";
import { addBusinessHours } from "./businessHours";
import { createBusinessCalendar, isBusinessDay } from "./businessHours";

describe("isBusinessDay", () => {
  const calendar = createBusinessCalendar([]);

  test("Monday is a business day", () => {
    const date = DateTime.fromISO("2026-08-24", { zone: "Asia/Kolkata" });

    expect(isBusinessDay(date, calendar)).toBe(true);
  });

  test("Saturday is not a business day", () => {
    const date = DateTime.fromISO("2026-08-22", { zone: "Asia/Kolkata" });

    expect(isBusinessDay(date, calendar)).toBe(false);
  });

  test("Sunday is not a business day", () => {
    const date = DateTime.fromISO("2026-08-23", { zone: "Asia/Kolkata" });

    expect(isBusinessDay(date, calendar)).toBe(false);
  });

  test("holiday is not a business day", () => {
    const calendar = createBusinessCalendar(["2026-08-24"]);

    const date = DateTime.fromISO("2026-08-24", { zone: "Asia/Kolkata" });

    expect(isBusinessDay(date, calendar)).toBe(false);
  });
});

describe("addBusinessHours", () => {
  const config = {
    startHour: 8,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    timezone: "Asia/Kolkata",
  };

  const calendar = createBusinessCalendar([]);

  test("adds hours within same day", () => {
    const start = DateTime.fromISO("2026-08-24T10:00:00", {
      zone: "Asia/Kolkata",
    });

    const result = addBusinessHours(start, 4, config, calendar);

    expect(result.toFormat("yyyy-MM-dd HH:mm")).toBe("2026-08-24 14:00");
  });

  test("crosses to the next business day", () => {
    const start = DateTime.fromISO("2026-08-24T16:00:00", {
      zone: "Asia/Kolkata",
    });

    const result = addBusinessHours(start, 4, config, calendar);

    expect(result.toFormat("yyyy-MM-dd HH:mm")).toBe("2026-08-25 10:00");
  });

  test("skips weekend", () => {
    const start = DateTime.fromISO("2026-08-28T16:00:00", {
      zone: "Asia/Kolkata",
    });

    const result = addBusinessHours(start, 4, config, calendar);

    expect(result.toFormat("yyyy-MM-dd HH:mm")).toBe("2026-08-31 10:00");
  });

  test("moves before-hours creation to business start", () => {
    const start = DateTime.fromISO("2026-08-24T06:00:00", {
      zone: "Asia/Kolkata",
    });

    const result = addBusinessHours(start, 2, config, calendar);

    expect(result.toFormat("yyyy-MM-dd HH:mm")).toBe("2026-08-24 10:00");
  });

  test("moves after-hours creation to next business day", () => {
    const start = DateTime.fromISO("2026-08-24T20:00:00", {
      zone: "Asia/Kolkata",
    });

    const result = addBusinessHours(start, 2, config, calendar);

    expect(result.toFormat("yyyy-MM-dd HH:mm")).toBe("2026-08-25 10:00");
  });

  test("skips holidays", () => {
    const calendar = createBusinessCalendar(["2026-08-25"]);

    const start = DateTime.fromISO("2026-08-24T16:00:00", {
      zone: "Asia/Kolkata",
    });

    const result = addBusinessHours(start, 4, config, calendar);

    expect(result.toFormat("yyyy-MM-dd HH:mm")).toBe("2026-08-26 10:00");
  });
});
