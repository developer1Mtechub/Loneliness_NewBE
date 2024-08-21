-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE SET NULL,
    signup_type TEXT NOT NULL,
    -- EMAIL | GOOGLE | FACEBOOK
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    token_google TEXT,
    code VARCHAR(6),
    is_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_name VARCHAR(255),
    subscription_id VARCHAR(255),
    plan_id TEXT,
    is_block BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    customer_id VARCHAR(255),
    -- for USERS
    connected_account_id VARCHAR(255),
    -- for BUDDIES
    is_requirements_completed BOOLEAN NOT NULL DEFAULT FALSE,
    device_token VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS product (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    home_url VARCHAR(255) NOT NULL,
    paypal_product_id TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS plan (
    id SERIAL PRIMARY KEY,
   name VARCHAR(255) NOT NULL,
    description TEXT,
    interval_unit VARCHAR(255) NOT NULL,
    interval_count INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency_code VARCHAR(255) NOT NULL,
    paypal_plan_id TEXT,
    product_id TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) DEFAULT NULL,
    -- For storing main profile image URL
    about TEXT,
    dob DATE,
    -- Store in YYYY-MM-DD format and handle formatting in application logic
    gender VARCHAR(20) CHECK (
        gender IN ('Male', 'Female', 'Preferred not to say')
    ),
    looking_for_gender VARCHAR(20) CHECK (
        looking_for_gender IN ('Male', 'Female', 'Other')
    ),
    phone_country_code VARCHAR(10),
    phone_number VARCHAR(20),
    height_ft INT,
    height_in INT,
    weight TEXT,
    -- weight_unit VARCHAR(2) CHECK (weight_unit IN ('KG', 'LB')),
    -- hourly_rate DECIMAL(10, 2),
    weight_unit TEXT,
hourly_rate TEXT,
     languages TEXT
);
-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    image_url VARCHAR(255) NOT NULL,
    public_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- User Categories Table
CREATE TABLE IF NOT EXISTS user_categories (
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, category_id)
);
-- User Locations Table
CREATE TABLE IF NOT EXISTS user_locations (
    user_id INT NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    location GEOGRAPHY(Point, 4326),
    address VARCHAR(255),
    country VARCHAR(255),
    state VARCHAR(255),
    postal_code VARCHAR(255),
    city VARCHAR(255),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- User Images Table
CREATE TABLE IF NOT EXISTS user_images (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    public_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS buddy_likes(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buddy_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_liked BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS user_actions(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buddy_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255),
    -- BLOCK OR REPORT
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS buddy_actions(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buddy_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255),
    -- BLOCK OR REPORT
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- this table is store all the requests that have been submitted by user
CREATE TABLE IF NOT EXISTS users_request(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buddy_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    booking_price DECIMAL(10, 0) NOT NULL,
    hours INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'REQUESTED',
    is_released BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_status VARCHAR(255) DEFAULT NULL,
    canceled_reason VARCHAR(255),
    rejected_reason_buddy VARCHAR(255) DEFAULT NULL,
    release_payment_requests VARCHAR(255) DEFAULT NULL,
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    release_to VARCHAR(50),
    meeting_code VARCHAR(50),
    meeting_code_verified BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- this table is store all the requests back that have been submitted by buddy
CREATE TABLE IF NOT EXISTS buddy_request_back(
    id SERIAL PRIMARY KEY,
    users_request_id INT NOT NULL REFERENCES users_request(id) ON DELETE CASCADE,
    booking_date DATE,
    booking_time TIME,
    location VARCHAR(255),
    status VARCHAR(255) NOT NULL DEFAULT 'REQUESTED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cards(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id TEXT,
    card_id TEXT,
    exp_month TEXT,
    exp_year TEXT,
    last_digit TEXT,
    finger_print TEXT,
    brand_name TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS transactions(
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buddy_id INT REFERENCES users(id) ON DELETE CASCADE,
    request_id INT REFERENCES users_request(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    -- CHAT | SERVICES | SUBSCRIPTION
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    admin_fee DECIMAL(10, 2) DEFAULT 0.00,
    method VARCHAR(255) NOT NULL,
    payment_intent_id VARCHAR(255),
    credit BOOLEAN DEFAULT TRUE,
    is_refunded BOOLEAN DEFAULT FALSE,
    is_released BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_transactions(
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS wallet(
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    buddy_id INT REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS release_payment_requests(
    id SERIAL PRIMARY KEY,
    request_id INT REFERENCES users_request(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS rating(
    id SERIAL PRIMARY KEY,
    request_id INT REFERENCES users_request(id) ON DELETE CASCADE,
    buddy_id INT REFERENCES users(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,

    stars DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    comment VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS subscriptions(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    interval VARCHAR(50),
    interval_count INT,
    stripe_prod_id VARCHAR(255) NOT NULL,
    stripe_price_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- notifications
CREATE TABLE IF NOT EXISTS notification_types(
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notifications(
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id TEXT,
    title VARCHAR(150) NOT NULL,
    body VARCHAR(255),
    type TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chats(
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message VARCHAR(255),
    image_url VARCHAR(255),
    deleted_by_sender BOOLEAN DEFAULT false,
    deleted_by_receiver BOOLEAN DEFAULT false,
    read_status BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    unread_count INT DEFAULT 0,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message VARCHAR(255),
    status VARCHAR(50) DEFAULT 'offline',
    last_message VARCHAR(255),
    last_message_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- admin commission
CREATE TABLE IF NOT EXISTS commission(
    id SERIAL PRIMARY KEY,
    per_hour_rate INT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS social_links(
    id SERIAL PRIMARY KEY,
    platform VARCHAR(255) NOT NULL UNIQUE,
    link VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- universal
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    code VARCHAR(255),
    dial_code VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS languages (
    id SERIAL PRIMARY KEY NOT NULL,
    value VARCHAR(64) NOT NULL,
    name VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- policies
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT UNIQUE NOT NULL,
    -- 'privacy' or 'terms'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- ***** TRIGGERS --------------------------------
-- Create the reusable trigger function
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Script to dynamically create triggers for all tables with an updated_at column
DO $$
DECLARE r RECORD;
BEGIN FOR r IN
SELECT table_name
FROM information_schema.columns
WHERE column_name = 'updated_at'
    AND table_schema = 'public' LOOP EXECUTE format(
        '
            CREATE OR REPLACE TRIGGER trigger_update_timestamp
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        ',
        r.table_name
    );
END LOOP;
END $$;
