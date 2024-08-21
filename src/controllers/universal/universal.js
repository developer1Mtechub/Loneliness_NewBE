import {
  deleteAll,
  deleteOne,
  getAll,
  getOne,
  getTotalCount,
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
import pool from "../../config/index.js";
import { paginate } from "../../utils/paginationUtils.js";

export const addRole = async (req, res) => {
  const { name } = req.body;
  try {
    const role = await insert("roles", { name });
    logger.info(`Role added successfully: ${JSON.stringify(role)}`);
    return sendCreatedResponse(res, role);
  } catch (error) {
    if (error.code === "23505") {
      logger.warn(`Role with name ${name} already exists.`);
      return sendConflictResponse(res, [
        `Role with name ${name} already exists.`,
      ]);
    }
    logger.error(`Error adding role: ${error.message}`);
    return sendServerErrorResponse(res);
  }
};

export const updateRole = async (req, res) => {
  const { id, name } = req.body;

  try {
    const updatedRole = await update("roles", { name }, { id });

    if (!updatedRole) {
      logger.warn(`Role with id ${id} not found`);
      return sendNotFoundResponse(res, "Record not found");
    }

    logger.info(`Role updated successfully: ${JSON.stringify(updatedRole)}`);
    return sendSuccessResponse(res, updatedRole, "Role updated successfully");
  } catch (error) {
    if (error.code === "23505") {
      logger.warn(`Role with name ${name} already exists.`);
      return sendConflictResponse(res, [
        `Role with name ${name} already exists.`,
      ]);
    }
    logger.error(`Error updating role: ${error.message}`);
    return sendServerErrorResponse(res);
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const roles = await getAll("roles");
    logger.info(`Roles retrieved successfully`);
    return sendSuccessResponse(res, roles, "Roles retrieved successfully");
  } catch (error) {
    logger.error(`Error getting roles: ${error.message}`);
    return sendServerErrorResponse(res);
  }
};

export const deleteRole = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRole = await deleteOne("roles", { id });

    if (!deletedRole) {
      return sendNotFoundResponse(res, "Role not found");
    }

    return sendSuccessResponse(res, deletedRole, "Role deleted successfully");
  } catch (error) {
    console.error("Error deleting role:", error);
    return sendServerErrorResponse(res);
  }
};

export const deleteAllRoles = async (req, res) => {
  try {
    const deletedRoles = await deleteAll("roles");
    return sendSuccessResponse(
      res,
      deletedRoles,
      "All roles deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting roles:", error);
    return sendServerErrorResponse(res);
  }
};

export const getAllCountriesWIthPhoneCode = async (req, res) => {
  try {
    const countries = await getAll("countries");
    logger.info(`countries retrieved successfully`);
    return sendSuccessResponse(
      res,
      countries,
      "countries retrieved successfully"
    );
  } catch (error) {
    console.error("Error Retrieving countries:", error);
    return sendServerErrorResponse(res);
  }
};

export const getAllLanguages = async (req, res) => {
  try {
    const countries = await getAll("languages");
    logger.info(`languages retrieved successfully`);
    return sendSuccessResponse(
      res,
      countries,
      "languages retrieved successfully"
    );
  } catch (error) {
    console.error("Error Retrieving languages:", error);
    return sendServerErrorResponse(res);
  }
};

export const getTotals = async (req, res) => {
  try {
    const buddy_role = await getOne("roles", { name: "BUDDY" });
    const user_role = await getOne("roles", { name: "USER" });

    const buddy_count = await getTotalCount("users", {
      role_id: buddy_role.id,
    });
    const users_count = await getTotalCount("users", { role_id: user_role.id });

    return sendSuccessResponse(
      res,
      { buddy_count, users_count },
      "counts retrieved successfully"
    );
  } catch (error) {
    console.error("Error Retrieving languages:", error);
    return sendServerErrorResponse(res);
  }
};

export const monthlyAdminTransactions = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        EXTRACT(YEAR FROM created_at) AS year,
        EXTRACT(MONTH FROM created_at) AS month,
        SUM(amount) AS total_amount
      FROM admin_transactions
      GROUP BY year, month
      ORDER BY year, month;`
    );
    return sendSuccessResponse(
      res,
      rows,
      "transactions retrieved successfully"
    );
  } catch (error) {
    console.error("Error Retrieving languages:", error);
    return sendServerErrorResponse(res);
  }
};
export const yearlyAdminTransactions = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        EXTRACT(YEAR FROM created_at) AS year,
        SUM(amount) AS total_amount
      FROM admin_transactions
      GROUP BY year
      ORDER BY year;`
    );
    return sendSuccessResponse(
      res,
      rows,
      "transactions retrieved successfully"
    );
  } catch (error) {
    console.error("Error Retrieving languages:", error);
    return sendServerErrorResponse(res);
  }
};

export const getUsersRequest = async (req, res) => {
  const user_id = req.params.user_id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  let result;
  try {
    const user = await getOne("users", { id: user_id });
    if (!user) {
      return sendNotFoundResponse(res, "User not found");
    }
    const role = await getOne("roles", { id: user.role_id });
    if (!role) {
      return sendBadRequestResponse(res, "User don't have role");
    }
    if (role.name === "BUDDY") {
      const query = `SELECT ur.*, c.name AS category_name, up.full_name AS username, up.dob AS dob, ui.image_url AS image_url FROM users_request ur
      LEFT JOIN categories c ON ur.category_id = c.id
      LEFT JOIN user_profiles up ON ur.user_id = up.user_id
      LEFT JOIN user_images ui ON ur.user_id = ui.user_id
      WHERE ur.buddy_id = $1`;
      result = await paginate(query, [user_id], page, limit);
    }
    if (role.name === "USER") {
      const query = `SELECT * FROM users_request WHERE user_id = $1`;
      result = await paginate(query, [user_id], page, limit);
    }
    return sendSuccessResponse(res, result, "User request retrieved successfully");
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
