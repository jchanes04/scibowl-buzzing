import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily cleanup: delete messages older than 24 hours
// Runs once per day to clean up old chat messages
crons.daily(
  "cleanup old chat messages",
  { hourUTC: 0, minuteUTC: 0 },
  internal.chatMessages.cleanupOldMessages
);

export default crons;
