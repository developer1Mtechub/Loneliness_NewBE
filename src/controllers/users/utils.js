import pool from "../../config/index.js";
import { deleteOne, getOne, insert, update } from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import { paginate } from "../../utils/paginationUtils.js";

export const updateUserProfileDetails = async (userId, profileData) => {
  console.log("data ")
  console.log(userId )
  console.log(profileData )

  const userProfile = await getOne("user_profiles", { user_id: userId });
  console.log(userProfile)

  if (userProfile===undefined||userProfile===null) {
    console.log("null data ")
    const mergedProfileData = { user_id: userId, ...profileData };
    let data = await insert("user_profiles", mergedProfileData);
    console.log(data)
    return data;
   
  } else {
    const mergedProfileData = { ...userProfile, ...profileData };
    return await update("user_profiles", mergedProfileData, {
      user_id: userId,
    });
  }
};

export const updateUserCategories = async (userId, categoryIds) => {
  if (categoryIds && Array.isArray(categoryIds)) {
    // Delete existing categories
    await deleteOne("user_categories", { user_id: userId });
    // Insert new categories
    for (const categoryId of categoryIds) {
      await insert("user_categories", {
        user_id: userId,
        category_id: categoryId,
      });
    }
  }
};

export const updateUserLocation = async (userId, locationData) => {
  const userLocation = await getOne("user_locations", { user_id: userId });

  if (userLocation) {
    return await update("user_locations", locationData, { user_id: userId });
  } else {
    return await insert("user_locations", { user_id: userId, ...locationData });
  }
};

export const updateUserImages = async (userId, images) => {
  try {
    // Delete existing images if necessary (if you want to replace all images)
    await deleteOne("user_images", { user_id: userId });

    // Insert new images
    for (const image of images) {
      await insert("user_images", {
        user_id: userId,
        image_url: image.secure_url,
        public_id: image.public_id,
      });
    }
  } catch (error) {
    logger.error(
      `Error updating user images for user ${userId}: ${error.message}`
    );
    throw error;
  }
};

