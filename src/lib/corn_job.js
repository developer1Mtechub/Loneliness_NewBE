import cron from "node-cron";
import { checkOneHourLeftRequests, releaseUnpaidRequests } from "../jobs/release_unpaid_request.js";

// running every hour
cron.schedule("0 * * * * *", () => {
  releaseUnpaidRequests();
  console.log("Running scheduled job for 48 hours: releaseUnpaidRequests");
});

// running every hour
cron.schedule("0 * * * *", () => {
  checkOneHourLeftRequests();
  console.log("Running scheduled job to check requests with 1 hour left: checkOneHourLeftRequests");
});
