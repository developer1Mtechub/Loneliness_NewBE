import pool from "../../config/index.js";
import { paginate } from "../../utils/paginationUtils.js";
import {
  buddy_request_helper_query,
  get_rejected_payment_query,
  one_request_helper_query,
  one_request_helper_query_buddy,
  user_request_helper_query,
} from "./db_query.js";

export const getBuddyRequestHelper = async (user_id, status, page, limit) => {
  try {
    let baseQuery = buddy_request_helper_query;
    const params = [user_id];

    if (status) {
      if (status === "ACCEPTED") {
        baseQuery += ` AND (ur.status = $2 OR ur.status = 'REQUEST_BACK')`;
      } else {
        baseQuery += ` AND ur.status = $2`;
      }
      params.push(status);
    } else {
      baseQuery += ` AND ur.status IN ('REQUESTED', 'REJECTED', 'REQUEST_BACK')`;
    }

    baseQuery += ` ORDER BY ur.created_at DESC`;

    const result = await paginate(baseQuery, params, page, limit);
    return result;
  } catch (error) {
    throw error;
  }
};

export const getBuddyRequestHelper1 = async (user_id, status, page, limit) => {
  try {
    let baseQuery = buddy_request_helper_query;
    const params = [user_id];
    baseQuery += ` AND ur.status IN ('REQUESTED', 'REJECTED', 'REQUEST_BACK') ORDER BY ur.created_at DESC`;

    const result = await paginate(baseQuery, params, page, limit);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getUserRequestHelper = async (user_id, status, page, limit) => {
  try {
    let baseQuery = user_request_helper_query;
    const params = [user_id];

    // if (status) {
    //   baseQuery += ` AND ur.status = $2`;
    //   params.push(status);
    // } else {
    //   baseQuery += ` AND ur.status IN ('REQUESTED', 'REJECTED', 'REQUEST_BACK')`;
    // }
    if (status) {
      if (status === "ACCEPTED") {
        baseQuery += ` AND (ur.status = $2 OR ur.status = 'REQUEST_BACK')`;
      } else {
        baseQuery += ` AND ur.status = $2`;
      }
      params.push(status);
    } else {
      baseQuery += ` AND ur.status IN ('REQUESTED', 'REJECTED', 'REQUEST_BACK')`;
    }
    baseQuery += ` ORDER BY ur.created_at DESC`;

    const result = await paginate(
      baseQuery,
      params,
      parseInt(page),
      parseInt(limit)
    );
    return result;
  } catch (error) {
    throw error;
  }
};
export const getUserRequestHelper1 = async (user_id, page, limit) => {
  try {
    let baseQuery = user_request_helper_query;
    const params = [user_id];
    baseQuery += ` AND ur.status != 'ACCEPTED' ORDER BY ur.created_at DESC`;

    const result = await paginate(
      baseQuery,
      params,
      parseInt(page),
      parseInt(limit)
    );
    return result;
  } catch (error) {
    throw error;
  }
};

export const getOneRequestHelper = async (id, role) => {
  const query =
    role === "USER" ? one_request_helper_query : one_request_helper_query_buddy;
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const getRejectedReasonHelper = async (page, limit) => {
  try {
    const result = await paginate(
      get_rejected_payment_query,
      [],
      parseInt(page),
      parseInt(limit)
    );
    return result;
  } catch (error) {
    throw error;
  }
};
