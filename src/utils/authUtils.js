import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = "3ba1f05e84e06042faac3fd70f65ce3adc0b6e8920f5a3fcd90d511308eb868c2ea541ab71c41a8bc7493a3df1d6ff63"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const JWT_REMEMBER_ME_EXPIRES_IN =
  process.env.JWT_REMEMBER_ME_EXPIRES_IN || "30d";
// const REFRESH_TOKEN_SECRET =
//   "8120330885cdfc51f893ecfe5ab515394dcdfd5b326ac10f64b31d42e4e0039591d2de8f1fd16fc0e76a6c5131c67e2d";

  const REFRESH_TOKEN_SECRET =
  "3ba1f05e84e06042faac3fd70f65ce3adc0b6e8920f5a3fcd90d511308eb868c2ea541ab71c41a8bc7493a3df1d6ff63";

  const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// Hashing functions
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT functions
export const generateToken = (payload, rememberMe = false) => {
  const expiresIn = rememberMe ? JWT_REMEMBER_ME_EXPIRES_IN : JWT_EXPIRES_IN;
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
  return { token, expiresIn };
};

export const generateRefreshToken = (payload) => {
  const expiresIn = REFRESH_TOKEN_EXPIRES_IN;
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn });
  return { refreshToken, expiresIn };
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export const verifyRefreshToken = (refreshToken) => {
  try {
    return jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  } catch (error) {
    console.log(error)
    throw new Error("Invalid refresh token");
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};


// Generate a 6-digit code
export const generate6DigitCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
