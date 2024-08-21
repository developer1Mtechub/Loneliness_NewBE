import pool from "../../config/index.js";
import { paginate } from "../../utils/paginationUtils.js";


export const getLastWithdrawTransactions = async (buddy_id) => {
  try {
    const lastWithdrawal = await pool.query(
      "SELECT * FROM transactions WHERE buddy_id = $1 AND credit = FALSE AND created_at >= NOW() - INTERVAL '7 days' LIMIT 1",
      [user_id]
    );
    if (lastWithdrawal.rowCount > 0) {
      return sendBadRequestResponse(
        res,
        "Only one withdrawal is allowed per week.",
        "WEEKLY_WIThDRAWAL_ERROR"
      );
    }
    return lastWithdrawal.rows[0];
  } catch (error) {
    throw error;
  }
};
export const generateMeetingCode=()=> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let meeting_code = '';
  for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      meeting_code += chars[randomIndex];
  }
  return meeting_code;
}


export const retrieveCards = async (user_id, page, limit) => {
  console.log(user_id);
  try {
    const query = `SELECT * FROM cards WHERE user_id = $1`;
    const result = await paginate(query, [user_id], page, limit);
    console.log(result);
    return result;
  } catch (error) {
    throw error;
  }
};
