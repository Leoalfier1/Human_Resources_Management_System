const db = require('../../db');
const path = require('path');
const fs = require('fs');
const syncApplicationsStage = require('../../utils/syncApplicationsStage');

// Helper: compute days left & elapsed
function computeDays(deadlineDate) {
    const deadline = new Date(deadlineDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = deadline - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, 10 - Math.max(0, daysLeft));
    return { daysLeft, daysElapsed };
}

// Helper: strip "SG-" prefix so we store only the number in DB
function parseSalaryGrade(val) {
    if (!val) return null;
    const str = String(val).replace(/^SG-/i, '').trim();
    const num = parseInt(str);
    return isNaN(num) ? null : num;
}

function validateSalaryGradeForPositionType(positionType, salaryGrade) {
    const sg = Number(salaryGrade);
    if (!Number.isInteger(sg) || sg < 1 || sg > 33) {
        return 'Salary grade must be from SG-1 to SG-33.';
    }

    if (positionType === 'teaching_related') {
        const hasRubric = (sg >= 11 && sg <= 24) || sg === 27;
        if (!hasRubric) {
            return 'Teaching-related comparative assessment supports SG-11 to SG-24, or SG-27 only.';
        }
    }

    return null;
}

// ─── 1. GET ALL VACANCIES (Admin View) ───────────────────────────
exports.getVacancies = async (req, res) => {
    try {
        const view = req.query.view || 'active';
        const isDeletedFilter = view === 'deleted'
            ? 'WHERE v.is_deleted = 1'
            : 'WHERE v.is_deleted = 0';

        const [rows] = await db.query(`
            SELECT v.*,
                (SELECT COUNT(*) FROM applications
                 WHERE vacancy_id = v.id AND status != 'draft') AS applicant_count
            FROM vacancies v
            ${isDeletedFilter}
            ORDER BY v.posting_date DESC
        `);

        const processed = rows.map(v => {
            const { daysLeft } = computeDays(v.deadline_date);
            const sg = v.salary_grade ? `SG-${v.salary_grade}` : null;
            return {
                ...v,
                salary_grade:    sg,
                days_left:       daysLeft,
                computed_status: (daysLeft < 0 || v.status === 'closed') ? 'closed' : 'active'
            };
        });

        res.json(processed);
    } catch (error) {
        console.error('❌ GET VACANCIES ERROR:', error);
        res.status(500).json({ message: 'Failed to load vacancies.', details: error.message });
    }
};

