import {
  deleteAll,
  deleteOne,
  getAll,
  getOne,
  insert,
  update,
} from "../../utils/dbUtils.js";
import {
  sendBadRequestResponse,
  sendConflictResponse,
  sendCreatedResponse,
  sendNotFoundResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";
import logger from "../../utils/logger.js";
import { uploadToCloudinary } from "../../utils/cloudinaryUtils.js";
import { paginate } from "../../utils/paginationUtils.js";

export const addCategory = async (req, res) => {
  const { name } = req.body;

  if (!name || !req.file) {
    return sendBadRequestResponse(res, "Name and image are required");
  }

  const folderPath = `categories`;

  try {
    const image = await uploadToCloudinary(req.file, folderPath);
    if (image) {
      const category = await insert("categories", {
        name,
        image_url: image.secure_url,
        public_id: image.public_id,
      });
      logger.info(`category added successfully: ${JSON.stringify(category)}`);
      return sendCreatedResponse(res, category);
    }
  } catch (error) {
    if (error.code === "23505") {
      logger.warn(`Category with name ${name} already exists.`);
      return sendConflictResponse(res, [
        `Category with name ${name} already exists.`,
      ]);
    }
    logger.error(`Error adding Category: ${error.message}`);
    return sendServerErrorResponse(res);
  }
};

export const updateCategory = async (req, res) => {
  const { id, name } = req.body;

  if (!id || !name) {
    return sendBadRequestResponse(res, "ID, Name and image are required");
  }

  const folderPath = `categories`;

  try {
    const category = await getOne("categories", { id });
    let result;
    if (req.file) {
      const image = await uploadToCloudinary(req.file, folderPath);
      result = await update(
        "categories",
        { name, image_url: image.secure_url, public_id: image.public_id },
        { id }
      );
    } else {
      result = await update(
        "categories",
        { name, image_url: category.image_url, public_id: category.public_id },
        { id }
      );
    }

    if (!result) {
      logger.warn(`Category with id ${id} not found`);
      return sendNotFoundResponse(res, "Record not found");
    }

    logger.info(`Category updated successfully: ${JSON.stringify(result)}`);
    return sendSuccessResponse(res, result, "Category updated successfully");
  } catch (error) {
    if (error.code === "23505") {
      logger.warn(`Category with name ${name} already exists.`);
      return sendConflictResponse(res, [
        `Category with name ${name} already exists.`,
      ]);
    }
    logger.error(`Error updating Category: ${error.message}`);
    return sendServerErrorResponse(res);
  }
};

export const getCategory = async (req, res) => {
  try {
    const categories = await getOne("categories", { id: req.params.id });
    if (!categories) {
      return sendNotFoundResponse(res, "Category not found");
    }
    logger.info(`Category retrieved successfully`);
    return sendSuccessResponse(
      res,
      categories,
      "Category retrieved successfully"
    );
  } catch (error) {
    logger.error(`Error getting categories: ${error.message}`);
    return sendServerErrorResponse(res);
  }
};

export const getAllCategory = async (req, res) => {
  const page = parseInt(req.params.page, 10) || 1;
  const limit = parseInt(req.params.limit, 10) || 10;
  try {
    const query = `SELECT * FROM categories ORDER BY updated_at DESC`;
    // const categories = await getAll("categories");
    const result = await paginate(query, [], page, limit);
    logger.info(`Category retrieved successfully`);
    return sendSuccessResponse(res, result, "Category retrieved successfully");
  } catch (error) {
    logger.error(`Error getting categories: ${error.message}`);
    return sendServerErrorResponse(res);
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCategory = await deleteOne("categories", { id });

    if (!deletedCategory) {
      return sendNotFoundResponse(res, "Category not found");
    }

    return sendSuccessResponse(
      res,
      deletedCategory,
      "Category deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting Category:", error);
    return sendServerErrorResponse(res);
  }
};

export const deleteAllCategory = async (req, res) => {
  try {
    const deletedCategory = await deleteAll("categories");
    return sendSuccessResponse(
      res,
      deletedCategory,
      "All categories deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting categories:", error);
    return sendServerErrorResponse(res);
  }
};
