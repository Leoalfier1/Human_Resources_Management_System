const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/applicant/pdsController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');

// BASE PATH: /api/applicant/pds
// All routes require a valid JWT and the 'applicant' role
router.use(verifyToken, requireRole('applicant'));

router.get('/status',  ctrl.getPDSStatus);   // lightweight completeness check (used by apply-gate)
router.get('/',        ctrl.getMyPDS);       // full PDS payload for the form
router.patch('/',      ctrl.updateMyPDS);    // save draft progress
router.post('/submit', ctrl.submitMyPDS);    // lock the PDS

// Image uploads (separate endpoints — multer middleware, not JSON body)
router.post('/photo',     ctrl.uploadPhoto,     ctrl.uploadMyPhoto);
router.post('/signature', ctrl.uploadSignature, ctrl.uploadMySignature);
router.post('/thumbmark', ctrl.uploadThumbmark, ctrl.uploadMyThumbmark);

module.exports = router;