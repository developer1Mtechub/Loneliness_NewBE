export const nearByQuery = `
      SELECT json_build_object(
        'id', u.id,
        'profile', json_build_object(
          'full_name', up.full_name,
          'dob', TO_CHAR(up.dob, 'YYYY-MM-DD')
        ),
        'location', json_build_object(
          'latitude', ST_Y(ul.location::geometry),
          'longitude', ST_X(ul.location::geometry),
          'address', ul.address,
          'city', ul.city,
          'state', ul.state,
          'country', ul.country,
          'postalCode', ul.postal_code
        ),
        'distance', ST_Distance(ul.location, ST_SetSRID(ST_Point($2, $1), 4326)),
        'likes', (SELECT COUNT(*) FROM buddy_likes bl WHERE bl.buddy_id = u.id),
        'isBlocked', (SELECT COUNT(*) > 0 FROM user_actions ua WHERE ua.user_id = $3 AND ua.buddy_id = u.id AND ua.type = 'BLOCK'),
        'isReported', (SELECT COUNT(*) > 0 FROM user_actions ua WHERE ua.user_id = $3 AND ua.buddy_id = u.id AND ua.type = 'REPORT'),
        'images', json_agg(im.image_url)
      ) AS buddy_details
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN user_locations ul ON u.id = ul.user_id
      LEFT JOIN user_images im ON u.id = im.user_id
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'BUDDY' AND ST_DWithin(ul.location, ST_SetSRID(ST_Point($2, $1), 4326), $4)
      GROUP BY u.id, up.full_name, up.dob, ul.location, ul.address, ul.city, ul.state, ul.country, ul.postal_code
      ORDER BY ST_Distance(ul.location, ST_SetSRID(ST_Point($2, $1), 4326)), RANDOM()
      LIMIT $5 OFFSET $6;
               `;
