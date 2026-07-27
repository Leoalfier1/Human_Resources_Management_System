const express = require('express');
const router = express.Router();
const { 
    getVacancies, 
    createVacancy, 
    getVacancyById,
    updateVacancy,
    deleteVacancy,
    advanceStage
} = require('../../controllers/rsp/vacancyController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const { uploadMemo } = require('../../middleware/uploadMiddleware');

// PATH: /api/rsp/vacancies

router.get('/',
    verifyToken,
    requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'),
    getVacancies
);

router.post('/',
    verifyToken,
    requireRole('admin', 'hr_staff'),
    uploadMemo.single('division_memorandum'),
    createVacancy
);

router.get('/:id',
    verifyToken,
    requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority'),
    getVacancyById
);

router.patch('/:id',
    verifyToken,
    requireRole('admin', 'hr_staff'),
    updateVacancy
);

router.patch('/:id/advance',
    verifyToken,
    requireRole('admin', 'hr_staff'),
    advanceStage
);

router.delete('/:id',
    verifyToken,
    requireRole('admin', 'hr_staff'),
    deleteVacancy
);

module.exports = router;