import { DateTime } from "luxon";
import type { SlaState } from "../../generated/prisma/client";

export interface BusinessHoursConfig {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  timezone: string;
}

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  startHour: 8,
  startMinute: 0,
  endHour: 18,
  endMinute: 0,
  timezone: process.env.BUSINESS_TIMEZONE ?? "Asia/Kolkata",
};

export interface BusinessCalendar {
  holidays: ReadonlySet<string>;
}

export interface SlaProgress {
  state: SlaState;
  remainingBusinessHours: number;
}

export function createBusinessCalendar(
  holidayDates: readonly string[],
): BusinessCalendar {
  return {
    holidays: new Set(holidayDates),
  };
}

function dateKey(date: DateTime): string {
  return date.toISODate()!;
}

export function isBusinessDay(
  date: DateTime,
  calendar: BusinessCalendar,
): boolean {
  const weekday = date.weekday;

  if (weekday === 6 || weekday === 7) {
    return false;
  }

  return !calendar.holidays.has(dateKey(date));
}

export function nextBusinessDay(
  date: DateTime,
  calendar: BusinessCalendar,
): DateTime {
  let current = date.plus({ days: 1 }).startOf("day");

  while (!isBusinessDay(current, calendar)) {
    current = current.plus({ days: 1 });
  }

  return current;
}

export function normalizeToBusinessTime(
  input: DateTime,
  config: BusinessHoursConfig,
  calendar: BusinessCalendar,
): DateTime {
  let current = input;

  while (true) {
    if (!isBusinessDay(current, calendar)) {
      current = nextBusinessDay(current, calendar);
      continue;
    }

    const start = current.set({
      hour: config.startHour,
      minute: config.startMinute,
      second: 0,
      millisecond: 0,
    });

    const end = current.set({
      hour: config.endHour,
      minute: config.endMinute,
      second: 0,
      millisecond: 0,
    });

    if (current < start) {
      return start;
    }

    if (current >= end) {
      current = nextBusinessDay(current, calendar);
      continue;
    }

    return current;
  }
}

export function addBusinessHours(
  input: DateTime,
  hours: number,
  config: BusinessHoursConfig,
  calendar: BusinessCalendar,
): DateTime {
  if (hours < 0) {
    throw new Error("Business hours duration cannot be negative.");
  }

  if (hours === 0) {
    return normalizeToBusinessTime(input, config, calendar);
  }

  let current = normalizeToBusinessTime(input, config, calendar);

  let remainingMinutes = Math.round(hours * 60);

  while (remainingMinutes > 0) {
    const end = current.set({
      hour: config.endHour,
      minute: config.endMinute,
      second: 0,
      millisecond: 0,
    });

    const availableMinutes = Math.floor(end.diff(current, "minutes").minutes);

    if (remainingMinutes <= availableMinutes) {
      return current.plus({ minutes: remainingMinutes });
    }

    remainingMinutes -= availableMinutes;

    current = nextBusinessDay(current, calendar).set({
      hour: config.startHour,
      minute: config.startMinute,
      second: 0,
      millisecond: 0,
    });
  }

  return current;
}

export function businessMinutesBetween(
  startInput: DateTime,
  endInput: DateTime,
  config: BusinessHoursConfig,
  calendar: BusinessCalendar,
): number {
  if (endInput <= startInput) {
    return 0;
  }

  let current = normalizeToBusinessTime(startInput, config, calendar);

  let totalMinutes = 0;

  while (current < endInput) {
    if (!isBusinessDay(current, calendar)) {
      current = nextBusinessDay(current, calendar).set({
        hour: config.startHour,
        minute: config.startMinute,
        second: 0,
        millisecond: 0,
      });
      continue;
    }

    const endOfDay = current.set({
      hour: config.endHour,
      minute: config.endMinute,
      second: 0,
      millisecond: 0,
    });

    const segmentEnd = endInput < endOfDay ? endInput : endOfDay;

    if (segmentEnd > current) {
      totalMinutes += segmentEnd.diff(current, "minutes").minutes;
    }

    if (segmentEnd >= endInput) {
      break;
    }

    current = nextBusinessDay(current, calendar).set({
      hour: config.startHour,
      minute: config.startMinute,
      second: 0,
      millisecond: 0,
    });
  }

  return totalMinutes;
}

export function getSlaState(
  createdAt: Date,
  deadline: Date,
  now: Date,
  calendar: BusinessCalendar,
  config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS,
): SlaProgress {
  const created = DateTime.fromJSDate(createdAt, { zone: "utc" }).setZone(
    config.timezone,
  );

  const deadlineTime = DateTime.fromJSDate(deadline, {
    zone: "utc",
  }).setZone(config.timezone);

  const current = DateTime.fromJSDate(now, { zone: "utc" }).setZone(
    config.timezone,
  );

  if (current >= deadlineTime) {
    return {
      state: "BREACHED",
      remainingBusinessHours: 0,
    };
  }

  const totalMinutes = businessMinutesBetween(
    created,
    deadlineTime,
    config,
    calendar,
  );

  const elapsedMinutes = businessMinutesBetween(
    created,
    current,
    config,
    calendar,
  );

  const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes);

  const remainingRatio =
    totalMinutes === 0 ? 0 : remainingMinutes / totalMinutes;

  const state: SlaState =
    remainingRatio <= 0
      ? "BREACHED"
      : remainingRatio <= 0.2
        ? "AT_RISK"
        : "ON_TRACK";

  return {
    state,
    remainingBusinessHours: remainingMinutes / 60,
  };
}
