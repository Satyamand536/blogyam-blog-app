/**
 * Role-Based Access Control Factory
 * @param {string[]} allowedRoles - Array of roles that can access the route
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Authentication required.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                error: `Access denied. Requires one of: [${allowedRoles.join(', ')}]` 
            });
        }
        next();
    };
};

const roles = {
    requireRole,
    requireOwner: requireRole(['owner']),
    requireAuthorOrOwner: requireRole(['author', 'owner']),
    requireAdminOrOwner: requireRole(['ADMIN', 'owner']) // Legacy support for ADMIN
};

module.exports = roles;
