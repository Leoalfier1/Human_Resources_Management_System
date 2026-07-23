const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/division-memos/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'MEMO-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed!'), false);
};

const uploadMemo = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const pmStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/pm_movs/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'MOV-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const pmFileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'image/png',
        'image/jpeg',
        'image/jpg'
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, Excel, and image files (PNG/JPG) are allowed!'), false);
};

const uploadMOV = multer({
    storage: pmStorage,
    fileFilter: pmFileFilter,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

module.exports = { uploadMemo, uploadMOV };