// ─── 2. GET SINGLE VACANCY ────────────────────────────────────────
exports.getVacancyById = async (req, res) => {
    try {
        const { id } = req.params;
        const includeDeleted = req.query.includeDeleted === 'true';
        const filter = includeDeleted ? '' : ' AND is_deleted = 0';
        const [rows] = await db.query(`SELECT * FROM vacancies WHERE id = ?${filter}`, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Vacancy not found' });

        const v = rows[0];
        const { daysLeft, daysElapsed } = computeDays(v.deadline_date);

        res.json({
            ...v,
            salary_grade:  v.salary_grade ? `SG-${v.salary_grade}` : null,
            days_left:     daysLeft,
            days_elapsed:  daysElapsed
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── 3. CREATE NEW VACANCY ────────────────────────────────────────
exports.createVacancy = async (req, res) => {
    try {
        const {
            position_title, item_number, salary_grade, assigned_school,
            minimum_qualifications, no_of_vacancies, posting_date,
            publish_division_website, publish_facebook, publish_bulletin,
            position_type
        } = req.body;

        // A. Validate required fields
        if (!position_title || !item_number || !assigned_school || !posting_date) {
            return res.status(400).json({ message: 'All required fields (*) must be filled.' });
        }

        // B. Parse publish channels (FormData sends strings)
        const pubWeb = publish_division_website === 'true' || publish_division_website === true;
        const pubFB  = publish_facebook         === 'true' || publish_facebook         === true;
        const pubBul = publish_bulletin         === 'true' || publish_bulletin         === true;

        if (!pubWeb && !pubFB && !pubBul) {
            return res.status(400).json({ message: 'Select at least one publishing channel.' });
        }

        // C. Strip "SG-" prefix — store only the number
        const sgNumber = parseSalaryGrade(salary_grade);
        const posType = position_type || 'teaching';
        const salaryGradeError = validateSalaryGradeForPositionType(posType, sgNumber);
        if (salaryGradeError) return res.status(400).json({ message: salaryGradeError });

        // D. Auto-generate Ref No (V-YYYY-001)
        const year = new Date().getFullYear();
        const [refRows] = await db.query(
            `SELECT ref_no FROM vacancies WHERE ref_no LIKE ? ORDER BY id DESC LIMIT 1`,
            [`V-${year}-%`]
        );
        let nextNum = '001';
        if (refRows.length > 0) {
            const parts = refRows[0].ref_no.split('-');
            if (parts.length === 3) {
                nextNum = String(parseInt(parts[2]) + 1).padStart(3, '0');
            }
        }
        const generatedRefNo = `V-${year}-${nextNum}`;

        // E. Auto-calculate deadline (+10 calendar days)
        const deadline = new Date(posting_date);
        deadline.setDate(deadline.getDate() + 10);
        const deadlineStr = deadline.toISOString().split('T')[0];

        // F. File path from Multer (optional)
        let finalFilePath = null;
        if (req.file) {
            finalFilePath = req.file.path.replace(/\\/g, '/');
        }

        // G. Insert into DB
        const [result] = await db.query(`
            INSERT INTO vacancies (
                ref_no, position_title, item_number, salary_grade,
                assigned_school, minimum_qualifications, no_of_vacancies,
                posting_date, deadline_date, division_memo_file_path,
                publish_division_website, publish_facebook, publish_bulletin,
                created_by, current_stage, status, position_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', ?)
        `, [
            generatedRefNo, position_title, item_number, sgNumber,
            assigned_school, minimum_qualifications, no_of_vacancies || 1,
            posting_date, deadlineStr, finalFilePath,
            pubWeb, pubFB, pubBul,
            req.user.id, posType
        ]);

        // H. Activity log
        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [result.insertId, req.user.id,
             `New vacancy posted: ${position_title} (${generatedRefNo})`]
        );

        // I. Real-time broadcast
        const io = req.app.get('socketio');
        if (io) io.emit('rsp:dashboard:update');

        res.status(201).json({
            message: 'Vacancy posted successfully',
            ref_no:  generatedRefNo
        });

    } catch (error) {
        console.error('❌ CREATE VACANCY ERROR:', error);
        res.status(500).json({
            message: 'Internal server error — could not save vacancy.',
            details: error.message
        });
    }
};

// ─── 4. ADVANCE STAGE ─────────────────────────────────────────────
exports.advanceStage = async (req, res) => {
    try {
        const { id } = req.params;
        const { next_stage } = req.body;

        if (!next_stage || next_stage > 11) {
            return res.status(400).json({ message: 'Invalid stage transition.' });
        }

        await db.query('UPDATE vacancies SET current_stage = ? WHERE id = ?', [next_stage, id]);
        await syncApplicationsStage(id, next_stage, req.app.get('socketio'));

        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [id, req.user.id, `Advanced vacancy to Stage ${next_stage}`]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('rsp:dashboard:update');
            io.to(`vacancy-${id}`).emit('vacancy:stage-update', { vacancy_id: id, stage: next_stage });
        }

        res.json({ message: `Vacancy successfully advanced to Stage ${next_stage}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── 5. UPDATE VACANCY ────────────────────────────────────────────
exports.updateVacancy = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (updates.salary_grade) {
            updates.salary_grade = parseSalaryGrade(updates.salary_grade);
        }

        if (updates.salary_grade || updates.position_type) {
            const [currentRows] = await db.query('SELECT position_type, salary_grade FROM vacancies WHERE id = ?', [id]);
            if (currentRows.length === 0) return res.status(404).json({ message: 'Vacancy not found.' });

            const nextPositionType = updates.position_type || currentRows[0].position_type;
            const nextSalaryGrade = updates.salary_grade || currentRows[0].salary_grade;
            const salaryGradeError = validateSalaryGradeForPositionType(nextPositionType, nextSalaryGrade);
            if (salaryGradeError) return res.status(400).json({ message: salaryGradeError });
        }

        await db.query('UPDATE vacancies SET ? WHERE id = ?', [updates, id]);
        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [id, req.user.id, `Vacancy updated: ${id}`]
        );
        res.json({ message: 'Vacancy updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── 6. SOFT DELETE VACANCY ───────────────────────────────────────
exports.deleteVacancy = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT ref_no, position_title, status, is_deleted FROM vacancies WHERE id = ?', [id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Vacancy not found.' });
        if (rows[0].is_deleted) return res.status(400).json({ message: 'Vacancy is already deleted.' });

        const currentStatus = rows[0].status;

        await db.query(`
            UPDATE vacancies SET
                is_deleted = 1,
                deleted_at = NOW(),
                deleted_by = ?,
                previous_status = ?
            WHERE id = ?
        `, [req.user.id, currentStatus, id]);

        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [id, req.user.id, `Vacancy soft-deleted: ${rows[0].ref_no} — ${rows[0].position_title}`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('rsp:dashboard:update');

        res.json({ message: 'Vacancy moved to Recently Deleted.' });
    } catch (error) {
        console.error('❌ SOFT DELETE VACANCY ERROR:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── 7. RESTORE VACANCY ───────────────────────────────────────────
exports.restoreVacancy = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            'SELECT ref_no, position_title, previous_status, deadline_date, is_deleted FROM vacancies WHERE id = ?', [id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Vacancy not found.' });
        if (!rows[0].is_deleted) return res.status(400).json({ message: 'Vacancy is not deleted.' });

        let restoredStatus = rows[0].previous_status || 'active';

        const { daysLeft } = computeDays(rows[0].deadline_date);
        if (daysLeft < 0) {
            restoredStatus = 'closed';
        }

        await db.query(`
            UPDATE vacancies SET
                is_deleted = 0,
                deleted_at = NULL,
                deleted_by = NULL,
                previous_status = NULL,
                status = ?
            WHERE id = ?
        `, [restoredStatus, id]);

        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [id, req.user.id, `Vacancy restored: ${rows[0].ref_no} — ${rows[0].position_title} (status: ${restoredStatus})`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('rsp:dashboard:update');

        res.json({ message: 'Vacancy restored successfully.', status: restoredStatus });
    } catch (error) {
        console.error('❌ RESTORE VACANCY ERROR:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─── 8. PERMANENT DELETE VACANCY ──────────────────────────────────
exports.permanentDeleteVacancy = async (req, res) => {
    try {
        const { id } = req.params;
        const { confirmRefNo } = req.body;

        const [rows] = await db.query(
            'SELECT ref_no, position_title, division_memo_file_path, is_deleted FROM vacancies WHERE id = ?', [id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Vacancy not found.' });
        if (!rows[0].is_deleted) return res.status(400).json({ message: 'Vacancy must be soft-deleted first.' });

        if (confirmRefNo !== rows[0].ref_no) {
            return res.status(400).json({ message: 'Ref No. does not match. Type the exact Ref No. to confirm.' });
        }

        const [appCount] = await db.query(
            'SELECT COUNT(*) AS cnt FROM applications WHERE vacancy_id = ?', [id]
        );
        if (appCount[0].cnt > 0) {
            return res.status(409).json({
                message: `Cannot permanently delete — this vacancy has ${appCount[0].cnt} associated applicant record(s). Contact system admin if removal is required.`
            });
        }

        if (rows[0].division_memo_file_path) {
            const fullPath = path.join(__dirname, '../../', rows[0].division_memo_file_path);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }

        await db.query('DELETE FROM vacancies WHERE id = ?', [id]);

        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`,
            [id, req.user.id, `Vacancy permanently deleted: ${rows[0].ref_no} — ${rows[0].position_title}`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('rsp:dashboard:update');

        res.json({ message: 'Vacancy permanently deleted.' });
    } catch (error) {
        console.error('❌ PERMANENT DELETE VACANCY ERROR:', error);
        res.status(500).json({ message: error.message });
    }
};
