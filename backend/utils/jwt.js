import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret_jwt_key_change_me";

export const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);
