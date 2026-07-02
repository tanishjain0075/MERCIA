/**
 * Role-based access control middleware.
 * Usage: router.get('/admin-only', protect, requireRole('admin'), handler)
 * @param {...string} roles - allowed roles e.g. 'admin', 'staff'
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

module.exports = { requireRole };
