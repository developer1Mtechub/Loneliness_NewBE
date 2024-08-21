import { getOne, insert, update } from "../../utils/dbUtils.js";
import {
  sendSuccessResponse,
  sendUnauthorizedResponse,
  sendServerErrorResponse,
  sendBadRequestResponse,
  sendConflictResponse,
  sendNotFoundResponse,
} from "../../utils/responseUtils.js";
import logger from "../../utils/logger.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  generate6DigitCode,
} from "../../utils/authUtils.js";
import { sendEmail } from "../../lib/sendEmail.js";

// export const register = async (req, res) => {
//   const { email, password, role, remember_me,signup_type,token_google } = req.body;

//   try {
//     const roleRecord = await getOne("roles", { name: role });
//     if (!roleRecord) {
//       return sendNotFoundResponse(res, "Role not found");
//     }
//     const hashedPassword = await hashPassword(password);
//     const user = await insert("users", {
//       email,
//       password: hashedPassword,
//       role_id: roleRecord.id,
//       signup_type
//     });

//     const { token, expiresIn } = generateToken({ id: user.id }, remember_me);
//     const { refreshToken, refreshExpiresIn } = generateRefreshToken({
//       id: user.id,
//     });

//     logger.info(`User registered: ${email}`);
//     return sendSuccessResponse(
//       res,
//       {
//         user,
//         role: roleRecord.name,
//         token,
//         refreshToken,
//         tokenExpiresIn: expiresIn,
//         refreshTokenExpiresIn: refreshExpiresIn,
//       },
//       "User registered successfully"
//     );
//   } catch (error) {
//     if (error.code === "23505") {
//       logger.warn(`User with email '${email}' already exists.`);
//       return sendConflictResponse(res, [
//         `User with email '${email}' already exists.`,
//       ]);
//     }
//     logger.error(`Error registering user: ${error.message}`);
//     return sendServerErrorResponse(res);
//   }
// };
export const register = async (req, res) => {
  const { email, password, role, remember_me, signup_type, token_google } = req.body;

  try {
    const roleRecord = await getOne("roles", { name: role });
    if (!roleRecord) {
      return sendNotFoundResponse(res, "Role not found");
    }
    const hashedPassword = await hashPassword(password);

    const userData = {
      email,
      password: hashedPassword,
      role_id: roleRecord.id,
      signup_type
    };

    if (signup_type === "GOOGLE") {
      userData.token_google = token_google;
    }

    const user = await insert("users", userData);

    const { token, expiresIn } = generateToken({ id: user.id }, remember_me);
    const { refreshToken, refreshExpiresIn } = generateRefreshToken({
      id: user.id,
    });

    logger.info(`User registered: ${email}`);
    return sendSuccessResponse(
      res,
      {
        user,
        role: roleRecord.name,
        token,
        refreshToken,
        tokenExpiresIn: expiresIn,
        refreshTokenExpiresIn: refreshExpiresIn,
      },
      "User registered successfully"
    );
  } catch (error) {
    if (error.code === "23505") {
      logger.warn(`User with email '${email}' already exists.`);
      return sendConflictResponse(res, [
        `User with email '${email}' already exists.`,
      ]);
    }
    logger.error(`Error registering user: ${error.message}`);
    return sendServerErrorResponse(res);
  }
};
export const login = async (req, res) => {
  const { email, password, device_token, remember_me, role, token_google } = req.body;

  try {
    const user = await getOne("users", { email });

    if (!user) {
      logger.warn(`Invalid login attempt for email: ${email}`);
      return sendUnauthorizedResponse(res, "Invalid email or password");
    }

    // Check if the login method matches the signup method
    if (user.signup_type === "EMAIL" && token_google) {
      return sendBadRequestResponse(res, "Please log in using your email and password");
    } else if (user.signup_type === "GOOGLE" && password) {
      return sendBadRequestResponse(res, "Please log in using your Google account");
    }

    if (user.signup_type === "EMAIL") {
      if (!(await comparePassword(password, user.password))) {
        logger.warn(`Invalid login attempt for email: ${email}`);
        return sendUnauthorizedResponse(res, "Invalid email or password");
      }
    } else if (user.signup_type === "GOOGLE") {
      await update("users", { token_google }, { id: user.id });
    } else {
      return sendBadRequestResponse(res, "Invalid signup type");
    }

    if (user.is_block) {
      return sendBadRequestResponse(res, "Your account has been blocked temporarily");
    }

    const role_record = await getOne("roles", { id: user.role_id });

    if (role_record.name === "ADMIN" && !role) {
      return sendBadRequestResponse(res, "You must be an administrator");
    }

    if (role) {
      if (!role_record || role_record.name !== role) {
        return sendNotFoundResponse(res, "User does not exist with this role or Role does not exist");
      }
    }

    const { token, expiresIn } = generateToken({ id: user.id }, remember_me);
    const { refreshToken, refreshExpiresIn } = generateRefreshToken({ id: user.id });
    await update("users", { device_token }, { id: user.id });

    const expires_at = remember_me
      ? new Date().getTime() + 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
      : new Date().getTime() + 24 * 60 * 60 * 1000; // 1 day in milliseconds

    logger.info(`User logged in: ${email}`);
    const images = await getOne("user_images", { user_id: user.id });
    return sendSuccessResponse(
      res,
      {
        user,
        role: role_record.name,
        token,
        refreshToken,
        tokenExpiresIn: expiresIn,
        refreshTokenExpiresIn: refreshExpiresIn,
        expires_at,
        image_url: images?.image_url || "",
      },
      "Login successful"
    );
  } catch (error) {
    logger.error(`Error logging in user: ${error.message}`);
    return sendServerErrorResponse(res);
  }
};


