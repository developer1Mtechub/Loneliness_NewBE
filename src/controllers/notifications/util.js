// export const query = `SELECT
//     n.id AS id,
//     n.title AS title,
//     n.body AS body,
//     nt.name AS type,
//     ur.id AS receiver_id,
//     ur.email AS receiver_email,
//     COALESCE(upr.full_name, NULL) AS receiver_name,
//     us.id AS sender_id,
//     us.email AS sender_email,
//     COALESCE(ups.full_name, NULL) AS sender_name,
//     n.created_at AS created_at,
//     n.updated_at AS updated_at
// FROM
//     notifications n

// LEFT JOIN
//     users ur ON n.receiver_id = ur.id
// LEFT JOIN
//     users us ON n.sender_id = us.id
// LEFT JOIN
//     user_profiles upr ON ur.id = upr.user_id
// LEFT JOIN
//     user_profiles ups ON us.id = ups.user_id
//     WHERE n.receiver_id = $1 ORDER BY n.created_at DESC`;
export const query = `
  SELECT * FROM notifications
  WHERE receiver_id = $1
  ORDER BY created_at DESC

`;