// distance is in meter
export const getNearBy = async (
  latitude,
  longitude,
  distance,
  page,
  limit,
  user_id
) => {
  try {
    const query = `
WITH user_data AS (
    SELECT
        u.id,
        u.email,
        up.full_name,
        up.about,
        up.hourly_rate,
        up.weight_unit,
        up.weight,
        up.height_in,
        up.height_ft,
        up.phone_number,
        up.phone_country_code,
        up.gender,
        up.looking_for_gender,
        up.languages,
        TO_CHAR(up.dob, 'YYYY-MM-DD') AS dob,
        ul.location,
        ST_X(ul.location::geometry) AS longitude,
        ST_Y(ul.location::geometry) AS latitude,
        ul.address,
        ul.city,
        ul.state,
        ul.country,
        ul.postal_code,
        ST_Distance(ul.location, ST_SetSRID(ST_Point($2, $1), 4326)) AS distance,
        bl.is_liked AS is_liked,
        CASE
            WHEN ba.total_blocks > 0 THEN 'blocked'
            ELSE 'UNBLOCK'
        END AS block_status,
        CASE
            WHEN ra.total_reports > 0 THEN 'reported'
            ELSE 'NOT_REPORTED'
        END AS report_status,
        ra.report_types
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_locations ul ON u.id = ul.user_id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN (
        SELECT 
            buddy_id,
            user_id,
            is_liked
        FROM buddy_likes
        GROUP BY buddy_id, user_id, is_liked
    ) bl ON u.id = bl.buddy_id AND bl.user_id = $4
    LEFT JOIN (
        SELECT 
            buddy_id,
            user_id,
            COUNT(*) AS total_blocks
        FROM user_actions
        WHERE type = 'BLOCK' 
        GROUP BY buddy_id, user_id
    ) ba ON u.id = ba.buddy_id AND ba.user_id = $4
    LEFT JOIN (
        SELECT 
            buddy_id,
            user_id,
            COUNT(*) AS total_reports,
            STRING_AGG(DISTINCT type, ', ') AS report_types
        FROM user_actions
        WHERE type = 'REPORT' 
        GROUP BY buddy_id, user_id
    ) ra ON u.id = ra.buddy_id AND ra.user_id = $4
    WHERE r.name = 'BUDDY'
    AND ST_DWithin(ul.location, ST_SetSRID(ST_Point($2, $1), 4326), $3)
    AND u.id NOT IN (
        SELECT buddy_id
        FROM user_actions
        WHERE user_id = $4 AND type = 'BLOCK'
    )
),
images AS (
    SELECT 
        user_id,
        ARRAY_AGG(DISTINCT image_url) AS image_urls
    FROM user_images
    GROUP BY user_id
),
categories AS (
    SELECT 
        uc.user_id,
        JSON_AGG(json_build_object('id', c.id, 'name', c.name, 'image_url', c.image_url)) AS categories
    FROM user_categories uc
    LEFT JOIN categories c ON uc.category_id = c.id
    GROUP BY uc.user_id
),
average_ratings AS (
    SELECT 
        ur.buddy_id,
        AVG(r.stars) AS avg_rating
    FROM 
        users_request ur
    JOIN 
        rating r ON ur.id = r.request_id
    GROUP BY 
        ur.buddy_id
)
SELECT *
FROM (
    SELECT
        ud.id,
        ud.email,
        ud.full_name,
        ud.about,
        ud.hourly_rate,
        ud.weight_unit,
        ud.weight,
        ud.height_in,
        ud.height_ft,
        ud.phone_number,
        ud.phone_country_code,
        ud.gender,
        ud.looking_for_gender,
        ud.languages,
        ud.dob,
        json_build_object(
            'longitude', ud.longitude,
            'latitude', ud.latitude,
            'address', ud.address,
            'city', ud.city,
            'state', ud.state,
            'country', ud.country,
            'postal_code', ud.postal_code
        ) AS location,
        ud.distance,
        ud.is_liked,
        ud.block_status,
        ud.report_status,
        ud.report_types,
        img.image_urls,
        cat.categories,
        COALESCE(ar.avg_rating, 0) AS avg_rating
    FROM user_data ud
    LEFT JOIN images img ON ud.id = img.user_id
    LEFT JOIN categories cat ON ud.id = cat.user_id
    LEFT JOIN average_ratings ar ON ud.id = ar.buddy_id
) subquery
WHERE is_liked IS NULL OR is_liked = true
ORDER BY RANDOM()
    `;

    const params = [latitude, longitude, distance, user_id];
    return await paginate(query, params, page, limit);
  } catch (error) {
    logger.error(`Error retrieving near by buddies : ${error.message}`);
    throw error;
  }
};

export const getBlockList = async (user_id, page, limit) => {
  try {
    const query = `
WITH blocked_buddies AS (
    SELECT 
        ua.buddy_id
    FROM user_actions ua
    WHERE ua.user_id = $1 AND ua.type = 'BLOCK'
),
buddy_details AS (
    SELECT
        u.id,
        u.email,
        up.full_name,
        up.phone_number,
        up.hourly_rate,
        up.weight_unit,
        up.weight,
        up.height_in,
        up.height_ft,
        up.gender,
        up.looking_for_gender,
        up.languages,
        TO_CHAR(up.dob, 'YYYY-MM-DD') AS dob,
        ul.location,
        ST_X(ul.location::geometry) AS longitude,
        ST_Y(ul.location::geometry) AS latitude,
        ul.address,
        ul.city,
        ul.state,
        ul.country,
        ul.postal_code
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_locations ul ON u.id = ul.user_id
    WHERE u.id IN (SELECT buddy_id FROM blocked_buddies)
),
images AS (
    SELECT 
        ui.user_id,
        ARRAY_AGG(ui.image_url) AS image_urls
    FROM user_images ui
    GROUP BY ui.user_id
),
categories AS (
    SELECT 
        uc.user_id,
        ARRAY_AGG(c.name) AS categories
    FROM user_categories uc
    LEFT JOIN categories c ON uc.category_id = c.id
    GROUP BY uc.user_id
)
SELECT
    bd.id,
    bd.email,
    bd.full_name,
    bd.phone_number,
    bd.hourly_rate,
    bd.weight_unit,
    bd.weight,
    bd.height_in,
    bd.height_ft,
    bd.gender,
    bd.looking_for_gender,
    bd.languages,
    bd.dob,
    json_build_object(
        'longitude', bd.longitude,
        'latitude', bd.latitude,
        'address', bd.address,
        'city', bd.city,
        'state', bd.state,
        'country', bd.country,
        'postal_code', bd.postal_code
    ) AS location,
    img.image_urls,
    cat.categories
FROM buddy_details bd
LEFT JOIN images img ON bd.id = img.user_id
LEFT JOIN categories cat ON bd.id = cat.user_id
    `;

    const params = [user_id];
    const result = await paginate(query, params, page, limit);
    return result;
  } catch (error) {
    logger.error(`Error retrieving near by buddies : ${error.message}`);
    throw error;
  }
};


