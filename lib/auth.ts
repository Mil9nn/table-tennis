import jwt from "jsonwebtoken";
import { User } from "@/models/user.js";

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const withAuth = (handler) => {
  return async (req, res) => {
    try {
      const token = req.cookies.jwt;
      
      if (!token) {
        return res.status(401).json({ message: "Unauthorized - No Token Provided" });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ message: "Unauthorized - Invalid Token" });
      }

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user;
      return handler(req, res);
      
    } catch (error) {
      console.log("Error in auth middleware: ", error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};