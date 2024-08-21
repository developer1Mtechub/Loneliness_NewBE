import { uploadToCloudinary } from "../../utils/cloudinaryUtils.js";
import {
  deleteOne,
  getAll,
  getOne,
  getTotalCount,
  insert,
  update,
} from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import {
  sendConflictResponse,
  sendNotFoundResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";
import {
  getAllUsersHelper,
  getBlockList,
  getLikesHelper,
  getNearBy,
  getUsersHelper,
  updateUserCategories,
  updateUserImages,
  updateUserLocation,
  updateUserProfileDetails,
  getBlockListUsersHelper,
  getReportedBuddies,
  getReportedUsers,
  getAllDeletedUsersHelper,
} from "./utils.js";
import { paginate } from "../../utils/paginationUtils.js";
import { handleNotification } from "../../utils/notificationHelper.js";
import pool from "../../config/index.js";
import {
  handleContactsUpdate,
  updateContactStatus,
} from "../../utils/chatHelper.js";
import { getMessagesBetweenUsers } from "../../utils/chat.js";
import { sendNotification } from "../../server.js";

export const getContactsOfUser = async (req, res) => {
  // get Contacts of user by user id
  const userId = req.body.user_id;
  try {
    // const contacts = await pool.query('SELECT * FROM contacts WHERE user_id = $1', [userId]);
    // res.json(contacts.rows);
    //   const query = `
    //   SELECT contacts.*, users.*
    //   FROM contacts
    //   JOIN users ON contacts.user_id = users.id
    //   WHERE contacts.user_id = $1
    // `;
    // const contacts = await pool.query(query, [userId]);
    // res.json(contacts.rows);
    const contacts = await handleContactsUpdate(userId);
    // res.json(contacts);

    res.json(contacts);
  } catch (error) {
    console.error(error.message);
    logger.error(`Error getting contacts: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
export const updateContactStatusByUserId = async (req, res) => {
  // get Contacts of user by user id
  const userId = req.body.user_id;
  const status = req.body.status;

  try {
    const contacts = await updateContactStatus(userId, status);
    // res.json(contacts);

    res.json(contacts);
    if (contacts === true) {
      return sendSuccessResponse(
        res,
        userResult,
        "User online status successfully"
      );
    }
  } catch (error) {
    console.error(error.message);
    logger.error(`Error getting contacts: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

// const getUserMessages
export const getMessagesUsers = async (req, res) => {
  // get Contacts of user by user id
  const userId = req.body.user_id;
  const contactId = req.body.contactId;

  try {
    const messages = await getMessagesBetweenUsers(userId, contactId);
    // res.json(contacts);
    console.log(messages);
    res.json(messages);
    //  if(contacts===true){
    //   return sendSuccessResponse(
    //    res,
    //    "User online status successfully"
    //  );
    //  }
  } catch (error) {
    console.error(error.message);
    logger.error(`Error getting contacts: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
// get chat list count
export const getChatListCount = async (req, res) => {
  const userId = req.body.user_id;
  try {
    const messages = await emitUnreadChatsCount(userId);
    // res.json(contacts);
    console.log(messages);
    res.json(messages);
    //  if(contacts===true){
    //   return sendSuccessResponse(
    //    res,
    //    "User online status successfully"
    //  );
    //  }
  } catch (error) {
    console.error(error.message);
    logger.error(`Error getting contacts: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
export const uploadImageInChat = async (req, res) => {
  try {
    const files = req.files;
    if (files && files.length > 0) {
      const folderPath = `user_profiles`;
      const images = await uploadToCloudinary(files, folderPath);

      // Return the URLs of the uploaded images
      const imageUrls = images.map((image) => image.secure_url);
      res.status(200).json({ imageUrls });
    } else {
      res.status(400).json({ message: "No files uploaded" });
    }
  } catch (error) {
    console.error("Error uploading images:", error);
    res
      .status(500)
      .json({ message: "Failed to upload images", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const user_id = req.user.id;
  const {
    full_name,
    about,
    dob,
    gender,
    looking_for_gender,
    phone_country_code,
    phone_number,
    languages,
    category_ids,
    latitude,
    longitude,
    address,
    country,
    state,
    postal_code,
    city,
    height_ft,
    height_in,
    weight,
    weight_unit,
    hourly_rate,
  } = req.body;

  const files = req.files;

  try {
    // Check if the user exists
    const user = await getOne("users", { id: user_id });
    if (!user) {
      return sendNotFoundResponse(res, "User not found");
    }
    if (files && files.length > 0) {
      const folderPath = `user_profiles`;
      const images = await uploadToCloudinary(files, folderPath);

      // Update or insert user images
      await updateUserImages(user_id, images);
    }

    // Update user profile details
    const profileData = {};
    if (full_name !== undefined) profileData.full_name = full_name;
    if (about !== undefined) profileData.about = about;
    if (dob !== undefined) profileData.dob = dob;
    if (languages !== undefined) profileData.languages = languages;
    if (gender !== undefined) profileData.gender = gender;
    if (looking_for_gender !== undefined)
      profileData.looking_for_gender = looking_for_gender;
    if (phone_country_code !== undefined)
      profileData.phone_country_code = phone_country_code;
    if (phone_number !== undefined) profileData.phone_number = phone_number;
    if (height_ft) profileData.height_ft = parseInt(height_ft);
    if (height_in) profileData.height_in = parseInt(height_in);
    if (weight) profileData.weight = parseFloat(weight);
    if (weight_unit) profileData.weight_unit = weight_unit;
    if (hourly_rate !== undefined)
      profileData.hourly_rate = parseFloat(hourly_rate);
    console.log(user_id, profileData);
    const userResult = await updateUserProfileDetails(user_id, profileData);
    let parsedCategoryIds;
    if (category_ids) {
      parsedCategoryIds = Array.isArray(category_ids)
        ? category_ids
        : JSON.parse(category_ids);

      await updateUserCategories(user_id, parsedCategoryIds);
    }

    const locationData = {};
    if (latitude !== undefined && longitude !== undefined) {
      locationData.location = `SRID=4326;POINT(${longitude} ${latitude})`;
    }
    if (address !== undefined) locationData.address = address;
    if (country !== undefined) locationData.country = country;
    if (state !== undefined) locationData.state = state;
    if (postal_code !== undefined) locationData.postal_code = postal_code;
    if (city !== undefined) locationData.city = city;
    if (Object.keys(locationData).length > 0) {
      locationData.updated_at = new Date();
      await updateUserLocation(user_id, locationData);
    }

    logger.info(`User profile updated: ${user_id}`);
    return sendSuccessResponse(
      res,
      userResult,
      "User profile updated successfully"
    );
  } catch (error) {
    logger.error(`Error updating user profile: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

// TODO: If user block the buddy don't show that buddy to user

export const getNearbyBuddies = async (req, res) => {
  const { latitude, longitude, distance, page = 1, limit = 10 } = req.query;
  const user_id = req.user.id;

  try {
    const result = await getNearBy(
      latitude,
      longitude,
      distance,
      parseInt(page),
      parseInt(limit),
      user_id
    );
    return sendSuccessResponse(
      res,
      result,
      "Nearby users retrieved successfully"
    );
  } catch (error) {
    logger.error(`Error retrieving nearby users: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const likeBuddy = async (req, res) => {
  const { buddy_id, like_status } = req.body;
  const user_id = req.user.id;

  try {
    // Check if the user already liked the buddy
    const existingRecord = await getOne("buddy_likes", { user_id, buddy_id });

    let result;
    if (existingRecord) {
      result = await update(
        "buddy_likes",
        { is_liked: like_status },
        { user_id, buddy_id }
      );

      return sendSuccessResponse(res, result, "Buddy disliked successfully");
    } else {
      result = await insert("buddy_likes", {
        user_id,
        buddy_id,
        is_liked: like_status,
      });

      return sendSuccessResponse(
        res,
        result,
        `Buddy ${like_status ? "like" : "dislike"} successfully`
      );
    }
  } catch (error) {
    logger.error(`Error liking/disliking buddy: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
export const userActions = async (req, res) => {
  const { buddy_id, type, reason } = req.body;
  const user_id = req.user.id;

  try {
    const existingRecord = await getOne("user_actions", {
      user_id,
      buddy_id,
      type: type,
    });

    if (existingRecord && type === "REPORT") {
      return sendConflictResponse(res, [`Report already exists`]);
    }

    let result;
    if (existingRecord && type !== "REPORT") {
      result = await deleteOne("user_actions", {
        user_id,
        buddy_id,
        type: type,
      });

      return sendSuccessResponse(res, result, `Buddy UNBLOCK successfully`);
    } else {
      let insertedData;
      if (type === "REPORT") {
        insertedData = { user_id, buddy_id, type, reason };
      } else {
        insertedData = { user_id, buddy_id, type };
      }
      result = await insert("user_actions", insertedData);
      console.log("type");
      console.log(type);

      return sendSuccessResponse(res, result, `Buddy ${type} successfully`);
    }
  } catch (error) {
    logger.error(`Error user actions on buddy: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
export const buddyActions = async (req, res) => {
  const { user_id, type, reason } = req.body;
  const buddy_id = req.user.id;

  try {
    const existingRecord = await getOne("buddy_actions", {
      user_id,
      buddy_id,
      type: type,
    });

    if (existingRecord && type === "REPORT") {
      return sendConflictResponse(res, [`Report already exists`]);
    }

    let result;
    if (existingRecord && type !== "REPORT") {
      result = await deleteOne("buddy_actions", {
        user_id,
        buddy_id,
        type: type,
      });

      return sendSuccessResponse(res, result, `user UNBLOCK successfully`);
    } else {
      let insertedData;
      if (type === "REPORT") {
        insertedData = { user_id, buddy_id, type, reason };
      } else {
        insertedData = { user_id, buddy_id, type };
      }
      result = await insert("buddy_actions", insertedData);

      return sendSuccessResponse(res, result, `user ${type} successfully`);
    }
  } catch (error) {
    logger.error(`Error user actions on buddy: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
export const getBlockedBuddies = async (req, res) => {
  const user_id = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  try {
    const result = await getBlockList(user_id, parseInt(page), parseInt(limit));
    return sendSuccessResponse(res, result, `Buddy UNBLOCK successfully`);
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
export const getBlockedUsers = async (req, res) => {
  const user_id = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  try {
    const result = await getBlockListUsersHelper(
      user_id,
      parseInt(page),
      parseInt(limit)
    );
    return sendSuccessResponse(
      res,
      result,
      `User Block list retrieved successfully`
    );
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const requestToReleasePayment = async (req, res) => {
  const buddy_id = req.user.id;
  const { request_id } = req.body;
  try {
    const request = await getOne("users_request", { id: request_id });
    if (!request) {
      return sendNotFoundResponse(res, "Request not found");
    }
    const user = await getOne("users", { id: request.user_id });
    const buddy_profile = await getOne("user_profiles", {
      user_id: request.user_id,
    });
    const result = await update(
      "users_request",
      { release_payment_requests: "REQUESTED" },
      { id: request_id }
    );
    // Notification content
    const title = `Release Payment Request`;
    const body = `You have got the release payment request by ${buddy_profile.full_name}.`;
    const type = "SERVICES";
    const data = {
      receiver_id: request.user_id,
      sender_id: buddy_id,
      request_id: request_id,
      type,
    };

    // stringify the data object
    // const data = JSON.stringify(data1);
    const device_token = user.device_token;
    console.log(device_token);
    await sendNotification(device_token, title, body, data);
    // await handleNotification(
    //   buddy_id,
    //   request.user_id,
    //   user,
    //   title,
    //   body,
    //   type
    // );
    return sendSuccessResponse(
      res,
      result,
      `Payment release request submitted successfully`
    );
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getAllUsers = async (req, res) => {
  const user_id = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  try {
    const result = await getAllUsersHelper(
      "USER",
      parseInt(page),
      parseInt(limit)
    );
    return sendSuccessResponse(res, result, `Users retrieved successfully`);
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getAllBuddies = async (req, res) => {
  const user_id = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  try {
    const result = await getAllUsersHelper(
      "BUDDY",
      parseInt(page),
      parseInt(limit)
    );
    return sendSuccessResponse(res, result, `Users retrieved successfully`);
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getUser = async (req, res) => {
  const user_id = req.params.id;
  try {
    const user = await getOne("users", { id: user_id });
    if (!user) {
      return sendNotFoundResponse(res, "User not found");
    }
    const result = await getUsersHelper(user_id);
    return sendSuccessResponse(res, result, `Users retrieved successfully`);
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getTotalLikes = async (req, res) => {
  const buddy_id = req.user.id;
  const { latitude, longitude, page = 1, limit = 10 } = req.query;
  console.log(latitude, longitude);
  try {
    const result = await getLikesHelper(
      buddy_id,
      latitude,
      longitude,
      parseInt(page),
      parseInt(limit)
    );
    return sendSuccessResponse(
      res,
      result,
      `Likes records retrieved successfully`
    );
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const deleteUserPermanently = async (req, res) => {
  const { user_id } = req.body;
  try {
    const result = await deleteOne("users", { id: user_id });
    if (!result) {
      return sendNotFoundResponse(res, "User Already deleted");
    }
    return sendSuccessResponse(res, result, `User deleted successfully`);
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const deleteUser = async (req, res) => {
  const user_id = req.user.id;
  console.log(user_id);
  try {
    const deletionTime = new Date().toISOString();
    const result = await update(
      "users",
      { is_deleted: true, deleted_at: deletionTime },
      { id: user_id }
    );

    return sendSuccessResponse(res, result, `User deleted successfully`);
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const applyFilters = async (req, res) => {
  const {
    min_age,
    max_age,
    gender,
    top_liked_profile,
    top_rated_profile,
    height_ft,
    height_in,
    weight,
    city,
    language,
    latitude,
    longitude,
    distance,
    category_id,
    page = 1,
    limit = 20,
  } = req.query;

  try {
    const queryParams = [];
    let paramIndex = 1;

    let query = `
      WITH buddy_details AS (
        SELECT 
          u.id, 
          u.email, 
          up.full_name, 
          up.dob, 
          up.gender, 
          up.height_ft, 
          up.height_in, 
          up.weight,
          ul.city, 
          up.languages, 
          bl.like_count, 
          rt.avg_rating,
          ul.location,
          ST_Distance(ul.location, ST_SetSRID(ST_MakePoint($${paramIndex++}, $${paramIndex++}), 4326)::geography) as distance
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN user_locations ul ON u.id = ul.user_id
        LEFT JOIN (
          SELECT buddy_id, COUNT(*) as like_count
          FROM buddy_likes
          GROUP BY buddy_id
        ) bl ON u.id = bl.buddy_id
        LEFT JOIN (
          SELECT request_id, AVG(stars) as avg_rating
          FROM rating
          GROUP BY request_id
        ) rt ON u.id = rt.request_id
        JOIN roles r ON u.role_id = r.id
        WHERE r.name = 'BUDDY'
      ),
      images AS (
        SELECT 
          ui.user_id,
          ARRAY_AGG(ui.image_url) AS image_urls
        FROM user_images ui
        GROUP BY ui.user_id
      ),
      categories AS (
        SELECT 
          uc.user_id,
          JSON_AGG(json_build_object('id', c.id, 'name', c.name, 'image_url', c.image_url)) AS categories
        FROM user_categories uc
        LEFT JOIN categories c ON uc.category_id = c.id
        GROUP BY uc.user_id
      )
      SELECT 
        bd.id, 
        bd.email, 
        bd.full_name, 
        bd.dob, 
        bd.gender, 
        bd.height_ft, 
        bd.height_in, 
        bd.weight, 
        bd.city, 
        bd.languages, 
        bd.like_count, 
        bd.avg_rating, 
        bd.distance, 
        bd.location,
        img.image_urls, 
        cat.categories
      FROM buddy_details bd
      LEFT JOIN images img ON bd.id = img.user_id
      LEFT JOIN categories cat ON bd.id = cat.user_id
      WHERE 1=1
    `;

    queryParams.push(latitude, longitude);

    if (min_age) {
      query += ` AND EXTRACT(YEAR FROM AGE(bd.dob)) >= $${paramIndex++}`;
      queryParams.push(min_age);
    }

    if (max_age) {
      query += ` AND EXTRACT(YEAR FROM AGE(bd.dob)) <= $${paramIndex++}`;
      queryParams.push(max_age);
    }

    if (gender) {
      query += ` AND bd.gender = $${paramIndex++}`;
      queryParams.push(gender);
    }

    if (top_liked_profile) {
      query += ` AND bd.like_count IS NOT NULL`;
    }

    if (top_rated_profile) {
      query += ` AND bd.avg_rating IS NOT NULL`;
    }

    if (height_ft) {
      query += ` AND bd.height_ft = $${paramIndex++}`;
      queryParams.push(height_ft);
    }

    if (height_in) {
      query += ` AND bd.height_in = $${paramIndex++}`;
      queryParams.push(height_in);
    }

    if (weight) {
      query += ` AND bd.weight = $${paramIndex++}`;
      queryParams.push(weight);
    }

    if (city) {
      query += ` AND bd.city = $${paramIndex++}`;
      queryParams.push(city);
    }

    if (language) {
      query += ` AND bd.languages @> $${paramIndex++}::jsonb`;
      queryParams.push(`["${language}"]`);
    }

    if (category_id) {
      query += ` AND EXISTS (
        SELECT 1
        FROM user_categories uc
        WHERE uc.user_id = bd.id AND uc.category_id = $${paramIndex++}
      )`;
      queryParams.push(category_id);
    }

    if (latitude && longitude && distance) {
      query += ` AND ST_DWithin(bd.location, ST_SetSRID(ST_MakePoint($${paramIndex++}, $${paramIndex++}), 4326)::geography, $${paramIndex++})`;
      queryParams.push(latitude, longitude, distance);
    }

    if (top_liked_profile) {
      query += ` ORDER BY bd.like_count DESC`;
    } else if (top_rated_profile) {
      query += ` ORDER BY bd.avg_rating DESC`;
    }

    const result = await paginate(
      query,
      queryParams,
      parseInt(page),
      parseInt(limit)
    );

    return sendSuccessResponse(
      res,
      result,
      "Filtered results retrieved successfully"
    );
  } catch (error) {
    logger.error(`Error applying filters: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const blockUser = async (req, res) => {
  const { user_id, is_block } = req.body;
  try {
    const result = await update("users", { is_block }, { id: user_id });
    return sendSuccessResponse(
      res,
      result,
      `User ${is_block ? "Block" : "Unblock"} successfully`
    );
  } catch (error) {
    console.log(error);
    logger.error(`Error block user: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const reportedBuddies = async (req, res) => {
  const page = parseInt(req.params.page, 10) || 1;
  const limit = parseInt(req.params.limit, 10) || 50;
  try {
    const result = await getReportedBuddies(page, limit);
    return sendSuccessResponse(
      res,
      result,
      `Buddies reported retrieved successfully`
    );
  } catch (error) {
    logger.error(`Error block user: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
export const reportedUsers = async (req, res) => {
  const page = parseInt(req.params.page, 10) || 1;
  const limit = parseInt(req.params.limit, 10) || 50;
  try {
    const result = await getReportedUsers(page, limit);
    return sendSuccessResponse(
      res,
      result,
      `Users reported retrieve successfully`
    );
  } catch (error) {
    logger.error(`Error block user: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getAllDeletedUsers = async (req, res) => {
  const role = req.query.role || "USER";
  const { page = 1, limit = 10 } = req.query;
  try {
    const result = await getAllDeletedUsersHelper(
      role,
      parseInt(page),
      parseInt(limit)
    );
    return sendSuccessResponse(res, result, `Users retrieved successfully`);
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
