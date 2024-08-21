export const add_social_links = `INSERT INTO social_links (platform, link, created_at, updated_at)
VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (platform)
DO UPDATE SET
  link = EXCLUDED.link,
  updated_at = EXCLUDED.updated_at
RETURNING *;`;
