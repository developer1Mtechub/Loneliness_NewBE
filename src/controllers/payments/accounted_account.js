import { BASE_URL_BACKEND } from "../../config/db.js";
import { stripe } from "../../server.js";
import { getOne, update } from "../../utils/dbUtils.js";
import logger from "../../utils/logger.js";
import {
  sendNotFoundResponse,
  sendServerErrorResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils.js";

export const createConnectedAccount = async (req, res) => {
  const user_id = req.user.id;
  try {
    const user = await getOne("users", { id: user_id });
    if (!user) {
      return sendNotFoundResponse(res, "User not found");
    }
    const result = await stripe.accounts.create({
      type: "standard",
      country: "US",
      email: user.email,
    });
    if (result) {
      await update(
        "users",
        { connected_account_id: result.id },
        { id: user_id }
      );
      return sendSuccessResponse(
        res,
        result,
        `Standard account created successfully!`
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

export const onboardingAccount = async (req, res) => {
  try {
    const user_id = req.user.id;
    const return_url = req.body.return_url;
    const user = await getOne("users", { id: user_id });
    if (!user || !user.connected_account_id) {
      return sendNotFoundResponse(
        res,
        "User not found or user don't have the connected account id"
      );
    }
    const result = await stripe.accountLinks.create({
      account: user.connected_account_id,
      refresh_url: "https://mtechub.com/reauth",
      return_url: `${BASE_URL_BACKEND}/onboarding-success?success=true`,
      type: "account_onboarding",
    });
    return sendSuccessResponse(
      res,
      result,
      `Onboarding link created successfully!`
    );
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const checkRequirements = async (req, res) => {
  try {
    const user_id = req.user.id;
    const user = await getOne("users", { id: user_id });
    if (!user || !user.connected_account_id) {
      return sendNotFoundResponse(
        res,
        "User not found or user don't have the connected account id"
      );
    }
    const account = await stripe.accounts.retrieve(user.connected_account_id);

    // Make sure we have an account object and requirements before proceeding
    if (!account || !account.requirements) {
      return sendNotFoundResponse(
        res,
        "Account or account requirements are not available."
      );
    }

    // Check each field to ensure it's not null before trying to access its properties
    const requirements = account.requirements;
    const result = {
      current_deadline: requirements.current_deadline,
      currently_due: requirements.currently_due || [],
      disabled_reason: requirements.disabled_reason,
      errors: requirements.errors || [],
      eventually_due: requirements.eventually_due || [],
      past_due: requirements.past_due || [],
      pending_verification: requirements.pending_verification || [],
    };
    // Check if all the requirements are empty or null
    const areRequirementsComplete =
      result.current_deadline === null &&
      result.currently_due.length === 0 &&
      result.disabled_reason === null &&
      result.errors.length === 0 &&
      result.eventually_due.length === 0 &&
      result.past_due.length === 0 &&
      result.pending_verification.length === 0;

    if (areRequirementsComplete) {
      await update(
        "users",
        { is_requirements_completed: true },
        { id: user_id }
      );
    }
    return sendSuccessResponse(
      res,
      result,
      `Stripe requirement information retrieved successfully!`
    );
  } catch (error) {
    logger.error(`Error retrieving blocked buddies: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
