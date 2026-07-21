const db = require('../../db');
const { syncEligibilityScreeningRow } = require('./syncEligibilityScreening');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const pdsUploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/pds');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'PDS-' + req.user.id + '-' + file.fieldname.toUpperCase() + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const pdsImageFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    cb(null, allowed.includes(file.mimetype));
};

exports.uploadPhoto = multer({ storage: pdsUploadStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: pdsImageFilter }).single('photo');
exports.uploadSignature = multer({ storage: pdsUploadStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: pdsImageFilter }).single('signature');
exports.uploadThumbmark = multer({ storage: pdsUploadStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: pdsImageFilter }).single('thumbmark');

// Fields that are safe to mass-assign from the request body.
// Keeping this list explicit avoids letting the client write to
// id / user_id / status / submitted_at directly.
const EDITABLE_FIELDS = [
    'surname', 'first_name', 'middle_name', 'name_extension',
    'date_of_birth', 'place_of_birth', 'sex',     'civil_status', 'civil_status_other', 'religion', 'disability', 'ethnic_group',
    'height_m', 'weight_kg', 'blood_type',
    'gsis_id_no', 'pagibig_id_no', 'philhealth_no', 'sss_no', 'tin_no', 'agency_employee_no',
    'citizenship', 'dual_citizenship_country', 'dual_citizenship_type',
    'res_house_block_lot', 'res_street', 'res_subdivision_village', 'res_barangay',
    'res_city_municipality', 'res_province', 'res_zip_code',
    'perm_same_as_residential', 'perm_house_block_lot', 'perm_street', 'perm_subdivision_village',
    'perm_barangay', 'perm_city_municipality', 'perm_province', 'perm_zip_code',
    'telephone_no', 'mobile_no', 'email_address',
    'spouse_surname', 'spouse_first_name', 'spouse_middle_name', 'spouse_name_extension',
    'spouse_occupation', 'spouse_employer_business_name', 'spouse_business_address', 'spouse_telephone_no',
    'father_surname', 'father_first_name', 'father_middle_name', 'father_name_extension',
    'mother_maiden_surname', 'mother_first_name', 'mother_middle_name',
    'children',
    'elementary', 'secondary', 'vocational', 'college', 'graduate_studies',
    'civil_service_eligibility', 'work_experience',
    'voluntary_work', 'ld_training',
    'special_skills', 'non_academic_distinctions', 'membership_associations',
    // C4 — Yes/No questions
    'q34a_answer', 'q34a_details', 'q34b_answer', 'q34b_details',
    'q35a_answer', 'q35a_details', 'q35b_answer', 'q35b_details', 'q35b_date_filed', 'q35b_case_status',
    'q36_answer',  'q36_details',  'q37_answer',  'q37_details',
    'q38a_answer', 'q38a_details', 'q38b_answer', 'q38b_details',
    'q39_answer',  'q39_details',
    'q40a_answer', 'q40a_details', 'q40b_answer', 'q40b_details', 'q40c_answer', 'q40c_details',
    'references', 'govt_ids', 'date_accomplished',
];

const JSON_FIELDS = [
    'children', 'elementary', 'secondary', 'vocational', 'college', 'graduate_studies',
    'civil_service_eligibility', 'work_experience',
    'voluntary_work', 'ld_training',
    'special_skills', 'non_academic_distinctions', 'membership_associations',
    'references', 'govt_ids',
];

// Required fields that must be present before a PDS can be marked "submitted"
// and counted as complete for the apply-gate check.
const REQUIRED_FOR_COMPLETION = [
    'surname', 'first_name', 'date_of_birth', 'place_of_birth', 'sex', 'civil_status',
    'res_city_municipality', 'res_province', 'mobile_no', 'email_address',
];

function normalizeRow(row) {
    if (!row) return null;
    const out = { ...row };
    JSON_FIELDS.forEach(f => {
        if (typeof out[f] === 'string') {
            try { out[f] = JSON.parse(out[f]); } catch { out[f] = null; }
        }
    });
    return out;
}

function buildUpdatePayload(body) {
    const payload = {};
    EDITABLE_FIELDS.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            let val = body[field];
            if (JSON_FIELDS.includes(field) && val !== null && typeof val !== 'string') {
                val = JSON.stringify(val);
            }
            // Coerce empty strings to null for date/decimal columns to avoid MySQL errors
            if (val === '') val = null;
            payload[field] = val;
        }
    });
    return payload;
}

function isComplete(row) {
    if (!row) return false;
    return REQUIRED_FOR_COMPLETION.every(f => row[f] !== null && row[f] !== undefined && row[f] !== '');
}

