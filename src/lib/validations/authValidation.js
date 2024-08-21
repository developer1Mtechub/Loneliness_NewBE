import Joi from "joi";

const passwordComplexity = Joi.string()
  .pattern(
    new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$"
    )
  )
  .required()
  .messages({
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  });

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordComplexity,
  confirm_password: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Password and confirm password must match",
    }),
  role: Joi.string().valid("BUDDY", "USER", "ADMIN").required(),
  remember_me: Joi.boolean(),
  signup_type: Joi.string().valid("EMAIL", "GOOGLE").required(),
  token_google: Joi.string(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string(),
  device_token: Joi.string().required(),
  remember_me: Joi.boolean(),
  role: Joi.string().optional(),
  signup_type: Joi.string().valid("EMAIL", "GOOGLE").required(),
  token_google: Joi.string(),
});

export const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().optional(),
});

export const verifyCodeSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(4).required(),
  role: Joi.string().optional(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(4).required(),
  new_password: passwordComplexity,
  confirm_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .required()
    .messages({
      "any.only": "New password and confirm password must match",
    }),
  role: Joi.string().optional(),
});

export const changPasswordSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: passwordComplexity,
  confirm_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .required()
    .messages({
      "any.only": "Password and confirm password must match",
    }),
  role: Joi.string().optional(),
});
