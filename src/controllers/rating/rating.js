import {
  deleteAll,
  deleteOne,
  getAll,
  getOne,
  insert,
  update,
} from "../../utils/dbUtils.js";
import {
  sendConflictResponse,
  sendCreatedResponse,
  sendNotFoundResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";
import logger from "../../utils/logger.js";
import { paginate } from "../../utils/paginationUtils.js";
import { handleNotification } from "../../utils/notificationHelper.js";
import pool from "../../config/index.js";
import { sendNotification } from "../../server.js";

export const addRating = async (req, res) => {
  const user_id = req.user.id;
  const { request_id, buddy_id, stars, comment } = req.body;
  try {
    const requestExist = await getOne("users_request", {
      id: request_id,
      user_id,
    });
    if (!requestExist) {
      return sendNotFoundResponse(
        res,
        "Request not found or service is not taken by this user"
      );
    }

    const buddy = await getOne("users", { id: requestExist.buddy_id });
    const user_profile = await getOne("user_profiles", { user_id });
    const ratingExists = await getOne("rating", {
      request_id,
    });

    if (ratingExists) {
      return sendNotFoundResponse(res, "Already given the rating.");
    }
    // Notification content
    const title = `NEW REVIEW`;
    const body = `You have got a new request by ${user_profile.full_name}.`;
    const type = "REVIEW";
    // await handleNotification(
    //   user_id,
    //   requestExist.buddy_id,
    //   buddy,
    //   title,
    //   body,
    //   type
    // );
    const data2 = {
      sender_id: user_id,
      receiver_id: requestExist.buddy_id,
      request_id: request_id,
      type,
    };

    // stringify the data object
    // const data = JSON.stringify(data1);
    const device_token2 = buddy.device_token;
    console.log(device_token2);
    await sendNotification(device_token2, title, body, data2);

    const data = { request_id, stars, comment, buddy_id, user_id };
    const result = await insert("rating", data);
    return sendCreatedResponse(res, result);
  } catch (error) {
    console.log(error);
    logger.error(`Error adding rating: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const updateRating = async (req, res) => {
  const { id, request_id, stars, comment, buddy_id } = req.body;

  try {
    const data = { request_id, stars, comment, buddy_id };
    const updatedRating = await update("rating", data, { id });

    if (!updatedRating) {
      return sendNotFoundResponse(res, "Record not found");
    }

    logger.info(
      `Rating updated successfully: ${JSON.stringify(updatedRating)}`
    );
    return sendSuccessResponse(res, updatedRating, "Role updated successfully");
  } catch (error) {
    console.log(error);
    logger.error(`Error updating role: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getRatingByRequest = async (req, res) => {
  const { request_id } = req.params;
  try {
    const rating = await getOne("rating", { request_id });
    if (!rating) {
      return sendNotFoundResponse(res, "No rating found");
    }
    console.log(rating);
    return sendSuccessResponse(res, rating, "Rating retrieved successfully");
  } catch (error) {
    logger.error(`Error getting rating: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getAllRatingsForBuddy = async (req, res) => {
  const buddy_id = req.params.id;
  const { page = 1, limit = 10 } = req.query;

  // Query to fetch ratings with buddy's full name and image URL
  const query = `
    SELECT r.*, up.full_name, ui.image_url
    FROM rating r
    LEFT JOIN user_profiles up ON r.user_id = up.user_id
    LEFT JOIN user_images ui ON r.user_id = ui.user_id
    WHERE r.buddy_id = $1
    ORDER BY r.created_at DESC
  `;

  try {
    const params = [buddy_id];
    const ratings = await paginate(
      query,
      params,
      parseInt(page),
      parseInt(limit)
    );

    // Query to calculate average rating for the buddy
    const avgQuery = `
      SELECT COALESCE(AVG(stars), 0) AS avg_rating
      FROM rating
      WHERE request_id IN (SELECT id FROM users_request WHERE buddy_id = $1)
    `;
    const avgParams = [buddy_id];
    const avgResult = await pool.query(avgQuery, avgParams);
    const avgRating = avgResult.rows[0]?.avg_rating || 0;

    // Combine average rating with the paginated ratings
    const response = {
      avg_rating: avgRating,
      ratings: ratings,
    };

    return sendSuccessResponse(res, response, "Ratings retrieved successfully");
  } catch (error) {
    console.error(`Error getting ratings for buddy ID ${buddy_id}:`, error);
    return sendServerErrorResponse(res, "Failed to retrieve ratings");
  }
};