// export const login = async (req, res) => {
//   const { email, password, device_token, remember_me, role,token_google } = req.body;

//   try {
//     const user = await getOne("users", { email });

//     if (!user || !(await comparePassword(password, user.password))) {
//       logger.warn(`Invalid login attempt for email: ${email}`);
//       return sendUnauthorizedResponse(res, "Invalid email or password");
//     }
//     if (user.is_block) {
//       return sendBadRequestResponse(
//         res,
//         "Your account has been blocked temporarily"
//       );
//     }
//     const role_record = await getOne("roles", { id: user.role_id });

//     if (role_record.name === "ADMIN" && !role) {
//       return sendBadRequestResponse(res, "You must be an administrator");
//     }
//     if (role) {
//       if (!role_record || role_record.name !== role) {
//         return sendNotFoundResponse(
//           res,
//           "User does exist with this role or Role does not exist"
//         );
//       }
//     }

//     const { token, expiresIn } = generateToken({ id: user.id }, remember_me);
//     const { refreshToken, refreshExpiresIn } = generateRefreshToken({
//       id: user.id,
//     });
//     await update("users", { device_token }, { id: user.id });
//     // Improve the code to use "CONSTANTS" if you've time🤣
//     const expires_at = remember_me
//       ? new Date().getTime() + 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
//       : new Date().getTime() + 24 * 60 * 60 * 1000; // 1 day in milliseconds
//     logger.info(`User logged in: ${email}`);
//     const images = await getOne("user_images", { user_id: user.id });
//     return sendSuccessResponse(
//       res,
//       {
//         user,
//         role: role_record.name,
//         token,
//         refreshToken,
//         tokenExpiresIn: expiresIn,
//         refreshTokenExpiresIn: refreshExpiresIn,
//         expires_at,
//         image_url: images?.image_url || "",
//         // is_requirements_completed: user.is_requirements_completed,
//       },
//       "Login successful"
//     );
//   } catch (error) {
//     logger.error(`Error logging in user: ${error.message}`);
//     return sendServerErrorResponse(res);
//   }
// };

export const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;

  try {
    console.log(refresh_token);
    const decoded = verifyRefreshToken(refresh_token);
    console.log(decoded);

    const { token, expiresIn } = generateToken({ id: decoded.id });
    const newRefreshToken = generateRefreshToken({ id: decoded.id });

    logger.info(`Token refreshed for user ID: ${decoded.id}`);
    return sendSuccessResponse(
      res,
      { token, tokenExpiresIn: expiresIn, refreshToken: newRefreshToken },
      "Token refreshed successfully"
    );
  } catch (error) {
    console.log(error);
    logger.error(`Error refreshing token: ${error.message}`);
    return sendUnauthorizedResponse(res, "Invalid refresh token");
  }
};

