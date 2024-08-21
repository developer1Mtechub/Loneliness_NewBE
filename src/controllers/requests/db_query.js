export const user_request_helper_query = `
SELECT ur.*,
  json_build_object(
    'id', brb.id, 
    'booking_date', brb.booking_date, 
    'booking_time', brb.booking_time,
    'buddy_location', brb.location,
    'buddy_status', brb.status
  ) AS buddy_request_back,
  json_build_object(
    'id', bu.id,
    'email', bu.email,
    'full_name', bp.full_name,
    'about', bp.about,
    'phone_country_code', bp.phone_country_code,
    'phone_number', bp.phone_number,
    'gender', bp.gender,
    'dob', bp.dob,
    'height_ft', bp.height_ft,
    'height_in', bp.height_in,
    'weight', bp.weight,
    'weight_unit', bp.weight_unit,
    'hourly_rate', bp.hourly_rate,
    'languages', bp.languages,
    'location', json_build_object(
      'address', bul.address,
      'country', bul.country,
      'state', bul.state,
      'postal_code', bul.postal_code,
      'city', bul.city,
      'longitude', ST_X(bul.location::geometry),
      'latitude', ST_Y(bul.location::geometry)
    ),
    'images', COALESCE(bi.images, '[]'::json)
  ) AS buddy,
  json_build_object(
    'id', c.id,
    'name', c.name,
    'image_url', c.image_url,
    'public_id', c.public_id
  ) AS category
FROM users_request ur
LEFT JOIN buddy_request_back brb ON ur.id = brb.users_request_id
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_locations ul ON u.id = ul.user_id
LEFT JOIN (
  SELECT 
    user_id, 
    json_agg(json_build_object('image_url', image_url)) AS images
  FROM user_images
  GROUP BY user_id
) ui ON u.id = ui.user_id
LEFT JOIN users bu ON ur.buddy_id = bu.id
LEFT JOIN user_profiles bp ON bu.id = bp.user_id
LEFT JOIN user_locations bul ON bu.id = bul.user_id
LEFT JOIN (
  SELECT 
    user_id, 
    json_agg(json_build_object('image_url', image_url)) AS images
  FROM user_images
  GROUP BY user_id
) bi ON bu.id = bi.user_id
LEFT JOIN categories c ON ur.category_id = c.id
WHERE ur.user_id = $1
`;

export const buddy_request_helper_query = `
SELECT ur.*,
        json_build_object(
          'id', brb.id, 
          'booking_date', brb.booking_date, 
          'booking_time', brb.booking_time,
          'buddy_location', brb.location,
          'buddy_status', brb.status
        ) AS buddy_request_back,
        json_build_object(
          'id', u.id,
          'email', u.email,
          'full_name', up.full_name,
          'about', up.about,
          'phone_country_code', up.phone_country_code,
          'phone_number', up.phone_number,
          'gender', up.gender,
          'dob', up.dob,
          'height_ft', up.height_ft,
          'height_in', up.height_in,
          'weight', up.weight,
          'weight_unit', up.weight_unit,
          'hourly_rate', up.hourly_rate,
          'languages', up.languages,
          'location', json_build_object(
            'address', ul.address,
            'country', ul.country,
            'state', ul.state,
            'postal_code', ul.postal_code,
            'city', ul.city,
            'longitude', ST_X(ul.location::geometry),
            'latitude', ST_Y(ul.location::geometry)
          ),
          'images', COALESCE(ui.images, '[]'::json)
        ) AS user,
      json_build_object(
        'id', c.id,
        'name', c.name,
        'image_url', c.image_url,
        'public_id', c.public_id
      ) AS category
      FROM users_request ur
      LEFT JOIN buddy_request_back brb ON ur.id = brb.users_request_id
      LEFT JOIN users u ON ur.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN user_locations ul ON u.id = ul.user_id
      LEFT JOIN (
        SELECT 
          user_id, 
          json_agg(json_build_object('image_url', image_url)) AS images
        FROM user_images
        GROUP BY user_id
      ) ui ON u.id = ui.user_id
      LEFT JOIN users bu ON ur.buddy_id = bu.id
      LEFT JOIN user_profiles bp ON bu.id = bp.user_id
      LEFT JOIN user_locations bul ON bu.id = bul.user_id
      LEFT JOIN (
        SELECT 
          user_id, 
          json_agg(json_build_object('image_url', image_url)) AS images
        FROM user_images
        GROUP BY user_id
      ) bi ON bu.id = bi.user_id
      LEFT JOIN categories c ON ur.category_id = c.id
      WHERE ur.buddy_id = $1
`;

