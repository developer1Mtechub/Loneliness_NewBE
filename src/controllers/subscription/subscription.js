import { getTransactionsSchema } from "../../lib/validations/subscriptionValidation.js";
import { stripe } from "../../server.js";
import {
  deleteOne,
  getAll,
  getOne,
  insert,
  update,
} from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import { paginate } from "../../utils/paginationUtils.js";
import {
  sendBadRequestResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";

export const addSubscription = async (req, res) => {
  const { amount, name } = req.body;
  let result;
  let message = "";

  let billingInterval = req.body.interval_name;
  let db_interval_name = billingInterval;
  if (billingInterval === "quarter") {
    billingInterval = "month";
  }

  // Default to monthly if billingInterval is not provided
  let billingIntervalCount;
  switch (billingInterval) {
    case "month":
      billingIntervalCount = 1;
      break;
    case "quarter":
      billingIntervalCount = 3;
      break;
    case "year":
      billingIntervalCount = 1;
      break;
    default:
      billingIntervalCount = 1;
      break;
  }

  try {
    const existSub = await getOne("subscriptions", {
      interval: db_interval_name,
    });
    if (existSub && existSub.interval === db_interval_name) {
      // Update subscription product on stripe
      const stripe_prod = await stripe.products.create({
        name: name,
      });
      console.log(stripe_prod);
      // Update the product price on stripe
      const stripe_price = await stripe.prices.create({
        currency: "usd",
        unit_amount: amount * 100,
        recurring: {
          interval: billingInterval,
          interval_count: billingIntervalCount,
        },
        product: stripe_prod.id,
      });
      // Update subscription
      result = await update(
        "subscriptions",
        {
          amount,
          name: name,
          interval: db_interval_name,
          interval_count: billingIntervalCount,
          stripe_prod_id: stripe_prod.id,
          stripe_price_id: stripe_price.id,
        },
        { interval: billingInterval }
      );
      message = "Subscription updated successfully!";
    } else {
      // Create new subscription product on stripe
      const stripe_prod = await stripe.products.create({
        name: name,
      });
      // Create the product price on stripe
      const stripe_price = await stripe.prices.create({
        currency: "usd",
        unit_amount: amount * 100,
        recurring: {
          interval: billingInterval,
          interval_count: billingIntervalCount,
        },
        product: stripe_prod.id,
      });
      // Insert new subscription
      result = await insert("subscriptions", {
        amount,
        name,
        interval: db_interval_name,
        interval_count: billingIntervalCount,
        stripe_prod_id: stripe_prod.id,
        stripe_price_id: stripe_price.id,
      });
      message = "Subscription created successfully!";
    }
    return sendSuccessResponse(res, result, message);
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const deleteSubscription = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await deleteOne("subscriptions", { id });
    return sendSuccessResponse(
      res,
      result,
      "Subscription deleted successfully"
    );
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getAllSubscriptions = async (req, res) => {
  const page = parseInt(req.params.page, 10) || 1;
  const limit = parseInt(req.params.limit, 10) || 100;
  try {
    const message = "Retrieved all subscriptions successfully!";
    const query = `SELECT s.*, COUNT(u.id) as user_count FROM subscriptions  s      LEFT JOIN users u ON s.interval = u.subscription_name
      GROUP BY s.id
      ORDER BY s.updated_at DESC`;
    const result = await paginate(query, [], page, limit);
    return sendSuccessResponse(res, result, message);
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getOneSubscription = async (req, res) => {
  const { id } = req.params;
  try {
    const message = "Retrieved subscription successfully!";
    const result = await getOne("subscriptions", { id });
    return sendSuccessResponse(res, result, message);
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getAllSubscriptionTransactions = async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const page = parseInt(req.query.page, 10) || 1;
  const type = req.query.type;
  try {
    const { error, value } = getTransactionsSchema.validate(req.query);

    if (error) {
      return sendBadRequestResponse(res, error.details[0].message);
    }
    if (type === "SUBSCRIPTION") {
      const query = `SELECT 
      t.*, 
      json_build_object(
          'full_name', COALESCE(up.full_name, ''),
          'image_url', COALESCE(ui.image_url, '')
      ) AS user
  FROM 
      transactions t 
      LEFT JOIN user_profiles up ON t.user_id = up.user_id
      LEFT JOIN user_images ui ON t.user_id = ui.user_id
  WHERE 
      t.type = $1 
  ORDER BY 
      t.id DESC`;
      const result = await paginate(query, [type], page, limit);
      console.log("query");
      // console.log(query)
      const message = `Subscription retrieved successfully!`;
      return sendSuccessResponse(res, result, message);
    } else {
      const query = `SELECT 
      t.*, 
      json_build_object(
          'full_name', COALESCE(up.full_name, ''),
          'image_url', COALESCE(ui.image_url, '')
      ) AS user,
      json_build_object(
          'full_name', COALESCE(upb.full_name, ''),
          'image_url', COALESCE(uib.image_url, '')
      ) AS buddy
  FROM 
      transactions t 
      LEFT JOIN user_profiles up ON t.user_id = up.user_id
      LEFT JOIN user_images ui ON t.user_id = ui.user_id
      LEFT JOIN user_profiles upb ON t.buddy_id = upb.user_id
      LEFT JOIN user_images uib ON t.buddy_id = uib.user_id
  WHERE 
      t.type = $1 AND is_released = TRUE
  ORDER BY 
      t.id DESC`;
      const result = await paginate(query, [type], page, limit);
      console.log("query");
      // console.log(query)
      const message = `Subscription retrieved successfully!`;
      return sendSuccessResponse(res, result, message);
    }

    //   const query = ` SELECT
    //   t.*,
    //   json_build_object(
    //       'full_name', COALESCE(up.full_name, ''),
    //       'image_url', COALESCE(ui.image_url, '')
    //   ) AS user,
    //   COALESCE(
    //     json_build_object(
    //         'full_name', COALESCE(upb.full_name, ''),
    //         'image_url', COALESCE(uib.image_url, '')
    //     ),
    //     '{}'::json
    //   ) AS buddy
    // FROM
    //   transactions t
    //   LEFT JOIN user_profiles up ON t.user_id = up.user_id
    //   LEFT JOIN user_images ui ON t.user_id = ui.user_id
    //   LEFT JOIN user_profiles upb ON t.buddy_id = upb.user_id
    //   LEFT JOIN user_images uib ON t.buddy_id = uib.user_id
    // WHERE
    //   t.type = $1 AND t.is_released = TRUE
    // ORDER BY
    //   t.id DESC`;
    // const query = `
    // SELECT
    //   t.*,
    //   t.user_id

    // FROM
    //   transactions t
    // WHERE
    //   t.type = $1
    // ORDER BY
    //   t.id DESC`;
    //   const result = await paginate(query, [type], page, limit);
  } catch (error) {
    console.log(error);
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getWallet = async (req, res) => {
  try {
    const result = await getOne("wallet", { is_admin: true });
    const message = `Wallet retrieved successfully!`;
    return sendSuccessResponse(res, result, message);
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
