const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/ld/proposalController');

const ADMIN_ROLES = ['admin', 'staff', 'hr_staff', 'hrmpsb', 'appointing_authority'];

// Any authenticated user (employee or admin) can submit/read proposals
router.post('/',    verifyToken, ctrl.createProposal);
router.get('/',     verifyToken, ctrl.getProposals);
router.get('/:id',  verifyToken, ctrl.getProposalById);

// Admin-only: review + convert
router.patch('/:id/review',  verifyToken, requireRole(...ADMIN_ROLES), ctrl.reviewProposal);
// Delete proposal
router.delete('/:id', verifyToken, ctrl.deleteProposal);

module.exports = router;