export const one_request_helper_query_buddy = `
SELECT ur.*,
        json_build_object(
          'booking_date', brb.booking_date, 
          'booking_time', brb.booking_time,
          'buddy_location', brb.location,
          'buddy_status', brb.status
        ) AS buddy_request_back,
        json_build_object(
          'id', u.id,
          'email', u.email,
          'full_name', up.full_name,
          'about', up.about,
          'phone_country_code', up.phone_country_code,
          'phone_number', up.phone_number,
          'gender', up.gender,
          'dob', up.dob,
          'location', json_build_object(
            'address', ul.address,
            'country', ul.country,
            'state', ul.state,
            'postal_code', ul.postal_code,
            'city', ul.city,
            'longitude', ST_X(ul.location::geometry),
            'latitude', ST_Y(ul.location::geometry)
          ),
          'images', COALESCE(ui.images, '[]'::json)
        ) AS user,
      json_build_object(
        'id', c.id,
        'name', c.name,
        'image_url', c.image_url,
        'public_id', c.public_id
      ) AS category
      FROM users_request ur
      LEFT JOIN buddy_request_back brb ON ur.id = brb.users_request_id
      LEFT JOIN users u ON ur.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN user_locations ul ON u.id = ul.user_id
      LEFT JOIN (
        SELECT 
          user_id, 
          json_agg(json_build_object('image_url', image_url)) AS images
        FROM user_images
        GROUP BY user_id
      ) ui ON u.id = ui.user_id
      LEFT JOIN users bu ON ur.user_id = bu.id
      LEFT JOIN user_profiles bp ON bu.id = bp.user_id
      LEFT JOIN user_locations bul ON bu.id = bul.user_id
      LEFT JOIN (
        SELECT 
          user_id, 
          json_agg(json_build_object('image_url', image_url)) AS images
        FROM user_images
        GROUP BY user_id
      ) bi ON bu.id = bi.user_id
      LEFT JOIN categories c ON ur.category_id = c.id
      WHERE ur.id = $1
`;
export const one_request_helper_query = `
WITH user_images_agg AS (
  SELECT 
    user_id, 
    json_agg(json_build_object('image_url', image_url)) AS images
  FROM user_images
  GROUP BY user_id
),
avg_ratings AS (
  SELECT 
    buddy_id, 
    AVG(stars) AS avg_rating
  FROM rating
  GROUP BY buddy_id
),
user_data AS (
  SELECT
    u.id AS user_id,
    u.email,
    up.full_name,
    up.about,
    up.phone_country_code,
    up.phone_number,
    up.gender,
    up.dob,
    up.height_ft,
    up.height_in,
    up.weight,
    up.weight_unit,
    up.hourly_rate,
    up.languages,
    ul.address,
    ul.country,
    ul.state,
    ul.postal_code,
    ul.city,
    ST_X(ul.location::geometry) AS longitude,
    ST_Y(ul.location::geometry) AS latitude,
    COALESCE(ui.images, '[]'::json) AS images
  FROM users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  LEFT JOIN user_locations ul ON u.id = ul.user_id
  LEFT JOIN user_images_agg ui ON u.id = ui.user_id
),
request_data AS (
  SELECT 
    ur.*,
    ar.avg_rating
  FROM users_request ur
  LEFT JOIN avg_ratings ar ON ur.buddy_id = ar.buddy_id
  WHERE ur.id = $1
),
category_data AS (
  SELECT 
    c.id AS category_id,
    c.name AS category_name,
    c.image_url AS category_image_url,
    c.public_id AS category_public_id
  FROM categories c
)
SELECT 
  rd.*,
  json_build_object(
    'id', brb.id, 
    'booking_date', brb.booking_date, 
    'booking_time', brb.booking_time,
    'buddy_location', brb.location,
    'buddy_status', brb.status
  ) AS buddy_request_back,
  json_build_object(
    'id', ud.user_id,
    'email', ud.email,
    'full_name', ud.full_name,
    'about', ud.about,
    'phone_country_code', ud.phone_country_code,
    'phone_number', ud.phone_number,
    'gender', ud.gender,
    'dob', ud.dob,
    'height_ft', ud.height_ft,
    'height_in', ud.height_in,
    'weight', ud.weight,
    'weight_unit', ud.weight_unit,
    'hourly_rate', ud.hourly_rate,
    'languages', ud.languages,
    'location', json_build_object(
      'address', ud.address,
      'country', ud.country,
      'state', ud.state,
      'postal_code', ud.postal_code,
      'city', ud.city,
      'longitude', ud.longitude,
      'latitude', ud.latitude
    ),
    'images', ud.images
  ) AS user,
  json_build_object(
    'id', cd.category_id,
    'name', cd.category_name,
    'image_url', cd.category_image_url,
    'public_id', cd.category_public_id
  ) AS category,
  rd.avg_rating,
  json_build_object(
    'id', rat.id,
    'stars', rat.stars,
    'comment', rat.comment
  ) AS rating
FROM 
  request_data rd
LEFT JOIN buddy_request_back brb ON rd.id = brb.users_request_id
LEFT JOIN user_data ud ON rd.buddy_id = ud.user_id
LEFT JOIN category_data cd ON rd.category_id = cd.category_id
LEFT JOIN rating rat ON rd.id = rat.request_id;
`;

export const get_rejected_payment_query = `
SELECT 
    ur.id AS request_id,
    json_build_object(
        'id', u.id,
        'full_name', up.full_name,
        'image_url', ui.image_url
    ) AS user,
    json_build_object(
        'id', b.id,
        'full_name', bp.full_name,
        'image_url', bi.image_url
    ) AS buddy,
    ur.booking_date,
    ur.booking_time,
    ur.booking_price,
    ur.hours,
    ur.location,
    ur.status,
    ur.is_released,
    ur.canceled_status,
    ur.canceled_reason,
    ur.rejected_reason_buddy,
    ur.release_payment_requests,
    ur.notification_sent,
    ur.paid_at,
    ur.created_at,
    ur.updated_at
FROM 
    users_request ur
JOIN 
    users u ON ur.user_id = u.id
LEFT JOIN 
    user_profiles up ON u.id = up.user_id
LEFT JOIN 
    user_images ui ON u.id = ui.user_id
JOIN 
    users b ON ur.buddy_id = b.id
LEFT JOIN 
    user_profiles bp ON b.id = bp.user_id
LEFT JOIN 
    user_images bi ON b.id = bi.user_id
WHERE 
    ur.rejected_reason_buddy IS NOT NULL 
    AND ur.canceled_status = 'REJECTED'
    ORDER BY ur.paid_at DESC
`;
