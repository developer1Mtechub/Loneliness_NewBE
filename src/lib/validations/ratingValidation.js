// request_id, stars, comment;
import Joi from "joi";

export const ratingSchema = Joi.object({
  request_id: Joi.number().required(),
  buddy_id: Joi.number().required(),
  stars: Joi.number().required(),
  comment: Joi.string().min(3).max(250).required(),
});
export const ratingUpdateSchema = Joi.object({
  id: Joi.number().required(),
  request_id: Joi.number().required(),
  buddy_id: Joi.number().required(),
  stars: Joi.number().required(),
  comment: Joi.string().min(3).max(250).required(),
});
