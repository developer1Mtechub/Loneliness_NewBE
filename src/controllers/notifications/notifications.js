import pool from "../../config/index.js";
import { update } from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import { paginate } from "../../utils/paginationUtils.js";
import {
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";
import { query } from "./util.js";

export const add = async (req, res) => {
  const sender_id = req.user.id;
  const { receiver_id, title, body, type } = req.body;
  try {
    const notification_data = {
      sender_id,
      receiver_id,
      title,
      body,
      type,
    };
    const result = await insert("notifications", notification_data);
    return sendSuccessResponse(res, result, "Notification added successfully!");
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const updateReadStatus = async (req, res) => {
  const { notification_id, read_status } = req.body;
  try {
    const result = await update(
      "notifications",
      { is_read: read_status },
      { id: notification_id }
    );
    return sendSuccessResponse(
      res,
      result,
      "Notification status updated successfully"
    );
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getAll = async (req, res) => {
  const user_id = req.user.id;
  // const user_id = 366; // Hard
  const { page = 1, limit = 20 } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const parsedLimit = parseInt(limit);

  try {
    // Construct the query manually to ensure correctness
    const result = await pool.query(
      `
      SELECT * FROM notifications
      WHERE receiver_id = $1::int
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [user_id, parsedLimit, offset]
    );

    return sendSuccessResponse(
      res,
      {
        data: result.rows,
        pagination: {
          current_page: page,
          per_page: limit,
          total: result.rowCount,
        },
      },
      "Notification retrieved successfully"
    );
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
