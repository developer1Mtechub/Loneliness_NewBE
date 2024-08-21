import Joi from "joi";

export const sendRequestSchema = Joi.object({
  buddy_id: Joi.number().integer().required(),
  category_id: Joi.number().integer().required(),
  booking_date: Joi.date().required(),
  booking_time: Joi.string().required(),
  hours: Joi.number().integer().required(),
  location: Joi.string().max(255).required(),
  booking_price: Joi.number().precision(0).required(),
  payment_method_id: Joi.string(),
  method: Joi.string()

});
export const actionRequestSchema = Joi.object({
  request_id: Joi.number().integer().required(),
  status: Joi.string().valid("ACCEPTED", "REJECTED").required(),
});
export const userActionRequestSchema = Joi.object({
  request_back_id: Joi.number().integer().required(),
  status: Joi.string().valid("ACCEPTED", "REJECTED").required(),
});

export const requestBackSchema = Joi.object({
  request_id: Joi.number().integer().required(),
  booking_date: Joi.date().required(),
  booking_time: Joi.string().required(),
  location: Joi.string().max(255).required(),
});
