const db = require('../../db');

exports.getMyProfile = async (req, res) => {
    try {
        let empRow = null;
        try {
            const [emp] = await db.query(
                `SELECT e.*, lc.sick_leave_balance, lc.vacation_leave_balance,
                        lc.forced_leave_balance, lc.special_privilege_balance
                 FROM employees e
                 LEFT JOIN leave_credits lc ON lc.employee_id = e.id
                 WHERE e.user_id = ?`,
                [req.user.id]
            );
            if (emp.length > 0) empRow = emp[0];
        } catch {
            empRow = null;
        }

        // Fetch actual user record from users table for fallback
        const [userRows] = await db.query('SELECT full_name, email FROM users WHERE id = ?', [req.user.id]);
        const userRecord = userRows.length > 0 ? userRows[0] : null;
        const userName = userRecord?.full_name || '';
        const userEmail = userRecord?.email || '';

        const nameParts = userName.split(' ');
        const firstName = empRow?.first_name || nameParts[0] || '';
        const lastName = empRow?.last_name || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');
        const middleName = empRow?.middle_name || (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '');

        res.json({
            id: empRow?.id || null,
            user_id: req.user.id,
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            name_extension: empRow?.name_extension || '',
            employee_no: empRow?.employee_no || '',
            email: empRow?.email || userEmail || '',
            mobile_no: empRow?.mobile_no || '',
            assigned_school: empRow?.assigned_school || '',
            position_title: empRow?.position_title || '',
            sex: empRow?.sex || '',
            civil_status: empRow?.civil_status || '',
            date_of_birth: empRow?.date_of_birth ? empRow.date_of_birth.split('T')[0] : '',
            place_of_birth: empRow?.place_of_birth || '',
            blood_type: empRow?.blood_type || '',
            address: empRow?.address || '',
            gsis_id: empRow?.gsis_id || '',
            pagibig_id: empRow?.pagibig_id || '',
            philhealth_no: empRow?.philhealth_no || '',
            tin_no: empRow?.tin_no || '',
            sick_leave_balance: empRow?.sick_leave_balance ?? 15,
            vacation_leave_balance: empRow?.vacation_leave_balance ?? 12,
        });
    } catch (error) {
        console.error('getMyProfile Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.requestProfileUpdate = async (req, res) => {
    try {
        const { details } = req.body;
        const [emp] = await db.query('SELECT id FROM employees WHERE user_id = ?', [req.user.id]);
        if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });

        await db.query(
            'INSERT INTO document_requests (employee_id, request_type, details, status) VALUES (?, ?, ?, ?)',
            [emp[0].id, 'correction_personal_info', details || 'Request to update profile information', 'pending']
        );
        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: 'Profile update request submitted.' });
    } catch (error) {
        console.error('requestProfileUpdate Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllEmployees = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, employment_type, employment_status, assigned_school, is_active } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        let where = ['1=1'];
        let params = [];

        if (search) {
            where.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_no LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (employment_type) { where.push('e.employment_type = ?'); params.push(employment_type); }
        if (employment_status) { where.push('e.employment_status = ?'); params.push(employment_status); }
        if (assigned_school) { where.push('e.assigned_school LIKE ?'); params.push(`%${assigned_school}%`); }
        if (is_active !== undefined && is_active !== '') { where.push('e.is_active = ?'); params.push(is_active); }

        const whereClause = where.join(' AND ');

        const [count] = await db.query(`SELECT COUNT(*) as total FROM employees e WHERE ${whereClause}`, params);
        const [rows] = await db.query(
            `SELECT e.*, u.email as user_email
             FROM employees e
             LEFT JOIN users u ON u.id = e.user_id
             WHERE ${whereClause}
             ORDER BY e.last_name ASC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({
            employees: rows,
            total: count[0].total,
            page: parseInt(page),
            totalPages: Math.ceil(count[0].total / parseInt(limit))
        });
    } catch (error) {
        console.error('getAllEmployees Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const [emp] = await db.query(
            `SELECT e.*, u.email as user_email, u.full_name as user_full_name,
                    lc.sick_leave_balance, lc.vacation_leave_balance,
                    lc.forced_leave_balance, lc.special_privilege_balance
             FROM employees e
             LEFT JOIN users u ON u.id = e.user_id
             LEFT JOIN leave_credits lc ON lc.employee_id = e.id
             WHERE e.id = ?`,
            [id]
        );
        if (emp.length === 0) return res.status(404).json({ message: 'Employee not found.' });
        res.json(emp[0]);
    } catch (error) {
        console.error('getEmployeeById Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createEmployee = async (req, res) => {
    try {
        const { user_id, first_name, middle_name, last_name, name_extension,
                date_of_birth, place_of_birth, sex, civil_status, blood_type,
                gsis_id, pagibig_id, philhealth_no, tin_no, mobile_no, email, address,
                employment_status, employment_type, position_title, salary_grade,
                monthly_salary, item_number, assigned_school, date_hired, date_original_appointment } = req.body;

        if (!user_id || !first_name || !last_name) {
            return res.status(400).json({ message: 'user_id, first_name, and last_name are required.' });
        }

        const validTypes = ['teaching', 'non-teaching', 'teaching_related'];
        const category = employment_type || 'teaching';
        if (!validTypes.includes(category)) {
            return res.status(400).json({ message: 'Invalid employment_type. Must be teaching, non-teaching, or teaching_related.' });
        }

        const prefixMap = { teaching: 'T', 'non-teaching': 'NT', teaching_related: 'TR' };
        const prefix = prefixMap[category];

        // Generate employee_no with retry for race-condition safety (UNIQUE constraint on employee_no)
        let employee_no;
        let inserted = false;
        const maxAttempts = 10;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const [rows] = await db.query(
                `SELECT employee_no FROM employees WHERE employee_no LIKE ? ORDER BY id DESC LIMIT 1`,
                [`${prefix}%`]
            );

            let nextNum = 1;
            if (rows.length > 0) {
                const numericPart = rows[0].employee_no.slice(prefix.length);
                nextNum = parseInt(numericPart, 10) + 1;
            }
            employee_no = prefix + String(nextNum).padStart(3, '0');

            try {
                const [result] = await db.query(
                    `INSERT INTO employees (user_id, employee_no, first_name, middle_name, last_name, name_extension,
                     date_of_birth, place_of_birth, sex, civil_status, blood_type,
                     gsis_id, pagibig_id, philhealth_no, tin_no, mobile_no, email, address,
                     employment_status, employment_type, position_title, salary_grade,
                     monthly_salary, item_number, assigned_school, date_hired, date_original_appointment)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [user_id, employee_no, first_name, middle_name || null, last_name, name_extension || null,
                     date_of_birth || null, place_of_birth || null, sex || null, civil_status || null, blood_type || null,
                     gsis_id || null, pagibig_id || null, philhealth_no || null, tin_no || null, mobile_no || null, email || null, address || null,
                     employment_status || 'permanent', category, position_title || null, salary_grade || null,
                     monthly_salary || null, item_number || null, assigned_school || null, date_hired || null, date_original_appointment || null]
                );

                await db.query(
                    'INSERT INTO leave_credits (employee_id, sick_leave_balance, vacation_leave_balance, forced_leave_balance, special_privilege_balance, as_of_date) VALUES (?, 15, 15, 5, 3, CURDATE())',
                    [result.insertId]
                );

                await db.query(
                    'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
                    [req.user.id, result.insertId, 'employee_created', `Created employee record for ${first_name} ${last_name}`]
                );

                const io = req.app.get('socketio');
                if (io) io.emit('personnel:update');

                inserted = true;
                res.status(201).json({ message: 'Employee created successfully.', id: result.insertId, employee_no });
                break;
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY' && attempt < maxAttempts) {
                    continue;
                }
                throw error;
            }
        }

        if (!inserted) {
            throw new Error('Could not generate unique employee_no after ' + maxAttempts + ' attempts');
        }
    } catch (error) {
        console.error('createEmployee Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateMyProfile = async (req, res) => {
    try {
        const allowed = [
            'first_name', 'middle_name', 'last_name', 'name_extension',
            'date_of_birth', 'place_of_birth', 'sex', 'civil_status', 'blood_type',
            'gsis_id', 'pagibig_id', 'philhealth_no', 'tin_no', 'mobile_no', 'email', 'address',
            'assigned_school'
        ];
        const payload = {};
        allowed.forEach(f => {
            if (req.body[f] !== undefined) payload[f] = req.body[f];
        });
        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update.' });
        }

        const ensureEmployeesTable = async () => {
            await db.query(`
                CREATE TABLE IF NOT EXISTS employees (
                    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL UNIQUE,
                    employee_no VARCHAR(50) DEFAULT NULL,
                    first_name VARCHAR(100) DEFAULT NULL,
                    middle_name VARCHAR(100) DEFAULT NULL,
                    last_name VARCHAR(100) DEFAULT NULL,
                    name_extension VARCHAR(20) DEFAULT NULL,
                    date_of_birth DATE DEFAULT NULL,
                    place_of_birth VARCHAR(255) DEFAULT NULL,
                    sex VARCHAR(20) DEFAULT NULL,
                    civil_status VARCHAR(30) DEFAULT NULL,
                    blood_type VARCHAR(10) DEFAULT NULL,
                    gsis_id VARCHAR(50) DEFAULT NULL,
                    pagibig_id VARCHAR(50) DEFAULT NULL,
                    philhealth_no VARCHAR(50) DEFAULT NULL,
                    tin_no VARCHAR(50) DEFAULT NULL,
                    mobile_no VARCHAR(50) DEFAULT NULL,
                    email VARCHAR(150) DEFAULT NULL,
                    address TEXT DEFAULT NULL,
                    assigned_school VARCHAR(255) DEFAULT NULL,
                    employment_status VARCHAR(50) DEFAULT 'permanent',
                    employment_type VARCHAR(50) DEFAULT 'teaching',
                    position_title VARCHAR(100) DEFAULT 'Teacher III',
                    is_active TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
        };

        let emp = [];
        try {
            [emp] = await db.query('SELECT id, user_id FROM employees WHERE user_id = ?', [req.user.id]);
        } catch (dbErr) {
            if (dbErr.code === 'ER_NO_SUCH_TABLE') {
                await ensureEmployeesTable();
                [emp] = await db.query('SELECT id, user_id FROM employees WHERE user_id = ?', [req.user.id]);
            } else {
                throw dbErr;
            }
        }

        if (emp.length > 0) {
            await db.query('UPDATE employees SET ? WHERE id = ?', [payload, emp[0].id]);
        } else {
            const [existingUser] = await db.query('SELECT full_name, email FROM users WHERE id = ?', [req.user.id]);
            const userName = existingUser.length > 0 ? existingUser[0].full_name : '';
            const userEmail = existingUser.length > 0 ? existingUser[0].email : '';
            const empNo = 'DEPED-2024-' + String(req.user.id).padStart(5, '0');
            const defaultPos = 'TBD';
            await db.query(
                `INSERT INTO employees (user_id, employee_no, first_name, middle_name, last_name, name_extension,
                 date_of_birth, place_of_birth, sex, civil_status, blood_type, gsis_id, pagibig_id, philhealth_no,
                 tin_no, mobile_no, email, address, assigned_school, employment_status, employment_type, position_title)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'permanent', 'teaching', ?)`,
                [
                  req.user.id, empNo, payload.first_name || '', payload.middle_name || '', payload.last_name || '',
                  payload.name_extension || '', payload.date_of_birth || null, payload.place_of_birth || '',
                  payload.sex || '', payload.civil_status || '', payload.blood_type || '', payload.gsis_id || '',
                  payload.pagibig_id || '', payload.philhealth_no || '', payload.tin_no || '', payload.mobile_no || '',
                  payload.email || userEmail || '', payload.address || '', payload.assigned_school || '', defaultPos
                ]
            );
        }

        if (payload.first_name || payload.last_name) {
            const fullName = [payload.first_name, payload.middle_name, payload.last_name].filter(Boolean).join(' ');
            if (fullName.trim()) {
                await db.query('UPDATE users SET full_name = ? WHERE id = ?', [fullName, req.user.id]);
            }
        }

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('ld:profile:updated', { userId: req.user.id, updatedFields: payload });
            io.to('ld-admin').emit('ld:dashboard:update');
            io.to(`ld-user-${req.user.id}`).emit('ld:dashboard:update');
        }

        res.json({ message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('updateMyProfile Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const allowed = [
            'employee_no', 'first_name', 'middle_name', 'last_name', 'name_extension',
            'date_of_birth', 'place_of_birth', 'sex', 'civil_status', 'blood_type',
            'gsis_id', 'pagibig_id', 'philhealth_no', 'tin_no', 'mobile_no', 'email', 'address',
            'employment_status', 'employment_type', 'position_title', 'salary_grade',
            'monthly_salary', 'item_number', 'assigned_school', 'date_hired', 'date_original_appointment'
        ];
        const payload = {};
        allowed.forEach(f => {
            if (req.body[f] !== undefined) payload[f] = req.body[f];
        });
        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update.' });
        }

        await db.query('UPDATE employees SET ? WHERE id = ?', [payload, id]);

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, id, 'employee_updated', `Updated employee #${id}`]
        );

        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');

        res.json({ message: 'Employee updated successfully.' });
    } catch (error) {
        console.error('updateEmployee Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.archiveEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE employees SET is_active = 0 WHERE id = ?', [id]);
        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, id, 'employee_archived', `Archived employee #${id}`]
        );
        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: 'Employee archived.' });
    } catch (error) {
        console.error('archiveEmployee Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.restoreEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE employees SET is_active = 1 WHERE id = ?', [id]);
        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, id, 'employee_restored', `Restored employee #${id}`]
        );
        const io = req.app.get('socketio');
        if (io) io.emit('personnel:update');
        res.json({ message: 'Employee restored.' });
    } catch (error) {
        console.error('restoreEmployee Error:', error);
        res.status(500).json({ message: error.message });
    }
};
