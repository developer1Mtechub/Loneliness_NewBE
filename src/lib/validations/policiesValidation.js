import Joi from "joi";

export const policesSchema = Joi.object({
    content: Joi.string().required(),
    type: Joi.string().valid("PRIVACY", "TERMS").required(),
})
