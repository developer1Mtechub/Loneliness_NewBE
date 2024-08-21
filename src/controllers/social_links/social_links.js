import pool from "../../config/index.js";
import { deleteOne, getAll } from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import { add_social_links } from "../../utils/query.js";
import {
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";

export const addLinks = async (req, res) => {
  const { link, platform } = req.body;
  try {
    const result = await pool.query(add_social_links, [platform, link]);
    return sendSuccessResponse(
      res,
      result.rows[0],
      `Link added/updated successfully!`
    );
  } catch (error) {
    logger.error(`Error adding social links: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getAllLinks = async (req, res) => {
  try {
    const result = await getAll("social_links");
    return sendSuccessResponse(res, result, `Social Links successfully!`);
  } catch (error) {
    logger.error(`Error retrieving social links: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const deleteLink = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await deleteOne("social_links", { id });
    return sendSuccessResponse(res, result, `Social Links successfully!`);
  } catch (error) {
    logger.error(`Error retrieving social links: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
