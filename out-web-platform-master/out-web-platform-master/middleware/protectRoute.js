import jwt from "jsonwebtoken";

const protectRoute = (requiredRole = ["USER"]) => {
  return (req, res, next) => {
    try {
      const token = req.cookies?.jwt || req.headers?.authorization?.split(" ")[1];
      console.log("token is",token)
      if (!token) {
        return res
          .status(401)
          .json({ message: "Unauthorized: No token provided", success: false });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      } catch (err) {
        console.log("error",err)
        return res
          .status(401)
          .json({ message: "Unauthorized: Invalid token", success: false });
      }

      // ✅ Ensure decoded exists and has a role
      if (!decoded || !decoded.role) {
        return res
          .status(403)
          .json({ message: "Forbidden: Role missing in token", success: false });
      }

      // ✅ Attach user info to request
      req.user = decoded;

      if (requiredRole && ![].concat(requiredRole).includes(decoded.role)) {
        return res.status(403).json({
          message: "Access denied: Insufficient role",
          success: false,
        });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Server error in auth middleware", success: false });
    }
  };
};

export default protectRoute;
