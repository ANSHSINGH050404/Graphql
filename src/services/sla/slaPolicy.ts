import type { Priority } from "../../generated/prisma/client";
import { DateTime } from "luxon";
import {
  addBusinessHours,
  DEFAULT_BUSINESS_HOURS,
  type BusinessCalendar,
  type BusinessHoursConfig,
} from "./businessHours";

export interface SlaPolicy {
  responseHours: number;
  resolutionHours: number;
}

export interface SlaDeadlines {
  responseDeadline: Date;
  resolutionDeadline: Date;
}

export const SLA_POLICIES: Record<
  Priority,
  SlaPolicy
> = {
  URGENT: {
    responseHours: 1,
    resolutionHours: 4,
  },

  HIGH: {
    responseHours: 2,
    resolutionHours: 8,
  },

  MEDIUM: {
    responseHours: 4,
    resolutionHours: 16,
  },

  LOW: {
    responseHours: 8,
    resolutionHours: 32,
  },
};

export function calculateSlaDeadlines(
  createdAt: Date,
  priority: Priority,
  calendar: BusinessCalendar,
  config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS,
): SlaDeadlines {
  const policy = SLA_POLICIES[priority];

  const created = DateTime.fromJSDate(
    createdAt,
    { zone: "utc" },
  ).setZone(config.timezone);

  const responseDeadline = addBusinessHours(
    created,
    policy.responseHours,
    config,
    calendar,
  );

  const resolutionDeadline = addBusinessHours(
    created,
    policy.resolutionHours,
    config,
    calendar,
  );

  return {
    responseDeadline: responseDeadline.toUTC().toJSDate(),
    resolutionDeadline: resolutionDeadline.toUTC().toJSDate(),
  };
}