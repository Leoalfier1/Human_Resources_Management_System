const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Should look like this:
const dir = './uploads/division-memos/';

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

module.exports = { uploadMemo };