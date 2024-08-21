import Joi from "joi";

export const updateStatusSchema = Joi.object({
  notification_id: Joi.number().required(),
  read_status: Joi.boolean().required(),
});
