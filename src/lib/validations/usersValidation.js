import Joi from "joi";

export const likeDislikeBuddySchema = Joi.object({
  buddy_id: Joi.number().required(),
  like_status: Joi.boolean().required(),
});
export const requestToReleasePaymentSchema = Joi.object({
  request_id: Joi.number().required(),
});

export const userActionsSchema = Joi.object({
  buddy_id: Joi.number().required(),
  type: Joi.string().valid("BLOCK", "REPORT").required(),
  reason: Joi.when("type", {
    is: "REPORT",
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
});
export const buddyActionsSchema = Joi.object({
  user_id: Joi.number().required(),
  type: Joi.string().valid("BLOCK", "REPORT").required(),
  reason: Joi.when("type", {
    is: "REPORT",
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
});

export const deleteUserSchema = Joi.object({
  user_id: Joi.number().required(),
});
export const blockUserSchema = Joi.object({
  user_id: Joi.number().required(),
  is_block: Joi.boolean().required(),
});
