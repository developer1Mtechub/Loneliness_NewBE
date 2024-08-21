import { stripe } from "../../server.js";
import { getOne, insert, update } from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import {
  sendBadRequestResponse,
  sendNotFoundResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";

export const createCustomer = async (req, res) => {
  const user_id = req.user.id;
  try {
    const user = await getOne("users", { id: user_id });
    if (!user) {
      return sendNotFoundResponse(res, "User not found");
    }
    let result;
    if (!user.customer_id) {
      const customer = await stripe.customers.create({
        email: user.email,
      });

      result = await update(
        "users",
        { customer_id: customer.id },
        { id: user_id }
      );
      return sendSuccessResponse(
        res,
        result,
        `Customer on stripe created successfully!`
      );
    } else {
      return sendSuccessResponse(
        res,
        user,
        `User already have customer on stripe!`
      );
    }
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const attachPaymentMethodToCustomer = async (req, res) => {
  const user_id = req.user.id;
  const { payment_method_id } = req.body;

  try {
    // Check if user exists
    const user = await getOne("users", { id: user_id });
    if (!user) {
      return sendNotFoundResponse(res, "User not found");
    }
    if (!user.customer_id) {
      return sendBadRequestResponse(
        res,
        "Customer ID not found, please create customer first."
      );
    }

    // Attach the payment method to the customer
    const paymentMethod = await stripe.paymentMethods.attach(
      payment_method_id,
      {
        customer: user.customer_id,
      }
    );

    // Set the default payment method for the customer
    await stripe.customers.update(user.customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    // Save payment method details to the database
    const data = {
      user_id: user_id,
      customer_id: user.customer_id,
      card_id: paymentMethod.id,
      exp_month: paymentMethod.card.exp_month,
      exp_year: paymentMethod.card.exp_year,
      last_digit: paymentMethod.card.last4,
      finger_print: paymentMethod.card.fingerprint,
      brand_name: paymentMethod.card.brand,
    };
    const result = await insert("cards", data);

    // Send success response
    return sendSuccessResponse(
      res,
      result,
      `Payment Method successfully attached to the customer!`
    );
  } catch (error) {
    logger.error(`Error attaching payment method: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
