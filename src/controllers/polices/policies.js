import pool from "../../config/index.js";
import { getOne } from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import {
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";

export const togglePolicies = async (req, res) => {
  const { content, type } = req.body;

  try {
    const upsertQuery = `
            INSERT INTO policies (content, type)
            VALUES ($1, $2)
            ON CONFLICT (type) 
            DO UPDATE SET content = EXCLUDED.content
            RETURNING *;
        `;
    const result = await pool.query(upsertQuery, [content, type]);
    return sendSuccessResponse(
      res,
      result.rows[0],
      "Polices added or updated successfully!"
    );
  } catch (error) {
    logger.error(`Error in add or update the policies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getPolicies = async (req, res) => {
  const type = req.params.type;
  
console.log(type.toUpperCase());
  try {
    const result = await getOne("policies", { type: type.toUpperCase() });
    return sendSuccessResponse(res, result, "Polices retrieved successfully!");
  } catch (error) {
    logger.error(`Error in retrieving the policies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
