import pool from "../../config/index.js";
import { getAll, insert, update } from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import {
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";

export const toggleCommission = async (req, res) => {
  const { per_hour_rate } = req.body;
  try {
    const exist_record = await pool.query("SELECT * FROM commission");
    let result, message;
    if (exist_record.rowCount > 0) {
      result = await update(
        "commission",
        { per_hour_rate },
        { id: exist_record?.rows[0].id }
      );
      message = "Commission updated successfully!";
    } else {
      result = await insert("commission", {
        per_hour_rate: per_hour_rate,
      });
      message = "Commission created successfully!";
    }
    return sendSuccessResponse(res, result, message);
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const get = async (req, res) => {
  try {
    const result = await getAll("commission");
    return sendSuccessResponse(
      res,
      result[0],
      "Commission retrieved successfully!"
    );
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
