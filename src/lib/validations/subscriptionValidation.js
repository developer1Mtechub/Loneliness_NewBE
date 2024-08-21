import Joi from "joi";

export const addOrUpdateSub = Joi.object({
  amount: Joi.number().required(),
  name: Joi.string().required(),
  interval_name: Joi.string()
    .valid("quarter", "month", "year"),
  interval_count: Joi.number().integer().min(1).optional(),
});
export const paySubValidation = Joi.object({
  stripe_price_id: Joi.string().required(),
  payment_method_id: Joi.string().required(),
});

export const getTransactionsSchema = Joi.object({
  type: Joi.string().valid("SUBSCRIPTION", "CHAT", "SERVICE").required(),
  page: Joi.string().optional(),
  limit: Joi.string().optional(),
});
