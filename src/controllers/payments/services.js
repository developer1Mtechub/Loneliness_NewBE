import { sendNotification, stripe } from "../../server.js";
import { getAll, getOne, insert, update } from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import { paginate } from "../../utils/paginationUtils.js";
import {
  sendBadRequestResponse,
  sendConflictResponse,
  sendNotFoundResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";
import { retrieveCards } from "./utils.js";
import pool from "../../config/index.js";

// TODO: send the notification according to type CHAT | SERVICE

export const transferPayment = async (req, res) => {
  const user_id = req.user.id;
  const { payment_method_id, buddy_id, request_id, type, amount, method } =
    req.body;

  try {
    const user = await getOne("users", { id: user_id });
    const user1 = await getOne("user_profiles", { user_id: user_id });

    if (!user) {
      return sendNotFoundResponse(res, "User not found");
    }
    const buddy = await getOne("users", { id: buddy_id });
    if (!buddy) {
      return sendNotFoundResponse(res, "Buddy not found ");
    }
    if (!user.subscription_id) {
      return sendNotFoundResponse(
        res,
        "subscription id not found, please create subscription first."
      );
    }

    const transactionExists = await getOne("transactions", {
      request_id,
      buddy_id,
      user_id,
    });
    if (transactionExists) {
      return sendConflictResponse(res, "You've already paid for this service");
    }

    const request = await getOne("users_request", {
      id: request_id,
      buddy_id,
    });
    if (request_id && !request) {
      return sendConflictResponse(
        res,
        "Request not found or not associated with this buddy"
      );
    }
    if (request_id && request.status === "PAID") {
      return sendConflictResponse(
        res,
        "You're trying to pay for a service that is already paid"
      );
    }

    if (method === "WALLET") {
      logger.info("DEDUCTING FROM WALLET");
      const getWallet = await getOne("wallet", { user_id });
      console.log("getWallet.amount");

      console.log(getWallet);
      if (
        getWallet === undefined ||
        getWallet.amount < parseFloat(amount) ||
        getWallet.amount === null
      ) {
        return sendBadRequestResponse(
          res,
          "Insufficient funds in wallet for this transaction!"
        );
      } else {
        console.log("HELLO");
        const newUserAmount = parseFloat(getWallet.amount) - parseFloat(amount);
        const updateUserWallet = { amount: newUserAmount };
        await update("wallet", updateUserWallet, { user_id });
      }
    }

    if (method === "CARD") {
      logger.info("DEDUCTING FROM CARD");
      // payment for CHAT OR SERVICE both will transfer to admin's account
      await stripe.paymentIntents.create({
        payment_method: payment_method_id,
        customer: user.customer_id,
        amount: amount * 100,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
      });
    }

    const commission = await getAll("commission");

    // commission rate in percentage like if 10 means 10%
    const commission_rate = commission[0].per_hour_rate;

    // total price of the service that has already paid and stored in the admin account on stripe.
    const total_price = parseInt(amount);
    const commission_in_percent = commission_rate / 100;
    // get the admin fee
    const application_fee = commission_in_percent * total_price;
    let transactionData;
    if (type === "CHAT") {
      console.log("HELLO");
      transactionData = {
        user_id,
        buddy_id,
        request_id,
        type,
        method,
        amount: amount,
        // admin_fee: application_fee,
        is_released: true,
      };
      await insert("transactions", transactionData);
      await insert("admin_transactions", { amount: amount });
      console.log("application_fee");

      console.log(amount);
      const wallet_exists = await getOne("wallet", { is_admin: true });
      if (wallet_exists) {
        const sum = parseFloat(wallet_exists.amount) + parseFloat(amount);
        await update("wallet", { amount: sum }, { is_admin: true });
      } else {
        await insert("wallet", {
          amount: parseFloat(amount),
          is_admin: true,
        });
      }
    }
    if (type === "SERVICE") {
      console.log("SERVICEHJJDB");
      transactionData = {
        user_id,
        buddy_id,
        request_id,
        type,
        method,
        amount: amount,
        admin_fee: application_fee,
        is_released: false,
      };
      await insert("transactions", transactionData);
      await insert("admin_transactions", { amount: application_fee });
      console.log("application_fee");

      console.log(application_fee);
      const wallet_exists = await getOne("wallet", { is_admin: true });
      if (wallet_exists) {
        const sum =
          parseFloat(wallet_exists.amount) + parseFloat(application_fee);
        await update("wallet", { amount: sum }, { is_admin: true });
      } else {
        await insert("wallet", {
          amount: parseFloat(application_fee),
          is_admin: true,
        });
      }
    }

    await update(
      "users_request",
      { status: "PAID", paid_at: new Date() },
      { id: request_id }
    );
    // Notification content
    const title = `New Payment Received`;
    const body = `You got a new payment from ${user1.full_name}.`;
    const notification_type = "PAYMENT";
    const data = {
      sender_id: user_id,
      receiver_id: buddy_id,
      request_id: request_id,
      type: notification_type,
    };

    // stringify the data object
    // const data = JSON.stringify(data1);
    const device_token = buddy.device_token;
    console.log(device_token);
    await sendNotification(device_token, title, body, data);
    // await handleNotification(
    //   user_id,
    //   buddy_id,
    //   buddy,
    //   title,
    //   body,
    //   notification_type
    // );

    return sendSuccessResponse(
      res,
      null,
      `Your transaction of $${amount} has been successfully done!`
    );
  } catch (error) {
    console.log(error);
    console.log(error.type);
    if (error.type === "StripeInvalidRequestError") {
      return sendBadRequestResponse(
        res,
        "Unable to process the payment, additionally please make sure the payment method is belong to the user.",
        "STRIPE_BADE_REQUEST_ERROR"
      );
    }
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const releasePayment = async (req, res) => {
  const user_id = req.user.id;
  const { buddy_id, request_id } = req.body;

  try {
    const buddy = await getOne("users", { id: buddy_id });
    const buddy_profile = await getOne("user_profiles", { user_id: buddy_id });

    const user = await getOne("users", { id: user_id });
    const request = await getOne("users_request", {
      id: request_id,
      is_released: true,
    });
    if (request) {
      return sendConflictResponse(
        res,
        "Payment has already been released for this service."
      );
    }
    const user_profile = await getOne("user_profiles", { user_id });
    if (!buddy) {
      return sendNotFoundResponse(res, "Buddy not found ");
    }
    const transactions = await getOne("transactions", {
      request_id,
      buddy_id,
      user_id,
    });
    if (!transactions) {
      return sendConflictResponse(
        res,
        "No transaction history found for this service."
      );
    }

    const commission = await getAll("commission");

    // commission rate in percentage like if 10 means 10%
    const commission_rate = commission[0].per_hour_rate;

    // total price of the service that has already paid and stored in the admin account on stripe.
    const total_price = parseInt(transactions.amount);
    const commission_in_percent = commission_rate / 100;
    // get the admin fee
    const application_fee = commission_in_percent * total_price;
    // const buddy_amount=parseFloat(total_price)-parseFloat(application_fee)
    // send amount to admin
    await insert("admin_transactions", { amount: application_fee });
    console.log(application_fee);
    const wallet_exists_admin = await getOne("wallet", { is_admin: true });
    if (wallet_exists_admin) {
      const sum =
        parseFloat(wallet_exists_admin.amount) + parseFloat(application_fee);
      await update("wallet", { amount: sum }, { is_admin: true });
    } else {
      await insert("wallet", {
        amount: parseFloat(application_fee),
        is_admin: true,
      });
    }
    console.log("admin added ");
    // get the buddy amount for service while deducting the admin fee
    const buddy_transfer_amount = total_price - application_fee;
    // const transfer = await stripe.transfers.create({
    //   amount: buddy_transfer_amount * 100,
    //   currency: "usd",
    //   destination: buddy.connected_account_id,
    // });

    const walletExists = await getOne("wallet", { buddy_id });
    let result;
    if (walletExists) {
      const newAmount =
        parseFloat(walletExists.amount) + parseFloat(buddy_transfer_amount);
      const data = { amount: newAmount };
      result = await update("wallet", data, { buddy_id });
    } else {
      // const data = { buddy_id, amount: transactions.amount };
      const data = { buddy_id, amount: buddy_transfer_amount };

      result = await insert("wallet", data);
    }

    await update(
      "users_request",
      {
        is_released: true,
        status: "COMPLETED",
        release_payment_requests: "ACCEPTED",
        release_to: "BUDDY",
      },
      { id: request_id }
    );
    console.log("HELLO");
    console.log(application_fee);
    console.log(buddy_transfer_amount);

    // await update(
    //   "transactions",
    //   { is_released: true },
    //   {
    //     request_id,
    //     buddy_id,
    //     user_id,
    //     admin_fee:parseInt(application_fee),
    //     amount:parseInt(buddy_transfer_amount),

    //   }
    // );
    // update the transaction with the admin fee and buddy amount

    const updateTransaction = `UPDATE transactions SET admin_fee = $1, amount = $2 
WHERE request_id = $3 AND buddy_id = $4 AND user_id = $5`;
    const updateTransactionValues = [
      application_fee,
      buddy_transfer_amount,
      request_id,
      buddy_id,
      user_id,
    ];
    await pool.query(updateTransaction, updateTransactionValues);

    // Notification content
    const title = `New Payment Released`;
    const body = `Your payment has been released by ${user_profile.full_name}.`;
    const type = "PAYMENT";
    // await handleNotification(user_id, buddy_id, buddy, title, body, type);
    const data = {
      sender_id: user_id,
      receiver_id: buddy_id,
      request_id: request_id,
      type,
    };

    // stringify the data object
    // const data = JSON.stringify(data1);
    const device_token = buddy.device_token;
    console.log(device_token);
    await sendNotification(device_token, title, body, data);
    // Notification content
    const title_2 = `Service Completed`;
    const body_2 = `How was your experience with ${buddy_profile.full_name}? rate now!`;
    const type_2 = "SERVICES";
    // await handleNotification(buddy_id, user_id, user, title_2, body_2, type_2);
    const data1 = {
      receiver_id: user_id,
      sender_id: buddy_id,
      request_id: request_id,
      type: type_2,
    };

    // stringify the data object
    // const data = JSON.stringify(data1);
    const device_token1 = buddy.device_token;
    console.log(device_token1);
    await sendNotification(device_token1, title_2, body_2, data1);
    return sendSuccessResponse(
      res,
      result,
      `Payment of $${transactions.amount} has been released to buddy!`
    );
  } catch (error) {
    if (error.code === "payment_intent_unexpected_state") {
      return sendBadRequestResponse(res, error.message);
    }
    logger.error(`Error releasing payment: ${error}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const cancelPaymentRequest = async (req, res) => {
  const user_id = req.user.id;
  const { request_id, reason } = req.body;

  try {
    const user = await getOne("users", { id: user_id });
    const user_profile = await getOne("user_profiles", { user_id });
    if (!user) {
      return sendNotFoundResponse(res, "User not found");
    }
    const requestExists = await getOne("users_request", { id: request_id });
    if (!requestExists) {
      return sendNotFoundResponse(res, "Request not found");
    }
    const buddy = await getOne("users", { id: requestExists.buddy_id });

    const data = { canceled_status: "REQUESTED", canceled_reason: reason };
    const result = await update("users_request", data, { id: request_id });
    // Notification content
    const title = `Payment Canceled Request`;
    const body = `Your got a new payment cancel request by ${user_profile.full_name}.`;
    const type = "PAYMENT";
    // await handleNotification(
    //   user_id,
    //   requestExists.buddy_id,
    //   buddy,
    //   title,
    //   body,
    //   type
    // );
    const data1 = {
      sender_id: user_id,
      receiver_id: requestExists.buddy_id,
      request_id: request_id,
      type: type,
    };

    // stringify the data object
    // const data = JSON.stringify(data1);
    const device_token1 = buddy.device_token;
    console.log(device_token1);
    await sendNotification(device_token1, title, body, data1);
    return sendSuccessResponse(
      res,
      result,
      `Successfully submitted the request to cancel the payment!`
    );
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const cancelPaymentActions = async (req, res) => {
  const buddy_id = req.user.id;
  const { user_id, request_id, action, reason } = req.body;

  try {
    const buddy = await getOne("users", { id: buddy_id });
    const user = await getOne("users", { id: user_id });
    const buddy_profile = await getOne("user_profiles", { user_id: buddy_id });
    if (!buddy) {
      return sendNotFoundResponse(res, "Buddy not found");
    }
    const requestExists = await getOne("users_request", { id: request_id });
    if (!requestExists) {
      return sendNotFoundResponse(res, "Request not found");
    }

    if (action === "ACCEPTED") {
      const transaction = await getOne("transactions", {
        request_id,
        buddy_id,
        user_id,
      });
      if (!transaction) {
        return sendNotFoundResponse(res, "Transaction not found");
      }
      const userWallet = await getOne("wallet", { user_id });
      let result;
      if (userWallet) {
        const newUserAmount =
          parseFloat(userWallet.amount) + parseFloat(transaction.amount);
        const updateUserWallet = { amount: newUserAmount };
        result = await update("wallet", updateUserWallet, { user_id });
        await update(
          "transactions",
          { is_refunded: true },
          {
            request_id,
            buddy_id,
            user_id,
          }
        );
      } else {
        const newUserWallet = {
          user_id,
          amount: parseFloat(transaction.amount),
        };
        result = await insert("wallet", newUserWallet);
      }
    }

    const data = { canceled_status: action, rejected_reason_buddy: reason };
    const result = await update("users_request", data, { id: request_id });
    if (action === "ACCEPTED") {
      // Notification content
      const title = `Accepted Payment Canceled Request`;
      const body = `Your  request has been accepted by ${buddy_profile.full_name}.`;
      const type = "PAYMENT";
      const data1 = {
        receiver_id: user_id,
        sender_id: buddy_id,
        request_id: request_id,
        type: type,
      };

      // stringify the data object
      // const data = JSON.stringify(data1);
      const device_token1 = user.device_token;
      console.log(device_token1);
      await sendNotification(device_token1, title, body, data1);
      // await handleNotification(buddy_id, user_id, user, title, body, type);
      // Notification content
      const title_2 = `Service Completed`;
      const body_2 = `How was your experience with ${buddy_profile.full_name}? rate now!`;
      const type_2 = "SERVICES";
      // await handleNotification(
      //   buddy_id,
      //   user_id,
      //   user,
      //   title_2,
      //   body_2,
      //   type_2
      // );
      const data2 = {
        receiver_id: user_id,
        sender_id: buddy_id,
        request_id: request_id,
        type: type_2,
      };

      // stringify the data object
      // const data = JSON.stringify(data1);
      const device_token2 = user.device_token;
      console.log(device_token2);
      await sendNotification(device_token2, title_2, body_2, data2);

      await update(
        "users_request",
        {
          is_released: true,
          status: "COMPLETED",
          release_payment_requests: "ACCEPTED",
          release_to: "USER",
        },
        { id: request_id }
      );
    }
    if (action === "REJECTED") {
      // Notification content
      const title = `Rejected Payment Cancel Request`;
      const body = `Your request has been rejected by ${buddy_profile.full_name}.`;
      const type = "PAYMENT";
      // await handleNotification(buddy_id, user_id, user, title, body, type);
      const data2 = {
        receiver_id: user_id,
        sender_id: buddy_id,
        request_id: request_id,
        type,
      };

      // stringify the data object
      // const data = JSON.stringify(data1);
      const device_token2 = user.device_token;
      console.log(device_token2);
      await sendNotification(device_token2, title, body, data2);
    }

    return sendSuccessResponse(
      res,
      result,
      `payment request successfully ${action}`
    );
  } catch (error) {
    logger.error(`Error canceling payment actions: ${error}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const releasePaymentByAdmin = async (req, res) => {
  const { buddy_id, user_id, request_id, release_to } = req.body;

  try {
    const buddy = await getOne("users", { id: buddy_id });
    if (!buddy || !buddy.connected_account_id) {
      return sendNotFoundResponse(
        res,
        "Buddy not found Or don't have the connected account"
      );
    }
    const requestExists = await getOne("users_request", { id: request_id });
    if (!requestExists) {
      return sendNotFoundResponse(res, "Request not found");
    }

    const transaction = await getOne("transactions", {
      request_id,
      buddy_id,
      user_id,
    });
    if (!transaction) {
      return sendNotFoundResponse(res, "Transaction not found");
    }
    console.log(transaction);
    let admin_fee = transaction.admin_fee;

    if (release_to === "BUDDY") {
      let total_amount_released =
        parseFloat(transaction.amount) - parseFloat(admin_fee);
      console.log("HELLO");
      console.log(total_amount_released);
      // const transfer = await stripe.transfers.create({
      //   amount: total_amount_released * 100,
      //   currency: "usd",
      //   destination: buddy.connected_account_id,
      // });

      const buddyWallet = await getOne("wallet", { buddy_id });
      if (buddyWallet) {
        const newAmount =
          parseFloat(buddyWallet.amount) + parseFloat(total_amount_released);
        await update("wallet", { amount: newAmount }, { buddy_id });
      } else {
        const newWallet = {
          buddy_id,
          amount: parseFloat(total_amount_released),
        };
        await insert("wallet", newWallet);
      }
      // let admin_amount=parseFloat(result.plan.amount / 100);
      // console.log(parseFloat(admin_amount));

      // await insert("admin_transactions", { amount: admin_fee });
      console.log(admin_fee);
      const wallet_exists_admin = await getOne("wallet", { is_admin: true });
      if (wallet_exists_admin) {
        const sum =
          parseFloat(wallet_exists_admin.amount) + parseFloat(admin_fee);
        await update("wallet", { amount: sum }, { is_admin: true });
      } else {
        await insert("wallet", {
          amount: parseFloat(admin_fee),
          is_admin: true,
        });
      }
      console.log("admin added transaction");

      await update(
        "transactions",
        { is_released: true },
        {
          request_id,
          buddy_id,
          user_id,
        }
      );

      await update(
        "users_request",
        {
          status: "COMPLETED",
          is_released: true,
          release_payment_requests: "ACCEPTED",
          release_to: "BUDDY",
        },
        { id: request_id }
      );

      return sendSuccessResponse(
        res,
        null,
        `Payment of $${total_amount_released} has been released to buddy!`
      );
    } else if (release_to === "USER") {
      const userWallet = await getOne("wallet", { user_id });
      if (userWallet) {
        const newAmount =
          parseFloat(userWallet.amount) + parseFloat(transaction.amount);
        await update("wallet", { amount: newAmount }, { user_id });
        await update(
          "transactions",
          { is_refunded: true },
          {
            request_id,
            buddy_id,
            user_id,
          }
        );
      } else {
        const newWallet = { user_id, amount: parseFloat(transaction.amount) };
        await insert("wallet", newWallet);
        await update(
          "transactions",
          { is_refunded: true },
          {
            request_id,
            buddy_id,
            user_id,
          }
        );
      }

      await update(
        "users_request",
        {
          canceled_status: "RELEASED_BY_ADMIN_TO_USER",
          is_released: true,
          status: "COMPLETED",
          release_to: "USER",
        },
        { id: request_id }
      );

      return sendSuccessResponse(
        res,
        null,
        `Payment release to user successfully!`
      );
    } else {
      return sendBadRequestResponse(
        res,
        "Invalid release_to value. It must be either 'buddy' or 'user'."
      );
    }
  } catch (error) {
    if (error.code === "payment_intent_unexpected_state") {
      return sendBadRequestResponse(res, error.message);
    }
    logger.error(`Error in releasing payment by admin: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getUserTransactions = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 20);
  const { is_refunded } = req.query;

  try {
    const user = await getOne("users", { id: user_id });
    if (!user) {
      return sendNotFoundResponse(res, "User not found");
    }

    const role = await getOne("roles", { id: user.role_id });
    if (!role) {
      return sendNotFoundResponse(res, "User doesn't have any role");
    }

    console.log(role);

    const role_name = role.name;

    let query,
      params = [user_id];

    if (role_name === "BUDDY") {
      const user_wallet = await getOne("wallet", { buddy_id: user_id });
      query = `
        SELECT 
          t.*, 
          up.full_name,
          array_agg(DISTINCT jsonb_build_object('image_url', ui.image_url, 'public_id', ui.public_id)) AS images
        FROM transactions t
        LEFT JOIN user_profiles up ON t.user_id = up.user_id
        LEFT JOIN user_images ui ON t.user_id = ui.user_id
        WHERE t.buddy_id = $1 AND t.is_released = TRUE`;

      query += `
        GROUP BY 
          t.id, 
          up.full_name
        ORDER BY t.created_at DESC`;

      const result = await paginate(query, params, page, limit);

      // if (!result || result.data.length === 0) {
      //   return sendSuccessResponse(res, [], `Transaction records are empty`);
      // }

      return sendSuccessResponse(
        res,
        {
          wallet_amount: user_wallet?.amount || 0,
          transactions: result || [],
        },
        `Transaction records retrieved successfully!`
      );
    } else if (role_name === "USER") {
      const user_wallet = await getOne("wallet", { user_id });

      query = `
        SELECT 
          t.*, 
          up.full_name,
          array_agg(DISTINCT jsonb_build_object('image_url', ui.image_url, 'public_id', ui.public_id)) AS images

        FROM transactions t
        LEFT JOIN user_profiles up ON t.buddy_id = up.user_id
        LEFT JOIN user_images ui ON t.buddy_id = ui.user_id
      
        WHERE t.user_id = $1`;

      if (is_refunded !== undefined) {
        query += ` AND t.is_refunded = $${params.length + 1}`;
        params.push(is_refunded);
      } else {
        query += ` AND t.is_refunded = FALSE`;
      }

      query += `
        GROUP BY 
          t.id, 
          up.full_name
        ORDER BY t.created_at DESC`;

      const result = await paginate(query, params, page, limit);

      if (!result || result.data.length === 0) {
        return sendSuccessResponse(res, [], `Transaction records are empty`);
      }

      return sendSuccessResponse(
        res,
        {
          wallet_amount: user_wallet?.amount || 0,
          transactions: result,
        },
        `Transaction records retrieved successfully!`
      );
    } else {
      return sendBadRequestResponse(res, "Invalid role");
    }
  } catch (error) {
    logger.error(`Error retrieving transactions: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getUserCards = async (req, res) => {
  const user_id = req.user.id;
  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 20);
  const offset = (page - 1) * limit;
  try {
    // const result = await retrieveCards(user_id, limit, offset);
    const message = `Card record retrieved successfully!`;
    const result = await getAll("cards", { user_id });
    sendSuccessResponse(res, result, message);
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const withdraw = async (req, res) => {
  const buddy_id = req.user.id;
  const { amount } = req.body;
  try {
    const user = await getOne("users", { id: buddy_id });
    console.log(user);
    if (!user) {
      return sendBadRequestResponse(res, "User not found ");
    }
    // const wallet = await getOne("wallet", { buddy_id });
    // console.log(wallet)
    // console.log(amount)
    // console.log(wallet.amount)

    // if (parseFloat(amount) > parseFloat(wallet.amount)) {
    //   console.log("HELLO")
    //   console.log(parseFloat(amount))
    //   console.log(parseFloat(wallet.amount))

    //   return sendBadRequestResponse(
    //     res,
    //     "Transaction failed: Insufficient funds in your wallet.",
    //     "INSUFFICIENT_BALANCE"
    //   );
    // }else{
    console.log("shjdgfjhsdf");
    // console.log(user.connected_account_id);

    // Create a payout to the user's bank account

    // safasf
    // await stripe.payouts.create(
    //   {
    //     amount: amount * 100,
    //     currency: "chf",
    //   },
    //   {
    //     stripeAccount: user.connected_account_id,
    //   }
    // );

    // const result = await insert("transactions", {
    //   buddy_id,
    //   amount,
    //   credit: FALSE,
    // });

    // // Update the user's wallet balance in your database
    // const new_amount = parseFloat(wallet.amount) - parseFloat(amount);
    // await update("wallet", { amount: new_amount }, { buddy_id });

    // return sendSuccessResponse(
    //   res,
    //   result,
    //   `Your withdraws were successfully done!`
    // );
    // }
  } catch (error) {
    console.log(error);
    if (error?.code === "balance_insufficient") {
      return sendBadRequestResponse(
        res,
        "Your balance is insufficient for this withdrawal",
        "INSUFFICIENT_AMOUNT_STRIPE"
      );
    }
    if (error?.code === "amount_too_small") {
      return sendBadRequestResponse(res, "Amount is too small to withdrawal");
    }
    logger.error(`Error canceling payment actions: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const checkChatPayment = async (req, res) => {
  const user_id = req.user.id;
  const { user_id: buddy_id } = req.body;
  try {
    const result = await getOne("transactions", {
      user_id,
      buddy_id,
      is_released: true,
    });
    if (!result) {
      return sendNotFoundResponse(
        res,
        "Chat payment transaction not found between these two users."
      );
    }
    return sendSuccessResponse(
      res,
      "Transaction Found",
      `User has paid for chat!`
    );
  } catch (error) {
    logger.error(`Error checking payment of chat: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