export const getBlockListUsersHelper = async (user_id, page, limit) => {
  try {
    const query = `
WITH blocked_buddies AS (
    SELECT 
        ua.user_id
    FROM user_actions ua
    WHERE ua.buddy_id = $1 AND ua.type = 'BLOCK'
),
buddy_details AS (
    SELECT
        u.id,
        u.email,
        up.full_name,
        up.phone_number,
        up.hourly_rate,
        up.weight_unit,
        up.weight,
        up.height_in,
        up.height_ft,
        up.gender,
        up.looking_for_gender,
        up.languages,
        TO_CHAR(up.dob, 'YYYY-MM-DD') AS dob,
        ul.location,
        ST_X(ul.location::geometry) AS longitude,
        ST_Y(ul.location::geometry) AS latitude,
        ul.address,
        ul.city,
        ul.state,
        ul.country,
        ul.postal_code
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_locations ul ON u.id = ul.user_id
    WHERE u.id IN (SELECT user_id FROM blocked_buddies)
),
images AS (
    SELECT 
        ui.user_id,
        ARRAY_AGG(ui.image_url) AS image_urls
    FROM user_images ui
    GROUP BY ui.user_id
),
categories AS (
    SELECT 
        uc.user_id,
        ARRAY_AGG(c.name) AS categories
    FROM user_categories uc
    LEFT JOIN categories c ON uc.category_id = c.id
    GROUP BY uc.user_id
)
SELECT
    bd.id,
    bd.email,
    bd.full_name,
    bd.phone_number,
    bd.hourly_rate,
    bd.weight_unit,
    bd.weight,
    bd.height_in,
    bd.height_ft,
    bd.gender,
    bd.looking_for_gender,
    bd.languages,
    bd.dob,
    json_build_object(
        'longitude', bd.longitude,
        'latitude', bd.latitude,
        'address', bd.address,
        'city', bd.city,
        'state', bd.state,
        'country', bd.country,
        'postal_code', bd.postal_code
    ) AS location,
    img.image_urls,
    cat.categories
FROM buddy_details bd
LEFT JOIN images img ON bd.id = img.user_id
LEFT JOIN categories cat ON bd.id = cat.user_id
    `;

    const params = [user_id];
    const result = await paginate(query, params, page, limit);
    return result;
  } catch (error) {
    logger.error(`Error retrieving near by buddies : ${error.message}`);
    throw error;
  }
};
export const getAllUsersHelper = async (role, page, limit) => {
  try {
    const query = `
    WITH buddy_details AS (
    SELECT
        u.id,
        up.full_name,
        u.email,
        u.is_block,
        u.subscription_name,
        r.name AS role,
        up.about,
        TO_CHAR(up.dob, 'YYYY-MM-DD') AS dob,
        up.gender,
        up.looking_for_gender,
        up.phone_country_code,
        up.phone_number,
        up.height_ft,
        up.height_in,
        up.weight,
        up.weight_unit,
        up.hourly_rate,
        up.languages,
        ul.location,
        ST_X(ul.location::geometry) AS longitude,
        ST_Y(ul.location::geometry) AS latitude,
        ul.address,
        ul.city,
        ul.state,
        ul.country,
        ul.postal_code
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_locations ul ON u.id = ul.user_id
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = $1
),
images AS (
    SELECT 
        ui.user_id,
        ARRAY_AGG(ui.image_url) AS image_urls
    FROM user_images ui
    GROUP BY ui.user_id
),
categories AS (
    SELECT 
        uc.user_id,
        JSON_AGG(json_build_object('id', c.id, 'name', c.name, 'image_url', c.image_url)) AS categories
    FROM user_categories uc
    LEFT JOIN categories c ON uc.category_id = c.id
    GROUP BY uc.user_id
),
request_counts AS (
    SELECT
        buddy_id,
        COUNT(*) AS total_requests
    FROM users_request
    GROUP BY buddy_id
),
user_request_counts AS (
    SELECT
        user_id,
        COUNT(*) AS total_requests_user
    FROM users_request
    GROUP BY user_id
)
SELECT
    bd.id,
    bd.full_name,
    bd.email,
    bd.is_block,
    bd.subscription_name,
    bd.role,
    bd.about,
    bd.dob,
    bd.gender,
    bd.looking_for_gender,
    bd.phone_country_code,
    bd.phone_number,
    bd.height_ft,
    bd.height_in,
    bd.weight,
    bd.weight_unit,
    bd.hourly_rate,
    bd.languages,
    json_build_object(
        'longitude', bd.longitude,
        'latitude', bd.latitude,
        'address', bd.address,
        'city', bd.city,
        'state', bd.state,
        'country', bd.country,
        'postal_code', bd.postal_code
    ) AS location,
    img.image_urls,
    cat.categories,
    COALESCE(rc.total_requests, 0) AS total_requests,
    COALESCE(urc.total_requests_user, 0) AS total_requests_user
FROM buddy_details bd 
LEFT JOIN images img ON bd.id = img.user_id
LEFT JOIN categories cat ON bd.id = cat.user_id
LEFT JOIN request_counts rc ON bd.id = rc.buddy_id
LEFT JOIN user_request_counts urc ON bd.id = urc.user_id
ORDER BY bd.id DESC
    `;

    const result = await paginate(query, [role], page, limit);
    return result;
  } catch (error) {
    logger.error(`Error retrieving near by buddies : ${error.message}`);
    throw error;
  }
};

