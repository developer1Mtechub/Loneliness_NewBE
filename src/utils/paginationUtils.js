import pool from "../config/index.js";

export const paginate = async (query, params, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const paginatedQuery = `${query} LIMIT $${params.length + 1} OFFSET $${
    params.length + 2
  }`;
  const paginatedParams = [...params, limit, offset];

  try {
    const result = await pool.query(paginatedQuery, paginatedParams);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      page,
      limit,
      totalPages,
      totalCount,
      data: result.rows,
    };
  } catch (error) {
    throw new Error(`Error paginating results: ${error.message}`);
  }
};