export const forgotPassword = async (req, res) => {
  const { email, role } = req.body;

  try {
    // Check if the user exists
    const user = await getOne("users", { email });

    if (!user) {
      return sendNotFoundResponse(res, "Email not found");
    }
    if (user.is_block) {
      return sendBadRequestResponse(
        res,
        "Your account has been blocked temporarily"
      );
    }
    const role_record = await getOne("roles", { id: user.role_id });

    if (role_record.name === "ADMIN" && !role) {
      return sendBadRequestResponse(res, "You must be an administrator");
    }
    if (role) {
      if (!role_record || role_record.name !== role) {
        return sendNotFoundResponse(
          res,
          "User does exist with this role or Role does not exist"
        );
      }
    }

    // Generate a 6-digit code
    const code = generate6DigitCode();

    // Update the user with the code
    await update("users", { code }, { id: user.id });

    // Send the email with the code
    await sendEmail(
      email,
      "Password Reset Code",
      `Your password reset code is: ${code}`
    );

    logger.info(`Password reset code sent to: ${email}`);
    return sendSuccessResponse(res, null, "Password reset code sent");
  } catch (error) {
    logger.error(`Error in forgot password: ${error.message}`);
    if (error.message === "Mailbox unavailable") {
      return sendBadRequestResponse(res, [
        "Email not sent - Mailbox unavailable",
      ]);
    } else if (error.message === "Service not available, try again later") {
      return sendServerErrorResponse(
        res,
        "Email not sent - Service not available, try again later"
      );
    } else if (error.message === "Mailbox unavailable, try again later") {
      return sendServerErrorResponse(
        res,
        "Email not sent - Mailbox unavailable, try again later"
      );
    } else {
      return sendServerErrorResponse(
        res,
        "Unexpected error, please try again later"
      );
    }
  }
};

export const verifyCode = async (req, res) => {
  const { email, code, role } = req.body;

  try {
    // Check if the user exists
    const user = await getOne("users", { email });
    if (!user) {
      return sendNotFoundResponse(res, "Email not found");
    }

    const role_record = await getOne("roles", { id: user.role_id });

    if (role_record.name === "ADMIN" && !role) {
      return sendBadRequestResponse(res, "You must be an administrator");
    }
    if (role) {
      if (!role_record || role_record.name !== role) {
        return sendNotFoundResponse(
          res,
          "User does exist with this role or Role does not exist"
        );
      }
    }

    // Check if the code matches
    if (user.code !== code) {
      return sendBadRequestResponse(res, ["Invalid or expired code"]);
    }

    logger.info(`Code verified for email: ${email}`);
    return sendSuccessResponse(res, null, "Code verified successfully");
  } catch (error) {
    logger.error(`Error in verify code: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const resetPassword = async (req, res) => {
  const { email, code, new_password, role } = req.body;

  try {
    // Check if the user exists
    const user = await getOne("users", { email });
    if (!user) {
      return sendNotFoundResponse(res, "Email not found");
    }

    const role_record = await getOne("roles", { id: user.role_id });

    if (role_record.name === "ADMIN" && !role) {
      return sendBadRequestResponse(res, "You must be an administrator");
    }
    if (role) {
      if (!role_record || role_record.name !== role) {
        return sendNotFoundResponse(
          res,
          "User does exist with this role or Role does not exist"
        );
      }
    }

    // Check if the code matches
    if (user.code !== code) {
      return sendBadRequestResponse(res, ["Invalid or expired code"]);
    }

    // Hash the new password
    const hashedPassword = await hashPassword(new_password);

    // Update the user's password and clear the code
    await update(
      "users",
      { password: hashedPassword, code: null },
      { id: user.id }
    );

    logger.info(`Password reset for email: ${email}`);
    return sendSuccessResponse(res, null, "Password reset successfully");
  } catch (error) {
    logger.error(`Error in reset password: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};

export const changePassword = async (req, res) => {
  const user_id = req.user.id;
  const { old_password, new_password, role } = req.body;
  try {
    const user = await getOne("users", { id: user_id });

    if (!user) {
      logger.warn(`User not found`);
      return sendNotFoundResponse(res, "User not found");
    }

    const role_record = await getOne("roles", { id: user.role_id });

    if (role_record.name === "ADMIN" && !role) {
      return sendBadRequestResponse(res, "You must be an administrator");
    }
    if (role) {
      if (!role_record || role_record.name !== role) {
        return sendNotFoundResponse(
          res,
          "User does exist with this role or Role does not exist"
        );
      }
    }
    if (!(await comparePassword(old_password, user.password))) {
      logger.warn(`old password is incorrect`);
      return sendUnauthorizedResponse(res, "Old password is incorrect");
    }
    // Hash the new password
    const hashedPassword = await hashPassword(new_password);

    // Update the user's password and clear the code
    await update("users", { password: hashedPassword }, { id: user.id });
    return sendSuccessResponse(res, null, "Password changed successfully");
  } catch (error) {
    logger.error(`Error in reset password: ${error.message}`);
    return sendServerErrorResponse(
      res,
      "Unexpected error, please try again later"
    );
  }
};
