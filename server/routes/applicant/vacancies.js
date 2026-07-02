const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/applicant/vacancyController');
const { verifyToken } = require('../../middleware/authMiddleware');

/**
 * BASE PATH: /api/vacancies
 *
 * PUBLIC routes (no auth):
 *   GET /api/vacancies/settings
 *   GET /api/vacancies/:id
 *
 * SOFT-AUTH routes (token used if present, not required):
 *   GET /api/vacancies          → uses applicant_type from JWT to filter by position_type
 *                                  if no token, shows all vacancies (public browsing)
 *
 * PROTECTED routes (JWT required):
 *   GET /api/vacancies/:id/has-applied
 *
 * NOTE: /settings MUST be before /:id to avoid "settings" being parsed as an id param.
 */

// Middleware that reads the token if present but doesn't block if missing
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next(); // No token — proceed without user context
    const jwt = require('jsonwebtoken');
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        // Invalid/expired token — treat as unauthenticated, don't block
    }
    next();
};

router.get('/settings', ctrl.getSettings);
router.get('/', optionalAuth, ctrl.getVacancies);         // soft auth — filters if token present
router.get('/:id', ctrl.getVacancyById);
router.get('/:id/has-applied', verifyToken, ctrl.hasApplied);

module.exports = router;