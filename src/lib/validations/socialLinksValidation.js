import Joi from "joi";

export const addLinksSchema = Joi.object({
    platform: Joi.string().valid("FACEBOOK", "INSTAGRAM", "TWITTER", "LINKEDIN").required(),
    link: Joi.string().uri().required()
});
