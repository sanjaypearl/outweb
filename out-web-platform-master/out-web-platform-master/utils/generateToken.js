import jwt from "jsonwebtoken";
import crypto from "crypto";

// Helper to generate a unique JWT ID
const generateJti = () => crypto.randomBytes(16).toString("hex");

export const generateToken = (
  user,
  options = { expiresIn: "2d", algorithm: "HS256" }
) => {
  if (!user || !user.username || !user.id || !user.role) {
    throw new Error("Missing required user fields");
  }

  const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

  const payload = {
    username: user.username,
    id: user.id,
    role: user.role,
    jti: generateJti(),
  };

  try {
    const token = jwt.sign(payload, JWT_SECRET_KEY, {
      expiresIn: options.expiresIn,
      algorithm: options.algorithm,
    });
    return token;
  } catch (err) {
    throw new Error("JWT signing failed: " + err.message);
  }
};

export const sendTokenInCookie = (res, token) => {
  res.cookie("jwt", token, {
    httpOnly: true, // not accessible by JS (XSS protection)
    secure: true, // only over HTTPS in prod
    sameSite: "none", // prevent CSRF
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days in ms
  });
};
