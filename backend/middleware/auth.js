const jwt = require("jsonwebtoken");
const User = require("../Model/User");

const JWT_SECRET =
  process.env.JWT_SECRET || "internshala_clone_super_secret_jwt_key_2026_secharden";

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized: Missing or invalid Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User no longer exists" });
    }

    // Attach user without password
    req.user = {
      id: user._id ? user._id.toString() : user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profile: user.profile || {},
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Unauthorized: Token has expired" });
    }
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// Optional auth middleware (does not reject if not logged in)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = {
            id: user._id ? user._id.toString() : user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            profile: user.profile || {},
          };
        }
      }
    }
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
};

// Role-Based Access Control (RBAC) middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Role '${req.user.role}' is not authorized to access this route. Allowed roles: ${allowedRoles.join(
          ", "
        )}`,
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireRole,
  JWT_SECRET,
};