export const getUsersHelper = async (user_id) => {
  try {
    const query = `
    WITH buddy_details AS (
    SELECT
        u.id,
        up.full_name,
        u.email,
        u.is_block,
        r.name AS role,
        up.about,
        u.is_subscribed,
        u.subscription_name,
        TO_CHAR(up.dob, 'YYYY-MM-DD') AS dob,
        up.gender,
        up.looking_for_gender,
        up.phone_country_code,
        up.phone_number,
        up.height_ft,
        up.height_in,
        up.weight,
        up.weight_unit,
        up.hourly_rate,
        up.languages,
        ul.location,
        ST_X(ul.location::geometry) AS longitude,
        ST_Y(ul.location::geometry) AS latitude,
        ul.address,
        ul.city,
        ul.state,
        ul.country,
        ul.postal_code
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_locations ul ON u.id = ul.user_id
    JOIN roles r ON u.role_id = r.id
),
images AS (
    SELECT 
        ui.user_id,
        ARRAY_AGG(ui.image_url) AS image_urls
    FROM user_images ui
    GROUP BY ui.user_id
),
categories AS (
    SELECT 
        uc.user_id,
                JSON_AGG(json_build_object('name', c.name, 'image_url', c.image_url)) AS categories
    FROM user_categories uc
    LEFT JOIN categories c ON uc.category_id = c.id
    GROUP BY uc.user_id
),
wallet_details AS (
    SELECT 
        w.id AS wallet_id,
        w.user_id,
        w.buddy_id,
        w.amount,
        w.is_admin,
        w.created_at,
        w.updated_at
    FROM wallet w
)
SELECT
    bd.id,
    bd.full_name,
    bd.email,
    bd.is_block,
    bd.role,
    bd.is_subscribed,
    bd.subscription_name,
    bd.about,
    bd.dob,
    bd.gender,
    bd.looking_for_gender,
    bd.phone_country_code,
    bd.phone_number,
    bd.height_ft,
    bd.height_in,
    bd.weight,
    bd.weight_unit,
    bd.hourly_rate,
    bd.languages,
    json_build_object(
        'longitude', bd.longitude,
        'latitude', bd.latitude,
        'address', bd.address,
        'city', bd.city,
        'state', bd.state,
        'country', bd.country,
        'postal_code', bd.postal_code
    ) AS location,
    img.image_urls,
    cat.categories,
    CASE 
        WHEN bd.role = 'USER' THEN json_build_object(
            'wallet_id', wd.wallet_id,
            'amount', wd.amount,
            'is_admin', wd.is_admin,
            'created_at', wd.created_at,
            'updated_at', wd.updated_at
        )
        WHEN bd.role = 'BUDDY' THEN json_build_object(
            'wallet_id', wd.wallet_id,
            'amount', wd.amount,
            'is_admin', wd.is_admin,
            'created_at', wd.created_at,
            'updated_at', wd.updated_at
        )
        ELSE NULL
    END AS wallet
FROM buddy_details bd 
LEFT JOIN images img ON bd.id = img.user_id
LEFT JOIN categories cat ON bd.id = cat.user_id
LEFT JOIN wallet_details wd ON (bd.role = 'USER' AND bd.id = wd.user_id) OR (bd.role = 'BUDDY' AND bd.id = wd.buddy_id)
WHERE bd.id = $1
    `;

    const result = await pool.query(query, [user_id]);
    return result.rows[0];
  } catch (error) {
    logger.error(`Error retrieving near by buddies : ${error.message}`);
    throw error;
  }
};

