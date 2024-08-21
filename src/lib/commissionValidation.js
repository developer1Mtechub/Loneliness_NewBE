import Joi from "joi";

export const addCommissionSchema = Joi.object({
    per_hour_rate: Joi.number().integer().required(),
});
