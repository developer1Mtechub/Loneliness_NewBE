import { stripe } from "../../server.js";
import { getOne, insert, update } from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import {
  sendBadRequestResponse,
  sendNotFoundResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";

export const paySubscription = async (req, res) => {
  const user_id = req.user.id;
  const { stripe_price_id, payment_method_id } = req.body;

  try {
    const find_user = await getOne("users", { id: user_id });
    if (!find_user || !find_user.customer_id) {
      return sendNotFoundResponse(res, "Customer id not found for this user");
    }

    const existingSubscriptions = await stripe.subscriptions.list({
      customer: find_user.customer_id,
      status: "active",
    });

    if (existingSubscriptions.data.length > 0) {
      return sendBadRequestResponse(
        res,
        "You already have an active subscription."
      );
    }

    const result = await stripe.subscriptions.create({
      customer: find_user.customer_id,
      items: [
        {
          price: stripe_price_id,
        },
      ],
      default_payment_method: payment_method_id,
    });
    const package_name = result?.items?.data?.[0]?.plan?.interval;
    await update(
      "users",
      {
        subscription_id: result.id,
        subscription_name: package_name,
        is_subscribed: true,
      },
      { id: user_id }
    );
    // Insert transaction record
    const transaction = await insert("transactions", {
      user_id,
      amount: parseFloat(result.plan.amount / 100),
      type: "SUBSCRIPTION",
      method: "ACTIVE",
    });
    console.log("transaction added ");
    console.log(transaction);

    let admin_amount = parseFloat(result.plan.amount / 100);
    console.log(parseFloat(admin_amount));

    await insert("admin_transactions", { amount: admin_amount });
    console.log(admin_amount);
    const wallet_exists_admin = await getOne("wallet", { is_admin: true });
    if (wallet_exists_admin) {
      const sum =
        parseFloat(wallet_exists_admin.amount) + parseFloat(admin_amount);
      await update("wallet", { amount: sum }, { is_admin: true });
    } else {
      await insert("wallet", {
        amount: parseFloat(admin_amount),
        is_admin: true,
      });
    }
    console.log("admin added ");
    const message = `Subscription activated successfully!`;
    return sendSuccessResponse(res, result, message);
  } catch (error) {
    logger.error(`Error processing subscription: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getActiveSubscription = async (req, res) => {
  const user_id = req.user.id;
  try {
    const find_user = await getOne("users", { id: user_id });
    if (!find_user) {
      return sendNotFoundResponse(res, "User not found");
    }
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: find_user.customer_id,
      status: "active",
    });
    if (existingSubscriptions.data.length === 0) {
      return sendBadRequestResponse(res, "No active subscriptions found");
    }
    const message = `Subscription retrieved successfully!`;
    return sendSuccessResponse(res, existingSubscriptions.data, message);
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const cancelSubscription = async (req, res) => {
  const user_id = req.user.id;
  try {
    const find_user = await getOne("users", { id: user_id });
    if (find_user && !find_user.subscription_id) {
      return sendNotFoundResponse(res, "No subscription found for this user!");
    }
    const result = await stripe.subscriptions.cancel(find_user.subscription_id);

    await update(
      "users",
      { subscription_id: null, is_subscribed: false, subscription_name: "" },
      { id: user_id }
    );
    // Insert transaction record
    const transaction = await update(
      "transactions",
      {
        type: "SUBSCRIPTION",
        method: "INACTIVE",
      },
      { user_id }
    );
    const message = `Subscription canceled successfully!`;
    return sendSuccessResponse(res, result, message);
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