export const getLikesHelper = async (
  buddy_id,
  latitude,
  longitude,
  page,
  limit
) => {
  try {
    const query = `
SELECT u.id, up.full_name, u.email, up.dob, 
       ST_Distance(
         COALESCE(ul.location, ST_SetSRID(ST_MakePoint(0, 0), 4326)), 
         ST_SetSRID(ST_MakePoint($2, $3), 4326)
       ) / 1000 AS distance,
       array_agg(DISTINCT jsonb_build_object('image_url', ui.image_url, 'public_id', ui.public_id)) AS images
FROM buddy_likes bl
LEFT JOIN users u ON bl.user_id = u.id
LEFT JOIN user_profiles up ON bl.user_id = up.user_id
LEFT JOIN user_images ui ON bl.user_id = ui.user_id
LEFT JOIN user_locations ul ON bl.user_id = ul.user_id
WHERE bl.buddy_id = $1
GROUP BY u.id, up.full_name, u.email, up.dob, ul.location
ORDER BY distance ASC
    `;

    const result = await paginate(
      query,
      [buddy_id, longitude, latitude],
      page,
      limit
    );
    return result;
  } catch (error) {
    throw error;
  }
};


export const getReportedBuddies = async (page, limit) => {
  try {
    const query = `
  WITH reporter_details AS (
    SELECT
        u.id AS reporter_id,
        up.full_name AS reporter_full_name,
        json_agg(ui.image_url) AS reporter_images
    FROM users u
    JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_images ui ON u.id = ui.user_id
    GROUP BY u.id, up.full_name
),
reported_details AS (
    SELECT
        u.id AS reported_id,
        up.full_name AS reported_full_name,
        json_agg(ui.image_url) AS reported_images
    FROM users u
    JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_images ui ON u.id = ui.user_id
    GROUP BY u.id, up.full_name
)
SELECT
    ua.id AS action_id,
    ua.type AS action_type,
    ua.reason AS action_reason,
    u.is_block,
    ua.created_at AS action_created_at,
    ua.updated_at AS action_updated_at,
    json_build_object(
        'id', repd.reported_id,
        'full_name', repd.reported_full_name,
        'images', repd.reported_images
    ) AS reported_user,
    json_build_object(
        'id', rd.reporter_id,
        'full_name', rd.reporter_full_name,
        'images', rd.reporter_images
    ) AS reporter_user
FROM user_actions ua
JOIN reported_details repd ON ua.buddy_id = repd.reported_id
JOIN reporter_details rd ON ua.user_id = rd.reporter_id
JOIN users u ON ua.buddy_id = u.id
WHERE ua.type = 'REPORT' ORDER BY ua.created_at DESC  
    `;
    return await paginate(query, [], page, limit)
  } catch (error) {
    throw error;
  }
}
export const getReportedUsers = async (page, limit) => {
  try {
    const query = `
WITH reporter_details AS (
    SELECT
        u.id AS reporter_id,
        up.full_name AS reporter_full_name,
        json_agg(ui.image_url) AS reporter_images
    FROM users u
    JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_images ui ON u.id = ui.user_id
    GROUP BY u.id, up.full_name
),
reported_details AS (
    SELECT
        u.id AS reported_id,
        up.full_name AS reported_full_name,
        json_agg(ui.image_url) AS reported_images
    FROM users u
    JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_images ui ON u.id = ui.user_id
    GROUP BY u.id, up.full_name
)
SELECT
    ua.id AS action_id,
    ua.type AS action_type,
    ua.reason AS action_reason,
    u.is_block,
    ua.created_at AS action_created_at,
    ua.updated_at AS action_updated_at,
    json_build_object(
        'id', repd.reported_id,
        'full_name', repd.reported_full_name,
        'images', repd.reported_images
    ) AS reporter_user,
    json_build_object(
        'id', rd.reporter_id,
        'full_name', rd.reporter_full_name,
        'images', rd.reporter_images
    ) AS reported_user
FROM buddy_actions ua
JOIN reported_details repd ON ua.buddy_id = repd.reported_id
JOIN reporter_details rd ON ua.user_id = rd.reporter_id
JOIN users u ON ua.user_id = u.id
WHERE ua.type = 'REPORT' ORDER BY ua.created_at DESC
    `;
    return await paginate(query, [], page, limit)
  } catch (error) {
    throw error;
  }
}


