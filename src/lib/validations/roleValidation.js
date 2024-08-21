import Joi from "joi";

export const roleSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
});
export const roleUpdateSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().min(3).max(50).required(),
});
