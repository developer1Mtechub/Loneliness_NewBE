import { STATUS_CODES, STATUS_MESSAGES } from "./statusCodes.js";

/**
 * Utility for sending standardized responses
 */

export const sendSuccessResponse = (
  res,
  result,
  message = STATUS_MESSAGES.OK
) => {
  return res.status(STATUS_CODES.OK).json({
    status: "success",
    statusCode: STATUS_CODES.OK,
    message,
    result,
  });
};

export const sendCreatedResponse = (
  res,
  result,
  message = STATUS_MESSAGES.CREATED
) => {
  return res.status(STATUS_CODES.CREATED).json({
    status: "success",
    statusCode: STATUS_CODES.CREATED,
    message,
    result,
  });
};

export const sendBadRequestResponse = (
  res,
  errors,
  message = STATUS_MESSAGES.BAD_REQUEST
) => {
  return res.status(STATUS_CODES.BAD_REQUEST).json({
    status: "error",
    statusCode: STATUS_CODES.BAD_REQUEST,
    message,
    errors,
  });
};

export const sendUnauthorizedResponse = (
  res,
  message = STATUS_MESSAGES.UNAUTHORIZED
) => {
  return res.status(STATUS_CODES.UNAUTHORIZED).json({
    status: "error",
    statusCode: STATUS_CODES.UNAUTHORIZED,
    message,
  });
};

export const sendForbiddenResponse = (
  res,
  message = STATUS_MESSAGES.FORBIDDEN
) => {
  return res.status(STATUS_CODES.FORBIDDEN).json({
    status: "error",
    statusCode: STATUS_CODES.FORBIDDEN,
    message,
  });
};

export const sendNotFoundResponse = (
  res,
  message = STATUS_MESSAGES.NOT_FOUND
) => {
  return res.status(STATUS_CODES.NOT_FOUND).json({
    status: "error",
    statusCode: STATUS_CODES.NOT_FOUND,
    message,
  });
};

export const sendServerErrorResponse = (
  res,
  message = STATUS_MESSAGES.INTERNAL_SERVER_ERROR
) => {
  return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
    status: "error",
    statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
    message,
  });
};

export const sendConflictResponse = (
  res,
  message = STATUS_MESSAGES.CONFLICT
) => {
  return res.status(STATUS_CODES.CONFLICT).json({
    status: "error",
    statusCode: STATUS_CODES.CONFLICT,
    message,
  });
};

export const sendCustomResponse = (
  res,
  statusCode,
  status,
  message,
  result = null,
  errors = null
) => {
  return res.status(statusCode).json({
    status,
    statusCode,
    message,
    result,
    errors,
  });
};
