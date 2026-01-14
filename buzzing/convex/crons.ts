import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Backup cleanup: delete messages older than 24 hours every hour
// This catches any messages where scheduled deletion failed
crons.hourly(
  "cleanup old chat messages",
  { minuteUTC: 0 },
  internal.chatMessages.cleanupOldMessages
);

export default crons;
