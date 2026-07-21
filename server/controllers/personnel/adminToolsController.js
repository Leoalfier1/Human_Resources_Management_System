const db = require('../../db');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const DUMP_DIR = path.join(__dirname, '../../backups');
const MYSQLDUMP_PATH = process.env.MYSQLDUMP_PATH || 'mysqldump';

const csvEscape = (val) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
};

// ─────────────────────────────────────────────────
// Leave Credit Accrual — manual, logs to audit
// ─────────────────────────────────────────────────
exports.accrueLeaveCredits = async (req, res) => {
    try {
        const { employee_id, leave_type, days, reason } = req.body;
        if (!leave_type || !days) {
            return res.status(400).json({ message: 'leave_type and days are required.' });
        }

        const creditField = {
            sick: 'sick_leave_balance',
            vacation: 'vacation_leave_balance',
            forced: 'forced_leave_balance',
            special_privilege: 'special_privilege_balance'
        }[leave_type];

        if (!creditField) return res.status(400).json({ message: 'Invalid leave_type.' });

        if (employee_id) {
            await db.query(
                `UPDATE leave_credits SET ${creditField} = ${creditField} + ? WHERE employee_id = ?`,
                [days, employee_id]
            );
        } else {
            await db.query(`UPDATE leave_credits SET ${creditField} = ${creditField} + ?`, [days]);
        }

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, employee_id || null, 'leave_accrual', `Accrued ${days} day(s) of ${leave_type} leave${employee_id ? ' for employee #' + employee_id : ' for all employees'}. Reason: ${reason || 'N/A'}`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: `Accrued ${days} day(s) of ${leave_type} leave.` });
    } catch (error) {
        console.error('accrueLeaveCredits Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────
// Year-End Lock — snapshot balances into leave_carryover
// ─────────────────────────────────────────────────
exports.yearEndLock = async (req, res) => {
    try {
        const { fiscal_year } = req.body;
        const year = fiscal_year || new Date().getFullYear();

        const [existing] = await db.query(
            'SELECT id FROM leave_carryover WHERE fiscal_year = ? LIMIT 1',
            [year]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: `Year ${year} is already locked.` });
        }

        const [credits] = await db.query('SELECT * FROM leave_credits');

        let locked = 0;
        for (const c of credits) {
            const sick_usage = Math.max(0, 15 - c.sick_leave_balance);
            const vac_usage = Math.max(0, 15 - c.vacation_leave_balance);

            const sick_carry = Math.min(c.sick_leave_balance, 10);
            const vac_carry = Math.min(c.vacation_leave_balance, 10);
            const forced_carry = Math.min(c.forced_leave_balance, 10);
            const sp_carry = Math.min(c.special_privilege_balance, 10);

            await db.query(
                `INSERT INTO leave_carryover
                 (employee_id, fiscal_year,
                  sick_leave_balance, sick_leave_used, sick_leave_carryover,
                  vacation_leave_balance, vacation_leave_used, vacation_leave_carryover,
                  forced_leave_balance, special_privilege_balance,
                  locked_by, locked_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    c.employee_id, year,
                    c.sick_leave_balance, sick_usage, sick_carry,
                    c.vacation_leave_balance, vac_usage, vac_carry,
                    c.forced_leave_balance, c.special_privilege_balance,
                    req.user.id
                ]
            );

            await db.query(
                `UPDATE leave_credits SET
                    sick_leave_balance = ?,
                    vacation_leave_balance = ?,
                    forced_leave_balance = ?,
                    special_privilege_balance = ?
                 WHERE employee_id = ?`,
                [sick_carry, vac_carry, forced_carry, sp_carry, c.employee_id]
            );

            locked++;
        }

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, null, 'year_end_lock', `Year-end lock executed for FY ${year}. ${locked} employee(s) locked.`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: `Year-end lock complete for FY ${year}. ${locked} employee(s) processed.` });
    } catch (error) {
        console.error('yearEndLock Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────
// Database Backup — mysqldump, admin only
// ─────────────────────────────────────────────────
exports.dbBackup = async (req, res) => {
    try {
        if (!fs.existsSync(DUMP_DIR)) fs.mkdirSync(DUMP_DIR, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `deped_hrmis_backup_${timestamp}.sql`;
        const filepath = path.join(DUMP_DIR, filename);

        const dbUser = process.env.DB_USER || 'root';
        const dbPass = process.env.DB_PASS || '';
        const dbName = process.env.DB_NAME || 'deped_hrmis';

        const passArg = dbPass ? `-u${dbUser} -p${dbPass}` : `-u${dbUser}`;
        const cmd = `"${MYSQLDUMP_PATH}" ${passArg} ${dbName} > "${filepath}"`;

        await new Promise((resolve, reject) => {
            exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
                if (err) reject(new Error(stderr || err.message));
                else resolve();
            });
        });

        const stats = fs.statSync(filepath);

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, null, 'db_backup', `Database backup created: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`]
        );

        res.json({ message: 'Backup created.', filename, size: stats.size });
    } catch (error) {
        console.error('dbBackup Error:', error);
        res.status(500).json({ message: 'Backup failed: ' + error.message });
    }
};

// ─────────────────────────────────────────────────
// List Backups
// ─────────────────────────────────────────────────
exports.listBackups = async (req, res) => {
    try {
        if (!fs.existsSync(DUMP_DIR)) return res.json([]);
        const files = fs.readdirSync(DUMP_DIR)
            .filter(f => f.endsWith('.sql'))
            .map(f => {
                const stats = fs.statSync(path.join(DUMP_DIR, f));
                return { filename: f, size: stats.size, created: stats.mtime };
            })
            .sort((a, b) => b.created - a.created);
        res.json(files);
    } catch (error) {
        console.error('listBackups Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────
// Reset Leave Balances — all employees to default
// ─────────────────────────────────────────────────
exports.resetBalances = async (req, res) => {
    try {
        const { employee_id } = req.body;

        // NOTE: forced_leave and special_privilege reset to 0 (not the new-hire
        // defaults of 5/3 from employeeHelper.js) because these are annual
        // use-it-or-lose-it grants per CSC rules — they don't carry over, so a
        // reset starts from zero, not from the initial appointment grant.
        if (employee_id) {
            await db.query(
                'UPDATE leave_credits SET sick_leave_balance = 15, vacation_leave_balance = 15, forced_leave_balance = 0, special_privilege_balance = 0 WHERE employee_id = ?',
                [employee_id]
            );
        } else {
            await db.query(
                'UPDATE leave_credits SET sick_leave_balance = 15, vacation_leave_balance = 15, forced_leave_balance = 0, special_privilege_balance = 0'
            );
        }

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, employee_id || null, 'reset_balances', `Leave balances reset${employee_id ? ' for employee #' + employee_id : ' for all employees'}`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: 'Leave balances reset.' });
    } catch (error) {
        console.error('resetBalances Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────
// Export Leave Applications — CSV
// ─────────────────────────────────────────────────
exports.exportLeaveApplications = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT la.id, e.employee_no, e.first_name, e.last_name, e.position_title, la.leave_type,
                    la.date_from, la.date_to, la.num_days, la.status, la.reason, la.created_at
             FROM leave_applications la
             JOIN employees e ON e.id = la.employee_id
             ORDER BY la.created_at DESC`
        );

        const header = 'ID,Employee No,Name,Position,Leave Type,Date From,Date To,Days,Status,Reason,Created\n';
        const csv = header + rows.map(r =>
            [r.id, csvEscape(r.employee_no), csvEscape(`${r.first_name || ''} ${r.last_name || ''}`),
             csvEscape(r.position_title), r.leave_type, r.date_from, r.date_to,
             r.num_days || '', r.status, csvEscape(r.reason), r.created_at].join(',')
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="leave_applications_export.csv"');
        res.send(csv);
    } catch (error) {
        console.error('exportLeaveApplications Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────
// Export Leave Credits — CSV
// ─────────────────────────────────────────────────
exports.exportLeaveCredits = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT e.employee_no, e.first_name, e.last_name, e.position_title, e.assigned_school,
                    lc.sick_leave_balance, lc.vacation_leave_balance, lc.forced_leave_balance, lc.special_privilege_balance
             FROM leave_credits lc
             JOIN employees e ON e.id = lc.employee_id
             ORDER BY e.last_name ASC`
        );

        const header = 'Employee No,Name,Position,School,Sick Leave,Vacation Leave,Forced Leave,Special Privilege\n';
        const csv = header + rows.map(r =>
            `${r.employee_no || ''},"${r.first_name || ''} ${r.last_name || ''}","${r.position_title || ''}","${r.assigned_school || ''}",${r.sick_leave_balance},${r.vacation_leave_balance},${r.forced_leave_balance},${r.special_privilege_balance}`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="leave_credits_export.csv"');
        res.send(csv);
    } catch (error) {
        console.error('exportLeaveCredits Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────
// Admin Dashboard Stats — leave summary
// ─────────────────────────────────────────────────
exports.adminStats = async (req, res) => {
    try {
        const [total] = await db.query('SELECT COUNT(*) as c FROM leave_applications');
        const [pending] = await db.query("SELECT COUNT(*) as c FROM leave_applications WHERE status = 'pending'");
        const [recommended] = await db.query("SELECT COUNT(*) as c FROM leave_applications WHERE status = 'recommended'");
        const [approved] = await db.query("SELECT COUNT(*) as c FROM leave_applications WHERE status = 'approved'");
        const [rejected] = await db.query("SELECT COUNT(*) as c FROM leave_applications WHERE status = 'rejected'");
        const [employees] = await db.query('SELECT COUNT(*) as c FROM employees');
        const [credits] = await db.query('SELECT COUNT(*) as c FROM leave_credits');
        const [lockExists] = await db.query(
            'SELECT fiscal_year FROM leave_carryover WHERE fiscal_year = ?',
            [new Date().getFullYear()]
        );

        res.json({
            total: total[0].c,
            pending: pending[0].c,
            recommended: recommended[0].c,
            approved: approved[0].c,
            rejected: rejected[0].c,
            employees: employees[0].c,
            creditRecords: credits[0].c,
            currentYearLocked: lockExists.length > 0
        });
    } catch (error) {
        console.error('adminStats Error:', error);
        res.status(500).json({ message: error.message });
    }
};