// ─────────────────────────────────────────────────────────────
// GET /api/applicant/pds
// Returns the logged-in applicant's PDS, creating an empty draft
// row on first access so the form always has something to PATCH.
// ─────────────────────────────────────────────────────────────
exports.getMyPDS = async (req, res) => {
    try {
        const userId = req.user.id;

        let [rows] = await db.query('SELECT * FROM personal_data_sheets WHERE user_id = ?', [userId]);

        if (rows.length === 0) {
            const [empRows] = await db.query('SELECT * FROM employees WHERE user_id = ?', [userId]);
            let surname = null, first_name = null, middle_name = null, name_extension = null;
            let date_of_birth = null, place_of_birth = null, sex = null, civil_status = null;
            let blood_type = null, gsis_id_no = null, pagibig_id_no = null, philhealth_no = null;
            let tin_no = null, mobile_no = null, email_address = req.user.email || null;

            if (empRows.length > 0) {
                const emp = empRows[0];
                surname = emp.last_name || null;
                first_name = emp.first_name || null;
                middle_name = emp.middle_name || null;
                name_extension = emp.name_extension || null;
                date_of_birth = emp.date_of_birth || null;
                place_of_birth = emp.place_of_birth || null;
                sex = emp.sex || null;
                civil_status = emp.civil_status || null;
                blood_type = emp.blood_type || null;
                gsis_id_no = emp.gsis_id || null;
                pagibig_id_no = emp.pagibig_id || null;
                philhealth_no = emp.philhealth_no || null;
                tin_no = emp.tin_no || null;
                mobile_no = emp.mobile_no || null;
                email_address = emp.email || email_address;
            }

            await db.query(
                `INSERT INTO personal_data_sheets 
                 (user_id, surname, first_name, middle_name, name_extension, date_of_birth, place_of_birth, sex, civil_status, blood_type, gsis_id_no, pagibig_id_no, philhealth_no, tin_no, mobile_no, email_address) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, surname, first_name, middle_name, name_extension, date_of_birth, place_of_birth, sex, civil_status, blood_type, gsis_id_no, pagibig_id_no, philhealth_no, tin_no, mobile_no, email_address]
            );
            [rows] = await db.query('SELECT * FROM personal_data_sheets WHERE user_id = ?', [userId]);
        }

        let pds = normalizeRow(rows[0]);

        if (pds && pds.status === 'draft') {
            const [empRows] = await db.query('SELECT * FROM employees WHERE user_id = ?', [userId]);
            if (empRows.length > 0) {
                const emp = empRows[0];
                const mappings = {
                    surname: emp.last_name,
                    first_name: emp.first_name,
                    middle_name: emp.middle_name,
                    name_extension: emp.name_extension,
                    date_of_birth: emp.date_of_birth,
                    place_of_birth: emp.place_of_birth,
                    sex: emp.sex,
                    civil_status: emp.civil_status,
                    blood_type: emp.blood_type,
                    gsis_id_no: emp.gsis_id,
                    pagibig_id_no: emp.pagibig_id,
                    philhealth_no: emp.philhealth_no,
                    tin_no: emp.tin_no,
                    mobile_no: emp.mobile_no,
                    email_address: emp.email
                };
                let updated = false;
                const payload = {};
                for (const [pdsKey, empVal] of Object.entries(mappings)) {
                    if ((pds[pdsKey] === null || pds[pdsKey] === undefined || pds[pdsKey] === '') && empVal) {
                        pds[pdsKey] = empVal;
                        payload[pdsKey] = empVal;
                        updated = true;
                    }
                }
                if (updated) {
                    await db.query('UPDATE personal_data_sheets SET ? WHERE user_id = ?', [payload, userId]);
                }
            }
        }

        res.json({ pds, isComplete: isComplete(pds) });
    } catch (error) {
        console.error('getMyPDS Error:', error);
        res.status(500).json({ message: 'Could not load Personal Data Sheet.' });
    }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/applicant/pds
// Saves progress as a draft. Can be called repeatedly (autosave
// per-section or full-form save).
// ─────────────────────────────────────────────────────────────
exports.updateMyPDS = async (req, res) => {
    try {
        const userId = req.user.id;
        const payload = buildUpdatePayload(req.body);

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided.' });
        }

        const [existing] = await db.query('SELECT id, status FROM personal_data_sheets WHERE user_id = ?', [userId]);
        if (existing.length === 0) {
            await db.query('INSERT INTO personal_data_sheets (user_id) VALUES (?)', [userId]);
        } else if (existing[0].status === 'submitted') {
            return res.status(403).json({ message: 'Your PDS has already been submitted and is locked. Contact HR to request changes.' });
        }

        await db.query('UPDATE personal_data_sheets SET ? WHERE user_id = ?', [payload, userId]);

        const [rows] = await db.query('SELECT * FROM personal_data_sheets WHERE user_id = ?', [userId]);
        const pds = normalizeRow(rows[0]);

        res.json({ message: 'Progress saved.', pds, isComplete: isComplete(pds) });
    } catch (error) {
        console.error('updateMyPDS Error:', error);
        res.status(500).json({ message: 'Could not save Personal Data Sheet: ' + error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/applicant/pds/submit
// Locks the PDS once all required fields are present. Submitting
// is what satisfies the "must complete PDS before applying" gate.
// ─────────────────────────────────────────────────────────────
exports.submitMyPDS = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query('SELECT * FROM personal_data_sheets WHERE user_id = ?', [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No PDS draft found. Please fill out the form first.' });
        }

        const pds = normalizeRow(rows[0]);
        if (!isComplete(pds)) {
            return res.status(400).json({
                message: 'Please complete all required fields before submitting.',
                missing: REQUIRED_FOR_COMPLETION.filter(f => !pds[f])
            });
        }

        await db.query(
            "UPDATE personal_data_sheets SET status = 'submitted', submitted_at = NOW() WHERE user_id = ?",
            [userId]
        );

        const [apps] = await db.query(
            "SELECT id FROM applications WHERE applicant_id = ? AND status != 'draft'", [userId]
        );
        for (const app of apps) {
            await syncEligibilityScreeningRow(app.id);
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rsp:applicants:update', { userId });
            io.emit('pds:completion-updated', { userId, isComplete: true });
        }

        res.json({ message: 'Personal Data Sheet submitted successfully.' });
    } catch (error) {
        console.error('submitMyPDS Error:', error);
        res.status(500).json({ message: 'Could not submit Personal Data Sheet: ' + error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// GET /api/applicant/pds/status
// Lightweight check used by the Application Wizard "apply gate"
// — avoids shipping the whole PDS payload just to check completeness.
// ─────────────────────────────────────────────────────────────
exports.getPDSStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query('SELECT * FROM personal_data_sheets WHERE user_id = ?', [userId]);

        if (rows.length === 0) {
            return res.json({ exists: false, isComplete: false, status: null });
        }

        const pds = normalizeRow(rows[0]);
        res.json({
            exists: true,
            isComplete: isComplete(pds) || pds.status === 'submitted',
            status: pds.status
        });
    } catch (error) {
        console.error('getPDSStatus Error:', error);
        res.status(500).json({ message: 'Could not check Personal Data Sheet status: ' + error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// POST /api/applicant/pds/photo  |  /signature  |  /thumbmark
// Single-file image upload (2x2 photo, signature specimen, right thumbmark).
// File is saved to uploads/pds/ and the relative path is stored in the DB.
// ─────────────────────────────────────────────────────────────
async function handleImageUpload(req, res, columnName) {
    try {
        const userId = req.user.id;

        // ── REMOVE mode: no file in request body → delete existing image ──
        if (!req.file) {
            const [existing] = await db.query(`SELECT ${columnName} FROM personal_data_sheets WHERE user_id = ?`, [userId]);
            if (existing.length > 0 && existing[0][columnName]) {
                const oldPath = path.join(__dirname, '../../uploads', existing[0][columnName]);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                await db.query(`UPDATE personal_data_sheets SET ${columnName} = NULL WHERE user_id = ?`, [userId]);
            }
            return res.json({ message: 'Image removed.', path: null });
        }
        const relativePath = 'pds/' + req.file.filename;

        // Delete old file if one existed
        const [existing] = await db.query(`SELECT ${columnName} FROM personal_data_sheets WHERE user_id = ?`, [userId]);
        if (existing.length > 0 && existing[0][columnName]) {
            const oldPath = path.join(__dirname, '../../uploads', existing[0][columnName]);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        await db.query(
            `INSERT INTO personal_data_sheets (user_id, ${columnName}) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE ${columnName} = VALUES(${columnName})`,
            [userId, relativePath]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('pds:completion-updated', { userId });

        res.json({ message: `${columnName.replace('_path', '').charAt(0).toUpperCase() + columnName.replace('_path', '').slice(1)} uploaded.`, path: relativePath });
    } catch (error) {
        console.error(`handleImageUpload (${columnName}) Error:`, error);
        res.status(500).json({ message: 'Could not upload image: ' + error.message });
    }
}

exports.uploadMyPhoto     = (req, res) => handleImageUpload(req, res, 'photo_path');
exports.uploadMySignature = (req, res) => handleImageUpload(req, res, 'signature_path');
exports.uploadMyThumbmark = (req, res) => handleImageUpload(req, res, 'thumbmark_path');