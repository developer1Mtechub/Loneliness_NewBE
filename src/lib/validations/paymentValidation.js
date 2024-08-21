import Joi from "joi";

export const attachPaymentSchema = Joi.object({
  payment_method_id: Joi.string().required(),
});

export const transferPaymentSchema = Joi.object({
  payment_method_id: Joi.string().required(),
  buddy_id: Joi.number().integer().required(),
  request_id: Joi.number().integer().when("type", {
    is: "SERVICE",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  type: Joi.string().valid("CHAT", "SERVICE").required(),
  method: Joi.string().valid("CARD", "WALLET").required(),
  amount: Joi.number().integer().required(),
});
export const releasePaymentSchema = Joi.object({
  buddy_id: Joi.number().integer().required(),
  request_id: Joi.number().integer().required(),
});
export const cancelPaymentSchema = Joi.object({
  request_id: Joi.number().integer().required(),
  reason: Joi.string().required(),
});
export const cancelPaymentActionSchema = Joi.object({
  request_id: Joi.number().integer().required(),
  user_id: Joi.number().integer().required(),
  action: Joi.string().valid("ACCEPTED", "REJECTED").required(),
  reason: Joi.string().when("action", {
    is: "REJECTED",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});
export const releasePaymentByAdminSchema = Joi.object({
  request_id: Joi.number().integer().required(),
  user_id: Joi.number().integer().required(),
  buddy_id: Joi.number().integer().required(),
  release_to: Joi.string().valid("BUDDY", "USER").required(),
});

export const withdrawSchema = Joi.object({
  amount: Joi.number().integer().required(),
});
