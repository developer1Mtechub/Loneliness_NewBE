import pool from '../config/index.js';
/**
 * Generic function to insert a new record into a specified table.
 * @param {string} table - The table name.
 * @param {Object} data - An object representing the data to insert.
 * @returns {Object} - The inserted record.
 */
export const insert = async (table, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const query = `
    INSERT INTO ${table} (${keys.join(", ")})
    VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")})
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    throw error;
  }
};

/**
 * Generic function to update a record in a specified table.
 * @param {string} table - The table name.
 * @param {Object} data - An object representing the data to update.
 * @param {Object} conditions - An object representing the conditions to match for update.
 * @returns {Object} - The updated record.
 */
export const update = async (table, data, conditions) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const conditionKeys = Object.keys(conditions);
  const conditionValues = Object.values(conditions);

  const query = `
    UPDATE ${table}
    SET ${keys.map((key, i) => `${key} = $${i + 1}`).join(", ")}
    WHERE ${conditionKeys
      .map((key, i) => `${key} = $${keys.length + i + 1}`)
      .join(" AND ")}
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, [...values, ...conditionValues]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    throw error;
  }
};

/**
 * Generic function to get a single record from a specified table.
 * @param {string} table - The table name.
 * @param {Object} conditions - An object representing the conditions to match.
 * @returns {Object} - The matched record.
 */
export const getOne = async (table, conditions) => {
  const conditionKeys = Object.keys(conditions);
  const conditionValues = Object.values(conditions);

  const query = `
    SELECT * FROM ${table}
    WHERE ${conditionKeys.map((key, i) => `${key} = $${i + 1}`).join(" AND ")};
  `;
  try {
    const result = await pool.query(query, conditionValues);
    return result.rows[0];
  } catch (error) {
    console.error(`Error getting one from ${table}:`, error);
    throw error;
  }
};

/**
 * Generic function to get all records from a specified table with optional conditions.
 * @param {string} table - The table name.
 * @param {Object} [conditions] - Optional conditions for filtering records.
 * @returns {Array} - An array of all records.
 */
export const getAll = async (table, conditions = {}) => {
  let query = `SELECT * FROM ${table}`;
  
  // Build the WHERE clause if conditions are provided
  const keys = Object.keys(conditions);
  if (keys.length > 0) {
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    query += ` WHERE ${whereClause}`;
  }

  try {
    const values = Object.values(conditions);
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error(`Error getting all from ${table}:`, error);
    throw error;
  }
};


/**
 * Generic function to get the total count of records from a specified table with optional conditions.
 * @param {string} table - The table name.
 * @param {Object} [conditions] - Optional conditions for filtering records.
 * @returns {number} - The total count of records.
 */
export const getTotalCount = async (table, conditions = {}) => {
  let query = `SELECT COUNT(*) FROM ${table}`;
  
  // Build the WHERE clause if conditions are provided
  const keys = Object.keys(conditions);
  if (keys.length > 0) {
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    query += ` WHERE ${whereClause}`;
  }

  try {
    const values = Object.values(conditions);
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error(`Error getting total count from ${table}:`, error);
    throw error;
  }
};


/**
 * Generic function to delete a single record from a specified table.
 * @param {string} table - The table name.
 * @param {Object} conditions - An object representing the conditions to match.
 * @returns {Object} - The deleted record.
 */
export const deleteOne = async (table, conditions) => {
  const conditionKeys = Object.keys(conditions);
  const conditionValues = Object.values(conditions);

  const query = `
    DELETE FROM ${table}
    WHERE ${conditionKeys.map((key, i) => `${key} = $${i + 1}`).join(" AND ")}
    RETURNING *;
  `;
  try {
    const result = await pool.query(query, conditionValues);
    return result.rows[0];
  } catch (error) {
    console.error(`Error deleting one from ${table}:`, error);
    throw error;
  }
};

/**
 * Generic function to delete all records from a specified table.
 * @param {string} table - The table name.
 * @returns {Object} - The result of the deletion.
 */
export const deleteAll = async (table) => {
  const query = `DELETE FROM ${table} RETURNING *;`;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error(`Error deleting all from ${table}:`, error);
    throw error;
  }
};
