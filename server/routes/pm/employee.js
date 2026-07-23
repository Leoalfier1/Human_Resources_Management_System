const express = require('express');
const router = express.Router();
const db = require('../../db');
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('../../middleware/authMiddleware');
const { uploadMOV } = require('../../middleware/uploadMiddleware');
const { classifyPosition } = require('../../utils/positionClassifier');

router.use(verifyToken);

async function getMyEmployee(req) {
    const [rows] = await db.query('SELECT * FROM employees WHERE email = ?', [req.user.email]);
    return rows.length > 0 ? rows[0] : null;
}

async function getActivePeriod() {
    const [rows] = await db.query('SELECT * FROM rating_periods WHERE is_active = 1 LIMIT 1');
    return rows.length > 0 ? rows[0] : null;
}

async function myRater(employeeId) {
    const [rows] = await db.query('SELECT * FROM employees WHERE role IN (?, ?) AND id != ? LIMIT 1', ['supervisor', 'admin', employeeId]);
    return rows.length > 0 ? rows[0] : null;
}

async function myApprover(employeeId) {
    const [rows] = await db.query('SELECT * FROM employees WHERE role = ? AND id != ? LIMIT 1', ['admin', employeeId]);
    return rows.length > 0 ? rows[0] : null;
}

async function fetchObjectivesWithNested(ipcrfId) {
    const [objRows] = await db.query(`
        SELECT io.*, k.kra_name, k.weight_percent as template_weight, COALESCE(io.weight_percent, k.weight_percent) as weight_percent
        FROM ipcrf_objectives io 
        LEFT JOIN kra_templates k ON io.kra_template_id = k.id 
        WHERE io.ipcrf_id = ? 
        ORDER BY io.sequence_no
    `, [ipcrfId]);
    for (let obj of objRows) {
        const [files] = await db.query('SELECT * FROM mov_uploads WHERE ipcrf_objective_id = ?', [obj.id]);
        obj.mov_uploads = files;

        const [perfObjs] = await db.query('SELECT * FROM performance_objectives WHERE ipcrf_objective_id = ? ORDER BY sequence_no', [obj.id]);
        for (let po of perfObjs) {
            const [indicators] = await db.query('SELECT * FROM performance_indicators WHERE performance_objective_id = ?', [po.id]);
            po.indicators = indicators;
            const [plannedMov] = await db.query('SELECT * FROM planned_mov_items WHERE performance_objective_id = ?', [po.id]);
            po.planned_mov = plannedMov;
            const [selfRating] = await db.query('SELECT * FROM objective_self_ratings WHERE performance_objective_id = ?', [po.id]);
            po.self_rating = selfRating[0] || null;
        }
        obj.perf_objectives = perfObjs;
    }
    return objRows;
}

