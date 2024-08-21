import { request } from "http";
import pool from "../config/index.js";
import logger from "../utils/logger.js";
import { releasePayment } from "../utils/payments.js";
import { getAll, getOne, insert, update } from "../utils/dbUtils.js";

export const releaseUnpaidRequests = async () => {
  try {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    console.log(fortyEightHoursAgo);

    const query = `
      SELECT * FROM users_request
      WHERE is_released = FALSE AND status = 'PAID' 
        AND (booking_date || ' ' || booking_time)::timestamp BETWEEN $1 AND $2 
        AND notification_sent = FALSE
    `;
    const { rows: requests } = await pool.query(query, [
      fortyEightHoursAgo,
      now,
    ]);

    for (const request of requests) {
      await releasePayment(request);
      await updateNotificationStatus(request.id);

      const update_transaction_data = { is_released: true };
      await update("transactions", update_transaction_data, {
        request_id: request.id,
      });
    }

    console.log(`Released ${requests.length} payments`);
  } catch (error) {
    logger.error(`Error releasing unpaid requests: ${error}`);
  }
};

export const checkOneHourLeftRequests = async () => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const query = `
      SELECT * FROM users_request
      WHERE is_released = FALSE AND status = 'PAID' AND notification_sent = FALSE
      AND booking_date + booking_time < $1 AND paid_at < $2
    `;
    const { rows: requests } = await pool.query(query, [oneHourFromNow, now]);

    for (const request of requests) {
      await releasePayment(request);
      await updateNotificationStatus(request.id);
    }

    console.log(`Checked ${requests.length} requests with 1 hour left`);
  } catch (error) {
    logger.error(`Error checking requests with 1 hour left: ${error}`);
  }
};

const updateNotificationStatus = async (request_id) => {
  try {
    await pool.query(
      `UPDATE users_request SET notification_sent = TRUE WHERE id = $1`,
      [request_id]
    );
    console.log(`Notification status updated for request ID: ${request_id}`);
  } catch (error) {
    logger.error(`Error updating notification status: ${error}`);
  }
};
