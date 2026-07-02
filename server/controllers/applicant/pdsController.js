const db = require('../../db');

// Fields that are safe to mass-assign from the request body.
// Keeping this list explicit avoids letting the client write to
// id / user_id / status / submitted_at directly.
const EDITABLE_FIELDS = [
    'surname', 'first_name', 'middle_name', 'name_extension',
    'date_of_birth', 'place_of_birth', 'sex', 'civil_status', 'civil_status_other',
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
            await db.query(
                'INSERT INTO personal_data_sheets (user_id, email_address) VALUES (?, ?)',
                [userId, req.user.email || null]
            );
            [rows] = await db.query('SELECT * FROM personal_data_sheets WHERE user_id = ?', [userId]);
        }

        const pds = normalizeRow(rows[0]);
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
        res.status(500).json({ message: 'Could not save Personal Data Sheet.' });
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

        res.json({ message: 'Personal Data Sheet submitted successfully.' });
    } catch (error) {
        console.error('submitMyPDS Error:', error);
        res.status(500).json({ message: 'Could not submit Personal Data Sheet.' });
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
        res.status(500).json({ message: 'Could not check Personal Data Sheet status.' });
    }
};