import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function auth(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not configured");
    const payload = jwt.verify(authorization.slice(7), secret);
    const user = await User.findById(payload.sub).select("-passwordHash").lean();
    if (!user) return res.status(401).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    next(error);
  }
}
