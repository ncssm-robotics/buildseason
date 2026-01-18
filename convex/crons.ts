import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Daily birthday check.
 * Runs at 9:00 AM UTC daily to check for team members with birthdays
 * and send personalized messages to their team's Discord channels.
 */
crons.daily(
  "send-birthday-messages",
  { hourUTC: 9, minuteUTC: 0 },
  internal.birthdays.sendBirthdayMessages
);

export default crons;
