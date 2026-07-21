const express = require('express');
const router = express.Router();
const { 
    getVacancies, 
    createVacancy, 
    getVacancyById,
    updateVacancy,
    deleteVacancy,
    advanceStage,
    restoreVacancy,
    permanentDeleteVacancy
} = require('../../controllers/rsp/vacancyController');
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const { uploadMemo } = require('../../middleware/uploadMiddleware');

// PATH: /api/rsp/vacancies

router.get('/',
    verifyToken,
    requireRole('admin', 'hr_staff', 'hrmpsb', 'appointing_authority', 'staff'),
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

router.patch('/:id/restore',
    verifyToken,
    requireRole('admin', 'hr_staff'),
    restoreVacancy
);

router.delete('/:id',
    verifyToken,
    requireRole('admin', 'hr_staff'),
    deleteVacancy
);

router.delete('/:id/permanent',
    verifyToken,
    requireRole('admin'),
    permanentDeleteVacancy
);

module.exports = router;