export const getAllDeletedUsersHelper = async (role, page, limit) => {
  try {
    const query = `
    WITH buddy_details AS (
    SELECT
        u.id,
        up.full_name,
        u.email,
        u.is_block,
        r.name AS role,
        up.about,
        TO_CHAR(up.dob, 'YYYY-MM-DD') AS dob,
        up.gender,
        up.looking_for_gender,
        up.phone_country_code,
        up.phone_number,
        up.height_ft,
        up.height_in,
        up.weight,
        up.weight_unit,
        up.hourly_rate,
        up.languages,
        ul.location,
        ST_X(ul.location::geometry) AS longitude,
        ST_Y(ul.location::geometry) AS latitude,
        ul.address,
        ul.city,
        ul.state,
        ul.country,
        ul.postal_code,
        90 - EXTRACT(DAY FROM (CURRENT_DATE - u.deleted_at)) AS remaining_days
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_locations ul ON u.id = ul.user_id
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = $1 AND is_deleted = TRUE
),
images AS (
    SELECT 
        ui.user_id,
        ARRAY_AGG(ui.image_url) AS image_urls
    FROM user_images ui
    GROUP BY ui.user_id
),
categories AS (
    SELECT 
        uc.user_id,
        JSON_AGG(json_build_object('id', c.id, 'name', c.name, 'image_url', c.image_url)) AS categories
    FROM user_categories uc
    LEFT JOIN categories c ON uc.category_id = c.id
    GROUP BY uc.user_id
)
SELECT
    bd.id,
    bd.full_name,
    bd.email,
    bd.remaining_days,
    bd.is_block,
    bd.role,
    bd.about,
    bd.dob,
    bd.gender,
    bd.looking_for_gender,
    bd.phone_country_code,
    bd.phone_number,
    bd.height_ft,
    bd.height_in,
    bd.weight,
    bd.weight_unit,
    bd.hourly_rate,
    bd.languages,
    json_build_object(
        'longitude', bd.longitude,
        'latitude', bd.latitude,
        'address', bd.address,
        'city', bd.city,
        'state', bd.state,
        'country', bd.country,
        'postal_code', bd.postal_code
    ) AS location,
    img.image_urls,
    cat.categories
FROM buddy_details bd 
LEFT JOIN images img ON bd.id = img.user_id
LEFT JOIN categories cat ON bd.id = cat.user_id
ORDER BY bd.id DESC
    `;

    const result = await paginate(query, [role], page, limit);
    return result;
  } catch (error) {
    logger.error(`Error retrieving near by buddies : ${error.message}`);
    throw error;
  }
};
