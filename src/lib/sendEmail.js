import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user:"testing.mtechub@gmail.com",
    pass: "hxfknntaxjanfbwq",
  },
  tls: {
    rejectUnauthorized: false, // For self-signed certificates or invalid certs
  },
});

export const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from:"testing.mtechub@gmail.com",
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.response}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);

    // Handle specific cases and throw specific errors
    if (error.responseCode === 550) {
      logger.error(`Email not sent to ${to} - Mailbox unavailable.`);
      throw new Error("Mailbox unavailable");
    } else if (error.responseCode === 421) {
      logger.error(
        `Email not sent to ${to} - Service not available, try again later.`
      );
      throw new Error("Service not available, try again later");
    } else if (error.responseCode === 450) {
      logger.error(
        `Email not sent to ${to} - Mailbox unavailable, try again later.`
      );
      throw new Error("Mailbox unavailable, try again later");
    } else {
      logger.error(`Email not sent to ${to} - Unexpected error.`);
      throw new Error("Unexpected error, please try again later");
    }
  }
};