// Dashboard Summary
router.get('/dashboard/summary', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        const period = await getActivePeriod();
        let ipcrf = null;
        let objectives = [];
        let pendingActions = [];
        let feedback = [];
        let commitment = null;

        if (period) {
            const [commRows] = await db.query('SELECT id, overall_weighted_score, adjectival_rating, status FROM performance_commitments WHERE employee_id = ? AND rating_period_id = ?', [employee.id, period.id]);
            commitment = commRows[0] || null;

            const [ipcrfRows] = await db.query('SELECT * FROM ipcrf WHERE employee_id = ? AND rating_period_id = ?', [employee.id, period.id]);
            ipcrf = ipcrfRows[0] || null;

            if (ipcrf) {
                const [objRows] = await db.query(`
                    SELECT io.*, k.kra_name, k.weight_percent as template_weight, COALESCE(io.weight_percent, k.weight_percent) as weight_percent,
                           COALESCE(
                             (SELECT COALESCE(pt.final_rating, pt.rater_rating, pt.self_rating)
                              FROM performance_targets pt
                              WHERE pt.commitment_id = ? AND pt.kra_template_id = io.kra_template_id LIMIT 1),
                             (SELECT osr.average_rating 
                              FROM performance_objectives po 
                              JOIN objective_self_ratings osr ON osr.performance_objective_id = po.id 
                              WHERE po.ipcrf_objective_id = io.id 
                              ORDER BY osr.id DESC LIMIT 1),
                             io.self_rating
                           ) as rating
                    FROM ipcrf_objectives io 
                    LEFT JOIN kra_templates k ON io.kra_template_id = k.id 
                    WHERE io.ipcrf_id = ? 
                    ORDER BY io.sequence_no
                `, [commitment ? commitment.id : 0, ipcrf.id]);
                objectives = objRows;

                if (objectives.length === 0 && commitment) {
                    const [targetRows] = await db.query(
                        'SELECT id, kra_category as kra_name, weight_percent, target_description as objective_description, COALESCE(final_rating, rater_rating, self_rating) as rating FROM performance_targets WHERE commitment_id = ?',
                        [commitment.id]
                    );
                    objectives = targetRows;
                }

                if (ipcrf.status === 'not_submitted' || ipcrf.status === 'needs_revision') {
                    pendingActions.push({ type: 'alert', text: "Submit your IPCRF to your rater" });
                }

                for (let obj of objRows) {
                    const [files] = await db.query('SELECT id FROM mov_uploads WHERE ipcrf_objective_id = ?', [obj.id]);
                    if (files.length === 0) {
                        pendingActions.push({ type: 'alert', text: `Upload MOV for ${obj.kra_name} objective` });
                    }
                    if (['submitted', 'under_review', 'reviewed', 'finalized'].includes(ipcrf.status)) {
                        if (!obj.actual_accomplishment || obj.actual_accomplishment.trim() === '') {
                            pendingActions.push({ type: 'pending', text: `Complete Actual Accomplishment for ${obj.kra_name}` });
                        }
                    }
                }
            } else {
                pendingActions.push({ type: 'alert', text: "No IPCRF form created. Please contact HR admin." });
            }

            const [feedbackRows] = await db.query(`
                SELECT cl.id, cl.note as content, cl.entry_date as feedback_date, 'phase2' as phase, e.name as sender_name
                FROM coaching_logs cl
                JOIN performance_commitments pc ON cl.commitment_id = pc.id
                JOIN employees e ON cl.author_id = e.id
                WHERE pc.employee_id = ?
                ORDER BY cl.created_at DESC LIMIT 5
            `, [employee.id]);

            if (feedbackRows.length === 0) {
                const [oldFb] = await db.query(`
                    SELECT cf.id, cf.feedback_text as content, cf.created_at as feedback_date, cf.phase, e.name as sender_name
                    FROM coaching_feedback cf
                    JOIN employees e ON cf.rater_id = e.id
                    WHERE cf.employee_id = ?
                    ORDER BY cf.created_at DESC LIMIT 5
                `, [employee.id]);
                feedback = oldFb;
            } else {
                feedback = feedbackRows;
            }
        }

        res.json({ employee, period, ipcrf, objectives, feedback, pendingActions, commitment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// My IPCRF
router.get('/ipcrf', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        const period = await getActivePeriod();
        let ipcrf = null;
        let objectives = [];
        let raterInfo = { name: '', title: '' };
        let approverInfo = { name: '', title: '' };
        if (period) {
            const [ipcrfRows] = await db.query('SELECT * FROM ipcrf WHERE employee_id = ? AND rating_period_id = ?', [employee.id, period.id]);
            ipcrf = ipcrfRows[0] || null;

            // Auto-create IPCRF if none exists for this period
            if (!ipcrf) {
                const posType = classifyPosition(employee.position, employee.employee_type);
                const [result] = await db.query(
                    'INSERT INTO ipcrf (employee_id, rating_period_id, status) VALUES (?, ?, ?)',
                    [employee.id, period.id, 'not_submitted']
                );
                const newIp = await db.query('SELECT * FROM ipcrf WHERE id = ?', [result.insertId]);
                ipcrf = newIp[0][0];

                // Auto-populate KRA objectives from templates
                const [kraTemplates] = await db.query(
                    'SELECT * FROM kra_templates WHERE position_type = ? AND is_active = TRUE ORDER BY sort_order ASC',
                    [posType]
                );
                for (let i = 0; i < kraTemplates.length; i++) {
                    await db.query(
                        'INSERT INTO ipcrf_objectives (ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, weight_percent) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [ipcrf.id, kraTemplates[i].id, i + 1, '', '', '', kraTemplates[i].weight_percent]
                    );
                }

                // Re-fetch objectives after auto-population
                objectives = await fetchObjectivesWithNested(ipcrf.id);
            } else {
                objectives = await fetchObjectivesWithNested(ipcrf.id);
            }

            const rater = await myRater(employee.id);
            if (rater) {
                raterInfo = { name: rater.name, title: rater.position || 'Rater' };
            }
            const approver = await myApprover(employee.id);
            if (approver) {
                approverInfo = { name: approver.name, title: approver.position || 'Approving Authority' };
            }
        }
        res.json({ employee, period, ipcrf, objectives, raterInfo, approverInfo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/ipcrf/objective', async (req, res) => {
    const { ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, weight_percent } = req.body;
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const [ipcrfRows] = await db.query('SELECT * FROM ipcrf WHERE id = ? AND employee_id = ?', [ipcrf_id, employee.id]);
        if (ipcrfRows.length === 0) return res.status(403).json({ message: "Forbidden" });

        const [result] = await db.query(`
            INSERT INTO ipcrf_objectives (ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, weight_percent) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, weight_percent || null]);
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/ipcrf/objective/:id', async (req, res) => {
    const { objective_description, success_indicator, target_statement, actual_accomplishment, remarks, kra_template_id, weight_percent, self_rating } = req.body;
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const [objRows] = await db.query('SELECT io.* FROM ipcrf_objectives io JOIN ipcrf i ON io.ipcrf_id = i.id WHERE io.id = ? AND i.employee_id = ?', [req.params.id, employee.id]);
        if (objRows.length === 0) return res.status(403).json({ message: "Forbidden" });

        const fields = [];
        const values = [];
        if (objective_description !== undefined) { fields.push('objective_description = ?'); values.push(objective_description); }
        if (success_indicator !== undefined) { fields.push('success_indicator = ?'); values.push(success_indicator); }
        if (target_statement !== undefined) { fields.push('target_statement = ?'); values.push(target_statement); }
        if (actual_accomplishment !== undefined) { fields.push('actual_accomplishment = ?'); values.push(actual_accomplishment); }
        if (remarks !== undefined) { fields.push('remarks = ?'); values.push(remarks); }
        if (kra_template_id !== undefined) { fields.push('kra_template_id = ?'); values.push(kra_template_id); }
        if (self_rating !== undefined) { fields.push('self_rating = ?'); values.push(self_rating); }

        if (fields.length === 0) return res.json({ success: true });

        values.push(req.params.id);
        await db.query(`UPDATE ipcrf_objectives SET ${fields.join(', ')} WHERE id = ?`, values);

        // Update weight in ipcrf_kra_ratings if weight_percent provided
        if (weight_percent !== undefined && kra_template_id !== undefined) {
            const [objRow] = await db.query('SELECT ipcrf_id FROM ipcrf_objectives WHERE id = ?', [req.params.id]);
            if (objRow.length > 0) {
                await db.query('UPDATE kra_templates SET weight_percent = ? WHERE id = ? AND rating_period_id = (SELECT rating_period_id FROM ipcrf WHERE id = ?)',
                    [weight_percent, kra_template_id, objRow[0].ipcrf_id]);
            }
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/ipcrf/objective/:id', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const [objRows] = await db.query('SELECT io.* FROM ipcrf_objectives io JOIN ipcrf i ON io.ipcrf_id = i.id WHERE io.id = ? AND i.employee_id = ?', [req.params.id, employee.id]);
        if (objRows.length === 0) return res.status(403).json({ message: "Forbidden" });

        await db.query('DELETE FROM ipcrf_objectives WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/ipcrf/submit', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const { ipcrf_id } = req.body;
        const [ipcrfRows] = await db.query('SELECT * FROM ipcrf WHERE id = ? AND employee_id = ?', [ipcrf_id, employee.id]);
        if (ipcrfRows.length === 0) return res.status(403).json({ message: "Forbidden" });

        const period = await getActivePeriod();
        if (!period) return res.status(400).json({ message: "No active rating period" });

        const posType = classifyPosition(employee.position, employee.employee_type);

        const rater = await myRater(employee.id);

        await db.query("UPDATE ipcrf SET status = 'submitted', submitted_at = NOW(), ratee_signed = TRUE WHERE id = ?", [ipcrf_id]);

        const [existingComm] = await db.query(
            'SELECT id FROM performance_commitments WHERE employee_id = ? AND rating_period_id = ?',
            [employee.id, period.id]
        );

        let commitmentId;
        if (existingComm.length > 0) {
            commitmentId = existingComm[0].id;
            await db.query(
                "UPDATE performance_commitments SET status = 'submitted', submitted_at = NOW(), rater_id = ?, position_type = ? WHERE id = ?",
                [rater ? rater.id : null, posType, commitmentId]
            );
            await db.query('DELETE FROM performance_targets WHERE commitment_id = ?', [commitmentId]);
        } else {
            const [commResult] = await db.query(
                `INSERT INTO performance_commitments (employee_id, rating_period_id, position_type, status, submitted_at, rater_id)
                 VALUES (?, ?, ?, 'submitted', NOW(), ?)`,
                [employee.id, period.id, posType, rater ? rater.id : null]
            );
            commitmentId = commResult.insertId;
        }

        const [objectives] = await db.query(
            `SELECT io.*, k.kra_name, k.weight_percent as template_weight, COALESCE(io.weight_percent, k.weight_percent) as weight_percent,
                    (SELECT osr.average_rating 
                     FROM performance_objectives po 
                     JOIN objective_self_ratings osr ON osr.performance_objective_id = po.id 
                     WHERE po.ipcrf_objective_id = io.id 
                     ORDER BY osr.id DESC LIMIT 1) as computed_self_rating
             FROM ipcrf_objectives io
             JOIN kra_templates k ON io.kra_template_id = k.id
             WHERE io.ipcrf_id = ?
             ORDER BY io.sequence_no`,
            [ipcrf_id]
        );

        for (const obj of objectives) {
            const selfRatingVal = obj.computed_self_rating || obj.self_rating || null;
            await db.query(
                `INSERT INTO performance_targets (commitment_id, kra_template_id, kra_category, weight_percent, target_description, success_indicator, self_rating)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [commitmentId, obj.kra_template_id, obj.kra_name || 'Unassigned', obj.weight_percent || 0, obj.objective_description || obj.target_statement || '', obj.success_indicator || '', selfRatingVal]
            );
        }

        const io = req.app.get('socketio');
        if (io) {
            io.to(String(employee.id)).emit('ipcrf:status_changed', { newStatus: 'submitted' });
            io.emit('commitment:submitted', { commitment_id: commitmentId, employee_id: employee.id });
            io.emit('notification_received', { message: `${employee.name} has submitted their IPCRF for review.`, type: 'pm_submission' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/ipcrf/unsubmit', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const { ipcrf_id } = req.body;
        const [ipcrfRows] = await db.query('SELECT * FROM ipcrf WHERE id = ? AND employee_id = ?', [ipcrf_id, employee.id]);
        if (ipcrfRows.length === 0) return res.status(403).json({ message: "Forbidden" });

        const ipcrf = ipcrfRows[0];
        if (['reviewed', 'finalized', 'approved'].includes(ipcrf.status)) {
            return res.status(400).json({ message: "Cannot unsubmit an IPCRF that has already been approved or finalized." });
        }

        await db.query("UPDATE ipcrf SET status = 'not_submitted', ratee_signed = FALSE, signed_at = NULL WHERE id = ?", [ipcrf_id]);
        await db.query("UPDATE performance_commitments SET status = 'draft' WHERE employee_id = ? AND rating_period_id = ?", [employee.id, ipcrf.rating_period_id]);

        const io = req.app.get('socketio');
        if (io) {
            io.to(String(employee.id)).emit('ipcrf:status_changed', { newStatus: 'not_submitted' });
            io.emit('commitment:submitted', { employee_id: employee.id, status: 'draft' });
            io.emit('notification_received', { message: `${employee.name} recalled their IPCRF.`, type: 'pm_unsubmitted' });
        }

        res.json({ success: true, message: "IPCRF recalled successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/ipcrf/mov/upload', uploadMOV.single('file'), async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const { ipcrf_objective_id } = req.body;
        if (!req.file) return res.status(400).json({ message: "No file provided" });

        const [objRows] = await db.query('SELECT io.* FROM ipcrf_objectives io JOIN ipcrf i ON io.ipcrf_id = i.id WHERE io.id = ? AND i.employee_id = ?', [ipcrf_objective_id, employee.id]);
        if (objRows.length === 0) return res.status(403).json({ message: "Forbidden" });

        const [result] = await db.query(`
            INSERT INTO mov_uploads (ipcrf_objective_id, original_filename, stored_filename, file_size_bytes, file_type) 
            VALUES (?, ?, ?, ?, ?)
        `, [ipcrf_objective_id, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype]);

        res.json({ success: true, file: { id: result.insertId, original_filename: req.file.originalname, stored_filename: req.file.filename, file_size_bytes: req.file.size, file_type: req.file.mimetype } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/ipcrf/mov/:fileId', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const [rows] = await db.query('SELECT mu.* FROM mov_uploads mu JOIN ipcrf_objectives io ON mu.ipcrf_objective_id = io.id JOIN ipcrf i ON io.ipcrf_id = i.id WHERE mu.id = ? AND i.employee_id = ?', [req.params.fileId, employee.id]);
        const file = rows[0];
        if (!file) return res.status(404).json({ message: "File record not found" });

        const filePath = path.join(__dirname, '../../uploads/pm_movs', file.stored_filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await db.query('DELETE FROM mov_uploads WHERE id = ?', [req.params.fileId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Progress
router.get('/progress', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const period = await getActivePeriod();
        if (!period) return res.json({ objectives: [], coachingPlans: [], coachingFeedback: [] });

        const [ipcrfRows] = await db.query('SELECT * FROM ipcrf WHERE employee_id = ? AND rating_period_id = ?', [employee.id, period.id]);
        const ipcrf = ipcrfRows[0];
        if (!ipcrf) return res.json({ objectives: [], coachingPlans: [], coachingFeedback: [] });

        const [objRows] = await db.query(`
            SELECT io.*, k.kra_name, k.weight_percent as template_weight, COALESCE(io.weight_percent, k.weight_percent) as weight_percent
            FROM ipcrf_objectives io 
            LEFT JOIN kra_templates k ON io.kra_template_id = k.id 
            WHERE io.ipcrf_id = ? 
            ORDER BY io.sequence_no
        `, [ipcrf.id]);

        const [logs] = await db.query(`
            SELECT cl.id, cl.note as feedback_text, cl.entry_date as created_at, 'phase2' as phase, e.name as sender_name, cl.evidence_file_path
            FROM coaching_logs cl
            JOIN performance_commitments pc ON cl.commitment_id = pc.id
            JOIN employees e ON cl.author_id = e.id
            WHERE pc.employee_id = ?
            ORDER BY cl.created_at DESC
        `, [employee.id]);

        const [coachingFeedback] = await db.query('SELECT cf.*, e.name as sender_name FROM coaching_feedback cf LEFT JOIN employees e ON cf.rater_id = e.id WHERE cf.employee_id = ? AND cf.rating_period_id = ? ORDER BY cf.created_at DESC', [employee.id, period.id]);

        res.json({ objectives: objRows, coachingPlans, coachingFeedback: [...logs, ...coachingFeedback] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Feedback (standalone)
router.get('/feedback', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const period = await getActivePeriod();
        if (!period) return res.json([]);
        const [rows] = await db.query('SELECT cf.*, e.name as sender_name FROM coaching_feedback cf LEFT JOIN employees e ON cf.rater_id = e.id WHERE cf.employee_id = ? AND cf.rating_period_id = ? ORDER BY cf.created_at DESC', [employee.id, period.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Coaching Plans (standalone)
router.get('/coaching-plans', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const period = await getActivePeriod();
        if (!period) return res.json([]);
        const [rows] = await db.query('SELECT * FROM coaching_plans WHERE employee_id = ? AND rating_period_id = ? ORDER BY session_date DESC', [employee.id, period.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Review
router.get('/review', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const period = await getActivePeriod();
        let ipcrf = null;
        let objectives = [];
        let devPlanNotes = "";
        let raterName = "";
        if (period) {
            const [ipcrfRows] = await db.query('SELECT * FROM ipcrf WHERE employee_id = ? AND rating_period_id = ?', [employee.id, period.id]);
            ipcrf = ipcrfRows[0] || null;
            if (ipcrf) {
                const [objRows] = await db.query(`
                    SELECT io.*, k.kra_name, k.weight_percent as template_weight, COALESCE(io.weight_percent, k.weight_percent) as weight_percent, kr.rating 
                    FROM ipcrf_objectives io 
                    LEFT JOIN kra_templates k ON io.kra_template_id = k.id 
                    LEFT JOIN ipcrf_kra_ratings kr ON kr.ipcrf_id = io.ipcrf_id AND kr.kra_template_id = io.kra_template_id 
                    WHERE io.ipcrf_id = ? 
                    ORDER BY io.sequence_no
                `, [ipcrf.id]);
                for (let obj of objRows) {
                    const [files] = await db.query('SELECT * FROM mov_uploads WHERE ipcrf_objective_id = ?', [obj.id]);
                    obj.mov_uploads = files;
                }
                objectives = objRows;

                const [devPlanRows] = await db.query('SELECT * FROM development_plans WHERE ipcrf_id = ?', [ipcrf.id]);
                if (devPlanRows.length > 0) {
                    const dp = devPlanRows[0];
                    const parts = [];
                    if (dp.training_needs) parts.push(dp.training_needs);
                    if (dp.development_interventions) parts.push(dp.development_interventions);
                    devPlanNotes = parts.join('; ');
                }

                const rater = await myRater(employee.id);
                if (rater) raterName = rater.name;
            }
        }
        res.json({ ipcrf, objectives, devPlanNotes, raterName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/review/mov/upload', uploadMOV.single('file'), async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const { ipcrf_objective_id } = req.body;
        if (!req.file) return res.status(400).json({ message: "No file provided" });

        const [objRows] = await db.query('SELECT io.* FROM ipcrf_objectives io JOIN ipcrf i ON io.ipcrf_id = i.id WHERE io.id = ? AND i.employee_id = ?', [ipcrf_objective_id, employee.id]);
        if (objRows.length === 0) return res.status(403).json({ message: "Forbidden" });

        const [result] = await db.query(`
            INSERT INTO mov_uploads (ipcrf_objective_id, original_filename, stored_filename, file_size_bytes, file_type) 
            VALUES (?, ?, ?, ?, ?)
        `, [ipcrf_objective_id, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype]);

        res.json({ success: true, file: { id: result.insertId, original_filename: req.file.originalname, stored_filename: req.file.filename, file_size_bytes: req.file.size, file_type: req.file.mimetype } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Recognition
router.get('/recognition', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const period = await getActivePeriod();
        let ipcrf = null;
        let ratings = [];
        let devPlanItems = [];
        let eligible = false;
        if (period) {
            const [ipcrfRows] = await db.query('SELECT * FROM ipcrf WHERE employee_id = ? AND rating_period_id = ?', [employee.id, period.id]);
            ipcrf = ipcrfRows[0] || null;
            if (ipcrf) {
                const [ratingsRows] = await db.query(`
                    SELECT k.kra_name as name, kr.rating, k.weight_percent as weight 
                    FROM ipcrf_kra_ratings kr 
                    JOIN kra_templates k ON kr.kra_template_id = k.id 
                    WHERE kr.ipcrf_id = ?
                `, [ipcrf.id]);
                ratings = ratingsRows;

                const [devPlanItemsRows] = await db.query('SELECT * FROM development_plan_items WHERE ipcrf_id = ?', [ipcrf.id]);
                devPlanItems = devPlanItemsRows;

                const [pcRows] = await db.query('SELECT overall_weighted_score FROM performance_commitments WHERE employee_id = ? AND rating_period_id = ?', [employee.id, period.id]);
                const pcScore = pcRows[0] ? parseFloat(pcRows[0].overall_weighted_score) : 0;

                let sum = 0;
                let weightTotal = 0;
                for (const r of ratingsRows) {
                    sum += parseFloat(r.rating) * parseFloat(r.weight);
                    weightTotal += parseFloat(r.weight);
                }
                const calculatedWar = weightTotal > 0 ? (sum / weightTotal) : 0;

                const finalScore = ipcrf.weighted_average_rating || pcScore || calculatedWar;
                eligible = finalScore >= 3.5;
            }
        }
        res.json({ ipcrf, ratings, devPlanItems, eligible });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update actual accomplishment for an objective
router.put('/review/actual/:id', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });
        const { actual_accomplishment } = req.body;
        
        await db.query(
            `UPDATE ipcrf_objectives io 
             JOIN ipcrf i ON io.ipcrf_id = i.id 
             SET io.actual_accomplishment = ? 
             WHERE io.id = ? AND i.employee_id = ?`,
            [actual_accomplishment, req.params.id, employee.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// PERFORMANCE OBJECTIVES (nested under ipcrf_objectives)
// ==========================================

router.post('/ipcrf/objective/:parentObjId/perf-objective', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        const { objective_description, mfo_category, timeline_start, timeline_end, objective_weight } = req.body;
        const parentObjId = req.params.parentObjId;

        const [parent] = await db.query(
            'SELECT io.id FROM ipcrf_objectives io JOIN ipcrf i ON io.ipcrf_id = i.id WHERE io.id = ? AND i.employee_id = ?',
            [parentObjId, employee.id]
        );
        if (parent.length === 0) return res.status(403).json({ message: "Forbidden" });

        const [count] = await db.query(
            'SELECT COALESCE(MAX(sequence_no), 0) + 1 as next_seq FROM performance_objectives WHERE ipcrf_objective_id = ?',
            [parentObjId]
        );

        const [result] = await db.query(
            `INSERT INTO performance_objectives (ipcrf_objective_id, sequence_no, objective_description, mfo_category, timeline_start, timeline_end, objective_weight)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [parentObjId, count[0].next_seq, objective_description || '', mfo_category || '', timeline_start || null, timeline_end || null, objective_weight || 0]
        );

        const [rows] = await db.query('SELECT * FROM performance_objectives WHERE id = ?', [result.insertId]);
        res.json({ success: true, objective: rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/ipcrf/perf-objective/:id', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        const { objective_description, mfo_category, timeline_start, timeline_end, objective_weight, sequence_no } = req.body;
        const [check] = await db.query(
            'SELECT po.id FROM performance_objectives po JOIN ipcrf_objectives io ON po.ipcrf_objective_id = io.id JOIN ipcrf i ON io.ipcrf_id = i.id WHERE po.id = ? AND i.employee_id = ?',
            [req.params.id, employee.id]
        );
        if (check.length === 0) return res.status(403).json({ message: "Forbidden" });

        const fields = [];
        const values = [];
        if (objective_description !== undefined) { fields.push('objective_description = ?'); values.push(objective_description); }
        if (mfo_category !== undefined) { fields.push('mfo_category = ?'); values.push(mfo_category); }
        if (timeline_start !== undefined) { fields.push('timeline_start = ?'); values.push(timeline_start); }
        if (timeline_end !== undefined) { fields.push('timeline_end = ?'); values.push(timeline_end); }
        if (objective_weight !== undefined) { fields.push('objective_weight = ?'); values.push(objective_weight); }
        if (sequence_no !== undefined) { fields.push('sequence_no = ?'); values.push(sequence_no); }

        if (fields.length === 0) return res.json({ success: true });
        values.push(req.params.id);
        await db.query(`UPDATE performance_objectives SET ${fields.join(', ')} WHERE id = ?`, values);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/ipcrf/perf-objective/:id', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        const [check] = await db.query(
            'SELECT po.id FROM performance_objectives po JOIN ipcrf_objectives io ON po.ipcrf_objective_id = io.id JOIN ipcrf i ON io.ipcrf_id = i.id WHERE po.id = ? AND i.employee_id = ?',
            [req.params.id, employee.id]
        );
        if (check.length === 0) return res.status(403).json({ message: "Forbidden" });

        await db.query('DELETE FROM performance_objectives WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// PERFORMANCE INDICATORS (rubric per objective)
// ==========================================

router.put('/ipcrf/perf-objective/:objId/indicators', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        const [check] = await db.query(
            'SELECT po.id FROM performance_objectives po JOIN ipcrf_objectives io ON po.ipcrf_objective_id = io.id JOIN ipcrf i ON io.ipcrf_id = i.id WHERE po.id = ? AND i.employee_id = ?',
            [req.params.objId, employee.id]
        );
        if (check.length === 0) return res.status(403).json({ message: "Forbidden" });

        const { indicators } = req.body; // array of { dimension, level_5_text, ..., level_1_text }
        for (const ind of indicators) {
            const [existing] = await db.query(
                'SELECT id FROM performance_indicators WHERE performance_objective_id = ? AND dimension = ?',
                [req.params.objId, ind.dimension]
            );
            if (existing.length > 0) {
                await db.query(
                    'UPDATE performance_indicators SET level_5_text = ?, level_4_text = ?, level_3_text = ?, level_2_text = ?, level_1_text = ? WHERE id = ?',
                    [ind.level_5_text, ind.level_4_text, ind.level_3_text, ind.level_2_text, ind.level_1_text, existing[0].id]
                );
            } else {
                await db.query(
                    'INSERT INTO performance_indicators (performance_objective_id, dimension, level_5_text, level_4_text, level_3_text, level_2_text, level_1_text) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [req.params.objId, ind.dimension, ind.level_5_text, ind.level_4_text, ind.level_3_text, ind.level_2_text, ind.level_1_text]
                );
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// PLANNED MOV ITEMS (text list)
// ==========================================

router.post('/ipcrf/perf-objective/:objId/planned-mov', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        const [check] = await db.query(
            'SELECT po.id FROM performance_objectives po JOIN ipcrf_objectives io ON po.ipcrf_objective_id = io.id JOIN ipcrf i ON io.ipcrf_id = i.id WHERE po.id = ? AND i.employee_id = ?',
            [req.params.objId, employee.id]
        );
        if (check.length === 0) return res.status(403).json({ message: "Forbidden" });

        const { description } = req.body;
        if (!description) return res.status(400).json({ message: "Description required" });

        const [result] = await db.query(
            'INSERT INTO planned_mov_items (performance_objective_id, description) VALUES (?, ?)',
            [req.params.objId, description]
        );
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/ipcrf/planned-mov/:id', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        const [check] = await db.query(
            'SELECT pm.id FROM planned_mov_items pm JOIN performance_objectives po ON pm.performance_objective_id = po.id JOIN ipcrf_objectives io ON po.ipcrf_objective_id = io.id JOIN ipcrf i ON io.ipcrf_id = i.id WHERE pm.id = ? AND i.employee_id = ?',
            [req.params.id, employee.id]
        );
        if (check.length === 0) return res.status(403).json({ message: "Forbidden" });

        await db.query('DELETE FROM planned_mov_items WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// SELF-RATING (Q/E/T per objective)
// ==========================================

router.put('/ipcrf/perf-objective/:objId/self-rating', async (req, res) => {
    try {
        const employee = await getMyEmployee(req);
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        const [check] = await db.query(
            'SELECT po.id FROM performance_objectives po JOIN ipcrf_objectives io ON po.ipcrf_objective_id = io.id JOIN ipcrf i ON io.ipcrf_id = i.id WHERE po.id = ? AND i.employee_id = ?',
            [req.params.objId, employee.id]
        );
        if (check.length === 0) return res.status(403).json({ message: "Forbidden" });

        const { quality_rating, efficiency_rating, timeliness_rating } = req.body;

        const [existing] = await db.query('SELECT id FROM objective_self_ratings WHERE performance_objective_id = ?', [req.params.objId]);

        const avg = (quality_rating + efficiency_rating + timeliness_rating) / 3;
        const [objRows] = await db.query('SELECT objective_weight FROM performance_objectives WHERE id = ?', [req.params.objId]);
        const weight = parseFloat(objRows[0]?.objective_weight || 0) / 100;
        const score = avg * weight;

        if (existing.length > 0) {
            await db.query(
                'UPDATE objective_self_ratings SET quality_rating = ?, efficiency_rating = ?, timeliness_rating = ?, average_rating = ?, score = ?, rated_at = NOW() WHERE id = ?',
                [quality_rating, efficiency_rating, timeliness_rating, avg, score, existing[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO objective_self_ratings (performance_objective_id, quality_rating, efficiency_rating, timeliness_rating, average_rating, score, rated_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [req.params.objId, quality_rating, efficiency_rating, timeliness_rating, avg, score]
            );
        }
        res.json({ success: true, average_rating: avg, score });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
