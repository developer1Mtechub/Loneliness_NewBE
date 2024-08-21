import { sendNotification, stripe } from "../../server.js";
import { getOne, insert, update } from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import { handleNotification } from "../../utils/notificationHelper.js";
import {
  sendBadRequestResponse,
  sendNotFoundResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";
import { generateMeetingCode } from "../payments/utils.js";
import {
  getBuddyRequestHelper,
  getBuddyRequestHelper1,
  getOneRequestHelper,
  getRejectedReasonHelper,
  getUserRequestHelper,
  getUserRequestHelper1,
} from "./utils.js";

export const sendRequest = async (req, res) => {
  const {
    buddy_id,
    category_id,
    booking_date,
    booking_time,
    booking_price,
    hours,
    location,
  } = req.body;
  const user_id = req.user.id;
  try {
    const insertData = {
      user_id,
      buddy_id,
      category_id,
      booking_date,
      booking_time,
      booking_price,
      hours,
      location,
    };
    const user_details = await getOne("users", { id: user_id });
    console.log(user_details);

    const user = await getOne("user_profiles", { user_id });
    console.log(user);
    const buddy = await getOne("users", { id: buddy_id });

    const result = await insert("users_request", insertData);
    if (result) {
      // user pay for it

      //wallet card scenario

      // Notification content
      const title = `New Service Request`;
      const body = `You have a new service request from ${user.full_name}.`;
      const type = "SERVICES";
      const data = {
        sender_id: user_id,
        receiver_id: buddy_id,
        request_id: result.id,
        type: "SERVICE",
        amount: booking_price,
        is_released: false,
      };
      await sendNotification(buddy.device_token, title, body, data);

      // await handleNotification(user_id, buddy.id, buddy, title, body, type);
      return sendSuccessResponse(res, result, "Request send successfully");
    }
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
// send Request v2
export const sendRequestv2 = async (req, res) => {
  const {
    buddy_id,
    category_id,
    booking_date,
    booking_time,
    booking_price,
    hours,
    location,
    payment_method_id,
    method,
  } = req.body;
  const user_id = req.user.id;
  try {
    // generate random 6 digit alphanumeric code for meeting_code
    console.log("sdjhfhjsdfgshdjfhgjsdf");
    let meeting_code = generateMeetingCode();
    const insertData = {
      user_id,
      buddy_id,
      category_id,
      booking_date,
      booking_time,
      booking_price,
      hours,
      meeting_code,
      location,
    };
    // const user_details = await getOne("users", { id: user_id });
    // console.log(user_details)

    const user = await getOne("user_profiles", { user_id });
    console.log(user);

    const user_data = await getOne("users", { id: user_id });
    const buddy = await getOne("users", { id: buddy_id });

    let amount = booking_price;
    let transactionData;

    const result = await insert("users_request", insertData);
    if (result) {
      // user pay for it
      console.log("result");
      console.log(result);
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
          const newUserAmount =
            parseFloat(getWallet.amount) - parseFloat(amount);
          const updateUserWallet = { amount: newUserAmount };
          await update("wallet", updateUserWallet, { user_id });
        }

        transactionData = {
          user_id,
          buddy_id,
          request_id: result.id,
          type: "SERVICE",
          method,
          amount: amount,
          // admin_fee: application_fee,
          is_released: false,
        };
        await insert("transactions", transactionData);
      }
      // else if (method === "CARD") {
      //   logger.info("DEDUCTING FROM CARD");
      //   // payment for CHAT OR SERVICE both will transfer to admin's account
      //   // await stripe.paymentIntents.create({
      //   //   payment_method: payment_method_id,
      //   //   customer: user_data.customer_id,
      //   //   amount: amount * 100,
      //   //   currency: "usd",
      //   //   automatic_payment_methods: { enabled: true },
      //   // });
      //   transactionData = {
      //     user_id,
      //     buddy_id,
      //     request_id: result.id,
      //     type: "SERVICE",
      //     method,
      //     amount: amount,
      //     // admin_fee: application_fee,
      //     is_released: false,
      //   };
      //   await insert("transactions", transactionData);
      // } else if (method === "WALLET_CARD") {
      //   console.log("Wallet Card ");

      //   const getWallet = await getOne("wallet", { user_id });
      //   console.log(getWallet.amount);
      //   const newUserAmount = parseFloat(amount) - parseFloat(getWallet.amount);
      //   console.log(newUserAmount);

      //   const updateUserWallet = { amount: 0 };
      //   await update("wallet", updateUserWallet, { user_id });
      //   // deduct remainingfrom card
      //   logger.info("DEDUCTING FROM CARD");
      //   // payment for CHAT OR SERVICE both will transfer to admin's account
      //   // await stripe.paymentIntents.create({
      //   //   payment_method: payment_method_id,
      //   //   customer: user_data.customer_id,
      //   //   amount: newUserAmount * 100,
      //   //   currency: "usd",
      //   //   automatic_payment_methods: { enabled: true },
      //   // });
      //   transactionData = {
      //     user_id,
      //     buddy_id,
      //     request_id: result.id,
      //     type: "SERVICE",
      //     method,
      //     amount: amount,
      //     // admin_fee: application_fee,
      //     is_released: false,
      //   };
      //   await insert("transactions", transactionData);
      // }

      // Notification content
      const title = `New Service Request`;
      const body = `You have a new service request from ${user.full_name}.`;
      const type = "SERVICES";

      // const data = `
      //   user_id: ${user_id},
      //   buddy_id: ${buddy_id},
      //   request_id: ${result.id},
      //   type: "SERVICE",
      //   amount: ${booking_price},
      //   is_released: ${false},
      // `
      const data = {
        sender_id: user_id,
        receiver_id: buddy_id,
        request_id: result.id,
        type,
        amount: booking_price,
        is_released: false,
      };

      // stringify the data object
      // const data = JSON.stringify(data1);
      const device_token = buddy.device_token;
      console.log(device_token);
      await sendNotification(device_token, title, body, data);
      // await handleNotification(user_id, buddy.id, buddy, title, body, type);
      return sendSuccessResponse(res, result, "Request send successfully");
    }
  } catch (error) {
    logger.error(`Error sending request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
// make api to make meeting_code_verified true and update status to accepted
export const verifyMeetingCode = async (req, res) => {
  // const user_id = req.user.id;
  const { request_id, meeting_code } = req.body;
  try {
    const requestData = await getOne("users_request", {
      id: request_id,
    });
    if (!requestData) {
      return sendNotFoundResponse(res, `Request not found`);
    }
    if (requestData.meeting_code === meeting_code) {
      const result = await update(
        "users_request",
        { meeting_code_verified: true },
        { id: request_id }
      );
      return sendSuccessResponse(
        res,
        result,
        `Meeting code verified successfully`
      );
    } else {
      return sendBadRequestResponse(res, `Invalid meeting code`);
    }
  } catch (error) {
    logger.error(`Error verifying meeting code: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const actionBuddy = async (req, res) => {
  const buddy_id = req.user.id;
  const { request_id, status } = req.body;
  try {
    const requestData = await getOne("users_request", {
      id: request_id,
    });
    if (!requestData) {
      return sendNotFoundResponse(res, `Request not found`);
    }
    const buddy_profile = await getOne("user_profiles", { user_id: buddy_id });
    const user = await getOne("users", { id: requestData.user_id });
    const updateData = { status };
    const result = await update("users_request", updateData, {
      id: request_id,
    });
    if (status === "ACCEPTED") {
      // Notification content
      const title = `Service Accepted`;
      const body = `Your service is accepted by ${buddy_profile.full_name}.`;
      const type = "SERVICES";
      // await handleNotification(buddy_id, user.id, user, title, body, type);
      // =======
      const data = {
        receiver_id: user.id,
        sender_id: buddy_id,
        request_id: result.id,
        type: "SERVICE",
        amount: booking_price,
        is_released: false,
      };

      // stringify the data object
      // const data = JSON.stringify(data1);
      const device_token = user.device_token;
      console.log(device_token);
      await sendNotification(device_token, title, body, data);
    }
    return sendSuccessResponse(
      res,
      result,
      `Request status updated successfully to ${status}`
    );
  } catch (error) {
    logger.error(`Error buddy actions request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
export const actionBuddyv2 = async (req, res) => {
  const buddy_id = req.user.id;
  const { request_id, status } = req.body;
  try {
    const requestData = await getOne("users_request", {
      id: request_id,
    });
    if (!requestData) {
      return sendNotFoundResponse(res, `Request not found`);
    }
    let transactionData;

    const buddy_profile = await getOne("user_profiles", { user_id: buddy_id });
    const user = await getOne("users", { id: requestData.user_id });
    const userWallet = await getOne("wallet", { user_id: requestData.user_id });
    console.log(userWallet);
    const updateData = { status };
    const result = await update("users_request", updateData, {
      id: request_id,
    });
    if (status === "ACCEPTED") {
      // Notification content
      const title = `Service Accepted`;
      const body = `Your service is accepted by ${buddy_profile.full_name}.`;
      const type = "SERVICES";
      // await handleNotification(buddy_id, user.id, user, title, body, type);
      const data = {
        receiver_id: user.id,
        sender_id: buddy_id,
        request_id: result.id,
        type,
      };

      // stringify the data object
      // const data = JSON.stringify(data1);
      const device_token = user.device_token;
      console.log(device_token);
      await sendNotification(device_token, title, body, data);
    } else {
      console.log("REJECTED");
      console.log(requestData);
      console.log(requestData.booking_price);
      const getWallet = await getOne("wallet", {
        user_id: requestData.user_id,
      });
      console.log("getWallet.amount");

      let amount_data_paid = requestData.booking_price;
      console.log(getWallet);
      if (getWallet === undefined || getWallet.amount === null) {
        // const updateUserWallet = { amount: amount_data_paid };
        const newWallet = {
          user_id: requestData.user_id,
          amount: parseFloat(amount_data_paid),
        };
        await insert("wallet", newWallet);
        // await update("wallet", updateUserWallet, { user_id:requestData.user_id });
        transactionData = {
          user_id: requestData.user_id,
          buddy_id,
          request_id,
          type: "SERVICE",
          method: "ACTIVE",

          amount: amount_data_paid,
          is_refunded: true,
          admin_fee: 0,
          is_released: false,
        };
        await insert("transactions", transactionData);
      } else {
        console.log("HELLO");
        const newUserAmount =
          parseFloat(getWallet.amount) + parseFloat(amount_data_paid);
        const updateUserWallet = { amount: newUserAmount };
        await update("wallet", updateUserWallet, {
          user_id: requestData.user_id,
        });
        transactionData = {
          user_id: requestData.user_id,
          buddy_id,
          request_id,
          type: "SERVICE",
          is_refunded: true,
          method: "ACTIVE",

          amount: newUserAmount,
          admin_fee: 0,
          is_released: false,
        };
        await insert("transactions", transactionData);
      }
    }
    return sendSuccessResponse(
      res,
      result,
      `Request status updated successfully to ${status}`
    );
  } catch (error) {
    logger.error(`Error buddy actions request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const requestBack = async (req, res) => {
  const buddy_id = req.user.id;
  const { request_id, booking_date, booking_time, location } = req.body;
  try {
    const requestData = await getOne("users_request", {
      id: request_id,
    });
    if (!requestData) {
      return sendNotFoundResponse(res, `Request not found`);
    }
    const buddy_profile = await getOne("user_profiles", {
      user_id: requestData.buddy_id,
    });
    const user = await getOne("users", { id: req.user.id });
    const insertData = {
      users_request_id: request_id,
      booking_date,
      booking_time,
      location,
    };
    const result = await insert("buddy_request_back", insertData);
    if (result) {
      // Notification content
      const user = await getOne("users", { id: requestData.user_id });

      const title = `Service Request Back`;
      const body = `You have got the service request back from ${buddy_profile.full_name}.`;
      const type = "SERVICES";
      // await handleNotification(buddy_id, user.id, user, title, body, type);
      const data = {
        receiver_id: user.id,
        sender_id: buddy_id,
        request_id: request_id,
        type,
      };

      // stringify the data object
      // const data = JSON.stringify(data1);
      const device_token = user.device_token;
      console.log(device_token);
      await sendNotification(device_token, title, body, data);
      await update(
        "users_request",
        { status: "REQUEST_BACK" },
        { id: request_id }
      );
      return sendSuccessResponse(
        res,
        result,
        "Request send back to user successfully"
      );
    }
  } catch (error) {
    logger.error(`Error sending request back: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const actionUser = async (req, res) => {
  const user_id = req.user.id;
  const { request_back_id, status } = req.body;
  try {
    const request = await getOne("users_request", { user_id: user_id });
    console.log("request");
    console.log(request);

    const user_profile = await getOne("user_profiles", { user_id });
    const requestData = await getOne("buddy_request_back", {
      id: request_back_id,
    });
    const buddy = await getOne("users", { id: request.buddy_id });
    if (!requestData) {
      return sendNotFoundResponse(res, `Request not found`);
    }
    const updateData = { status };
    const result = await update("buddy_request_back", updateData, {
      id: request_back_id,
    });
    let transactionData;
    if (status === "ACCEPTED") {
      // Notification content
      const title = `Request Accepted`;
      const body = `Your request has been accepted by ${user_profile.full_name}.`;
      const type = "SERVICES";
      // await handleNotification(user_id, buddy.id, buddy, title, body, type);
      const data = {
        sender_id: user_id,
        receiver_id: buddy.id,
        request_back_id: request_back_id,
        type,
      };

      // stringify the data object
      // const data = JSON.stringify(data1);
      const device_token = buddy.device_token;
      console.log(device_token);
      await sendNotification(device_token, title, body, data);
    } else {
      console.log("REJECTED");
      console.log(requestData);
      console.log(requestData.booking_price);
      const getWallet = await getOne("wallet", { user_id: request.user_id });
      console.log("getWallet.amount");

      let amount_data_paid = request.booking_price;
      console.log(getWallet);
      if (getWallet === undefined || getWallet.amount === null) {
        // const updateUserWallet = { amount: amount_data_paid };
        const newWallet = {
          user_id: request.user_id,
          amount: parseFloat(amount_data_paid),
        };
        await insert("wallet", newWallet);
        // await update("wallet", updateUserWallet, { user_id:user_id });
        transactionData = {
          user_id: user_id,
          buddy_id: request.buddy_id,
          request_id: request.id,
          type: "SERVICE",
          method: "ACTIVE",

          amount: amount_data_paid,
          is_refunded: true,
          admin_fee: 0,
          is_released: false,
        };
        await insert("transactions", transactionData);
      } else {
        console.log("HELLO");
        const newUserAmount =
          parseFloat(getWallet.amount) + parseFloat(amount_data_paid);
        const updateUserWallet = { amount: newUserAmount };
        await update("wallet", updateUserWallet, { user_id: request.user_id });
        transactionData = {
          user_id: request.user_id,
          buddy_id: request.buddy_id,
          request_id: request.id,
          type: "SERVICE",
          is_refunded: true,
          method: "ACTIVE",

          amount: amount_data_paid,
          admin_fee: 0,
          is_released: false,
        };
        await insert("transactions", transactionData);
      }
    }
    return sendSuccessResponse(
      res,
      result,
      `Request status updated successfully to ${status}`
    );
  } catch (error) {
    logger.error(`Error update request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getOneRequest = async (req, res) => {
  const user_id = req.user.id;
  const id = parseInt(req.params.id, 10);
  try {
    const result = await getOneRequestHelper(id, "USER");
    return sendSuccessResponse(res, result, `Request retrieved successfully`);
  } catch (error) {
    logger.error(`Error retrieving request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
export const getOneRequestBuddy = async (req, res) => {
  const user_id = req.user.id;
  const id = parseInt(req.params.id, 10);
  try {
    const result = await getOneRequestHelper(id, "BUDDY");
    return sendSuccessResponse(res, result, `Request retrieved successfully`);
  } catch (error) {
    logger.error(`Error retrieving request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getAllUserRequest = async (req, res) => {
  const user_id = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  try {
    let result;
    // if (status) {
    result = await getUserRequestHelper(
      user_id,
      status,
      parseInt(page),
      parseInt(limit)
    );
    // } else {
    //   result = await getUserRequestHelper1(
    //     user_id,
    //     parseInt(page),
    //     parseInt(limit)
    //   );
    // }
    if (!status) {
      // Remove entire request objects where buddy_request_back.buddy_status is "ACCEPTED"
      result.data = result.data.filter(
        (request) =>
          !(
            request.buddy_request_back &&
            request.buddy_request_back.buddy_status === "ACCEPTED"
          )
      );
    } else if (status === "ACCEPTED") {
      // Include all requests with status "ACCEPTED" and "REQUEST_BACK" where buddy_status is "ACCEPTED"
      // Include all requests with status "ACCEPTED" and "REQUEST_BACK" where buddy_status is "ACCEPTED"
      result.data = result.data.filter(
        (request) =>
          request.status === "ACCEPTED" ||
          (request.status === "REQUEST_BACK" &&
            request.buddy_request_back &&
            request.buddy_request_back.buddy_status === "ACCEPTED")
      );
    }

    return sendSuccessResponse(res, result, `Requests Retrieved successfully!`);
  } catch (error) {
    logger.error(`Error retrieving requests: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getAllBuddyRequest = async (req, res) => {
  const user_id = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  try {
    // let result;
    const result = await getBuddyRequestHelper(
      user_id,
      status,
      parseInt(page),
      parseInt(limit)
    );
    // console.log(result)
    if (!status) {
      // Remove entire request objects where buddy_request_back.buddy_status is "ACCEPTED"
      result.data = result.data.filter(
        (request) =>
          !(
            request.buddy_request_back &&
            request.buddy_request_back.buddy_status === "ACCEPTED"
          )
      );
    } else if (status === "ACCEPTED") {
      // Include all requests with status "ACCEPTED" and "REQUEST_BACK" where buddy_status is "ACCEPTED"
      // Include all requests with status "ACCEPTED" and "REQUEST_BACK" where buddy_status is "ACCEPTED"
      result.data = result.data.filter(
        (request) =>
          request.status === "ACCEPTED" ||
          (request.status === "REQUEST_BACK" &&
            request.buddy_request_back &&
            request.buddy_request_back.buddy_status === "ACCEPTED")
      );
    }
    // if (status) {
    //   result = await getBuddyRequestHelper(
    //     user_id,
    //     status,
    //     parseInt(page),
    //     parseInt(limit)
    //   );
    // } else {
    //   result = await getBuddyRequestHelper1(
    //     user_id,
    //     parseInt(page),
    //     parseInt(limit)
    //   );
    // }
    return sendSuccessResponse(res, result, `Requests Retrieved successfully!`);
  } catch (error) {
    logger.error(`Error retrieving requests: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const getAllRejectedPaymentRequests = async (req, res) => {
  const page = parseInt(req.params.page, 10) || 1;
  const limit = parseInt(req.params.limit, 10) || 50;
  try {
    const result = await getRejectedReasonHelper(page, limit);
    return sendSuccessResponse(res, result, `Requests retrieved successfully!`);
  } catch (error) {
    logger.error(`Error update request: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
