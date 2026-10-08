import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 * Verifies Authorization: Bearer <token> header and attaches decoded user to req.user
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authorization token missing or malformed.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'smartbus_development_jwt_secret_key_2026';
    const decoded = jwt.verify(token, secret);

    // Attach decoded user payload to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Invalid or expired token.',
    });
  }
};

/**
 * Role-Based Authorization Middleware
 * Restricts endpoint access to specific user roles
 * @param {...string} allowedRoles Roles allowed to access the endpoint (e.g. 'admin', 'driver')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User identity not established.',
      });
    }

    const hasRole = allowedRoles.map((r) => r.toLowerCase()).includes(req.user.role.toLowerCase());

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};
