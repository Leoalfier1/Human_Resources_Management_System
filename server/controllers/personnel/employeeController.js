const db = require('../../db');
const { findOrCreateEmployee } = require('../../utils/employeeHelper');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/personnel/employees');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'EMP-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const photoFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
};

exports.uploadPhoto = multer({
    storage: photoStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: photoFilter
}).single('photo');

// ── Helpers ──────────────────────────────────────
const csvEscape = (val) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
};

const formatYearsOfService = (months) => {
    if (months === null || months === undefined) return '—';
    const yrs = Math.floor(months / 12);
    const mos = months % 12;
    if (yrs === 0) return `${mos} mos`;
    if (mos === 0) return `${yrs} yr${yrs !== 1 ? 's' : ''}`;
    return `${yrs} yr${yrs !== 1 ? 's' : ''} ${mos} mos`;
};

exports.getMyProfile = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });
        const [emp] = await db.query(
            `SELECT e.*,
                    lc.sick_leave_balance, lc.vacation_leave_balance,
                    lc.forced_leave_balance, lc.special_privilege_balance,
                    pds.status as pds_status,
                    pds.first_name as pds_first_name,
                    pds.middle_name as pds_middle_name,
                    pds.surname as pds_surname,
                    pds.name_extension as pds_name_extension,
                    pds.date_of_birth as pds_date_of_birth,
                    pds.place_of_birth as pds_place_of_birth,
                    pds.sex as pds_sex,
                    pds.civil_status as pds_civil_status,
                    pds.blood_type as pds_blood_type,
                    pds.mobile_no as pds_mobile_no,
                    pds.email_address as pds_email_address,
                    pds.gsis_id_no as pds_gsis_id_no,
                    pds.pagibig_id_no as pds_pagibig_id_no,
                    pds.philhealth_no as pds_philhealth_no,
                    pds.tin_no as pds_tin_no,
                    pds.photo_path as pds_photo_path,
                    pds.perm_same_as_residential as pds_perm_same_as_residential,
                    pds.res_house_block_lot as pds_res_house_block_lot,
                    pds.res_street as pds_res_street,
                    pds.res_subdivision_village as pds_res_subdivision_village,
                    pds.res_barangay as pds_res_barangay,
                    pds.res_city_municipality as pds_res_city_municipality,
                    pds.res_province as pds_res_province,
                    pds.perm_house_block_lot as pds_perm_house_block_lot,
                    pds.perm_street as pds_perm_street,
                    pds.perm_subdivision_village as pds_perm_subdivision_village,
                    pds.perm_barangay as pds_perm_barangay,
                    pds.perm_city_municipality as pds_perm_city_municipality,
                    pds.perm_province as pds_perm_province
             FROM employees e
             LEFT JOIN leave_credits lc ON lc.employee_id = e.id
             LEFT JOIN personal_data_sheets pds ON pds.user_id = e.user_id
             WHERE e.id = ?`,
            [empRow.id]
        );
        if (emp.length === 0) return res.status(404).json({ message: 'Employee record not found.' });

        const employeeData = { ...emp[0] };
        if (employeeData.pds_status === 'submitted') {
            if (employeeData.pds_first_name) employeeData.first_name = employeeData.pds_first_name;
            if (employeeData.pds_middle_name) employeeData.middle_name = employeeData.pds_middle_name;
            if (employeeData.pds_surname) employeeData.last_name = employeeData.pds_surname;
            if (employeeData.pds_name_extension) employeeData.name_extension = employeeData.pds_name_extension;
            if (employeeData.pds_date_of_birth) {
                try {
                    const dob = new Date(employeeData.pds_date_of_birth);
                    employeeData.date_of_birth = dob.toISOString().split('T')[0];
                } catch (e) {
                    employeeData.date_of_birth = employeeData.pds_date_of_birth;
                }
            }
            if (employeeData.pds_place_of_birth) employeeData.place_of_birth = employeeData.pds_place_of_birth;
            if (employeeData.pds_sex) employeeData.sex = employeeData.pds_sex;
            if (employeeData.pds_civil_status) employeeData.civil_status = employeeData.pds_civil_status;
            if (employeeData.pds_blood_type) employeeData.blood_type = employeeData.pds_blood_type;
            if (employeeData.pds_mobile_no) employeeData.mobile_no = employeeData.pds_mobile_no;
            if (employeeData.pds_email_address) employeeData.email = employeeData.pds_email_address;
            
            const parts = employeeData.pds_perm_same_as_residential
                ? [employeeData.pds_res_house_block_lot, employeeData.pds_res_street, employeeData.pds_res_barangay, employeeData.pds_res_city_municipality, employeeData.pds_res_province]
                : [employeeData.pds_perm_house_block_lot, employeeData.pds_perm_street, employeeData.pds_perm_barangay, employeeData.pds_perm_city_municipality, employeeData.pds_perm_province];
            const pdsAddress = parts.filter(Boolean).join(', ');
            if (pdsAddress) employeeData.address = pdsAddress;

            if (employeeData.pds_gsis_id_no) employeeData.gsis_id = employeeData.pds_gsis_id_no;
            if (employeeData.pds_pagibig_id_no) employeeData.pagibig_id = employeeData.pds_pagibig_id_no;
            if (employeeData.pds_philhealth_no) employeeData.philhealth_no = employeeData.pds_philhealth_no;
            if (employeeData.pds_tin_no) employeeData.tin_no = employeeData.pds_tin_no;
            if (employeeData.pds_photo_path) employeeData.photo_path = employeeData.photo_path || employeeData.pds_photo_path;
        }

        res.json(employeeData);
    } catch (error) {
        console.error('getMyProfile Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.uploadMyProfilePhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No image file provided.' });

        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });

        const photoPath = '/uploads/personnel/employees/' + req.file.filename;

        if (empRow.photo_path) {
            const oldFile = path.join(__dirname, '../../', empRow.photo_path);
            if (fs.existsSync(oldFile)) {
                try { fs.unlinkSync(oldFile); } catch {}
            }
        }

        await db.query('UPDATE employees SET photo_path = ? WHERE id = ?', [photoPath, empRow.id]);

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:employee:update');
        }

        res.json({ photo_path: photoPath, message: 'Profile photo updated.' });
    } catch (error) {
        console.error('uploadMyProfilePhoto Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllEmployees = async (req, res) => {
    try {
        const {
            page = 1, limit = 20, search,
            employment_type, employment_status, assigned_school, is_active,
            office, job_status, position_title, location, school_office_id,
            sort_by, sort_order, format
        } = req.query;
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
        if (office) { where.push('e.office LIKE ?'); params.push(`%${office}%`); }
        if (job_status) { where.push('e.job_status = ?'); params.push(job_status); }
        if (position_title) { where.push('e.position_title LIKE ?'); params.push(`%${position_title}%`); }
        if (school_office_id) { where.push('e.school_office_id = ?'); params.push(school_office_id); }
        else if (location) {
            where.push('(e.assigned_school LIKE ? OR e.office LIKE ?)');
            params.push(`%${location}%`, `%${location}%`);
        }

        const whereClause = where.join(' AND ');

        const sortColumns = {
            last_name: 'e.last_name',
            employee_no: 'e.employee_no',
            position_title: 'e.position_title',
            date_hired: 'COALESCE(e.date_hired, e.date_original_appointment)',
            years_of_service: 'COALESCE(e.date_hired, e.date_original_appointment)',
            job_status: 'e.job_status'
        };
        const sortCol = sortColumns[sort_by] || 'e.last_name';
        const sortDir = sort_order === 'DESC' ? 'DESC' : 'ASC';

        const select = `e.*, u.email as user_email,
            so.name as location_name, so.type as location_type, so.district as location_district,
            TIMESTAMPDIFF(MONTH, COALESCE(e.date_hired, e.date_original_appointment), CURDATE()) as months_of_service`;

        if (format === 'csv') {
            const [rows] = await db.query(
                `SELECT ${select} FROM employees e LEFT JOIN users u ON u.id = e.user_id LEFT JOIN schools_offices so ON so.id = e.school_office_id WHERE ${whereClause} ORDER BY ${sortCol} ${sortDir}`,
                params
            );
            const header = 'Employee No,Last Name,First Name,Middle Name,Position,School/Office,District,Category,Employment Status,Job Status,Eligibility,Years of Service,Date Hired,Email';
            const csvRows = rows.map(r => [
                csvEscape(r.employee_no),
                csvEscape(r.last_name),
                csvEscape(r.first_name),
                csvEscape(r.middle_name),
                csvEscape(r.position_title),
                csvEscape(r.location_name || r.assigned_school || r.office),
                csvEscape(r.location_district),
                csvEscape(r.employment_type),
                csvEscape(r.employment_status),
                csvEscape(r.job_status),
                csvEscape(r.eligibility),
                csvEscape(formatYearsOfService(r.months_of_service)),
                csvEscape(r.date_hired ? new Date(r.date_hired).toLocaleDateString() : ''),
                csvEscape(r.user_email)
            ].join(',')).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="employee_masterlist.csv"');
            return res.send(header + '\n' + csvRows);
        }

        const [count] = await db.query(`SELECT COUNT(*) as total FROM employees e WHERE ${whereClause}`, params);
        const [rows] = await db.query(
            `SELECT ${select}
             FROM employees e
             LEFT JOIN users u ON u.id = e.user_id
             LEFT JOIN schools_offices so ON so.id = e.school_office_id
             WHERE ${whereClause}
             ORDER BY ${sortCol} ${sortDir}
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({
            employees: rows.map(r => ({
                ...r,
                years_of_service: formatYearsOfService(r.months_of_service)
            })),
            total: count[0].total,
            page: parseInt(page),
            totalPages: Math.ceil(count[0].total / parseInt(limit))
        });
    } catch (error) {
        console.error('getAllEmployees Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getFilterOptions = async (req, res) => {
    try {
        const [locations] = await db.query(
            `SELECT id, name, type, district FROM schools_offices WHERE is_active = 1 ORDER BY type, district, name`
        );
        const [positions] = await db.query(
            `SELECT DISTINCT position_title as value FROM employees WHERE position_title IS NOT NULL AND is_active = 1 ORDER BY position_title`
        );
        res.json({
            locations: locations,
            positions: positions.map(r => r.value)
        });
    } catch (error) {
        console.error('getFilterOptions Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const [emp] = await db.query(
            `SELECT e.*, u.email as user_email, u.full_name as user_full_name,
                    lc.sick_leave_balance, lc.vacation_leave_balance,
                    lc.forced_leave_balance, lc.special_privilege_balance,
                    pds.status as pds_status,
                    pds.first_name as pds_first_name,
                    pds.middle_name as pds_middle_name,
                    pds.surname as pds_surname,
                    pds.name_extension as pds_name_extension,
                    pds.date_of_birth as pds_date_of_birth,
                    pds.place_of_birth as pds_place_of_birth,
                    pds.sex as pds_sex,
                    pds.civil_status as pds_civil_status,
                    pds.blood_type as pds_blood_type,
                    pds.mobile_no as pds_mobile_no,
                    pds.email_address as pds_email_address,
                    pds.gsis_id_no as pds_gsis_id_no,
                    pds.pagibig_id_no as pds_pagibig_id_no,
                    pds.philhealth_no as pds_philhealth_no,
                    pds.tin_no as pds_tin_no,
                    pds.photo_path as pds_photo_path,
                    pds.perm_same_as_residential as pds_perm_same_as_residential,
                    pds.res_house_block_lot as pds_res_house_block_lot,
                    pds.res_street as pds_res_street,
                    pds.res_subdivision_village as pds_res_subdivision_village,
                    pds.res_barangay as pds_res_barangay,
                    pds.res_city_municipality as pds_res_city_municipality,
                    pds.res_province as pds_res_province,
                    pds.perm_house_block_lot as pds_perm_house_block_lot,
                    pds.perm_street as pds_perm_street,
                    pds.perm_subdivision_village as pds_perm_subdivision_village,
                    pds.perm_barangay as pds_perm_barangay,
                    pds.perm_city_municipality as pds_perm_city_municipality,
                    pds.perm_province as pds_perm_province,
                    so.name as location_name, so.type as location_type, so.district as location_district
             FROM employees e
             LEFT JOIN users u ON u.id = e.user_id
             LEFT JOIN leave_credits lc ON lc.employee_id = e.id
             LEFT JOIN personal_data_sheets pds ON pds.user_id = e.user_id
             LEFT JOIN schools_offices so ON so.id = e.school_office_id
             WHERE e.id = ?`,
            [id]
        );
        if (emp.length === 0) return res.status(404).json({ message: 'Employee not found.' });

        const employeeData = { ...emp[0] };
        if (employeeData.pds_status === 'submitted') {
            if (employeeData.pds_first_name) employeeData.first_name = employeeData.pds_first_name;
            if (employeeData.pds_middle_name) employeeData.middle_name = employeeData.pds_middle_name;
            if (employeeData.pds_surname) employeeData.last_name = employeeData.pds_surname;
            if (employeeData.pds_name_extension) employeeData.name_extension = employeeData.pds_name_extension;
            if (employeeData.pds_date_of_birth) {
                try {
                    const dob = new Date(employeeData.pds_date_of_birth);
                    employeeData.date_of_birth = dob.toISOString().split('T')[0];
                } catch (e) {
                    employeeData.date_of_birth = employeeData.pds_date_of_birth;
                }
            }
            if (employeeData.pds_place_of_birth) employeeData.place_of_birth = employeeData.pds_place_of_birth;
            if (employeeData.pds_sex) employeeData.sex = employeeData.pds_sex;
            if (employeeData.pds_civil_status) employeeData.civil_status = employeeData.pds_civil_status;
            if (employeeData.pds_blood_type) employeeData.blood_type = employeeData.pds_blood_type;
            if (employeeData.pds_mobile_no) employeeData.mobile_no = employeeData.pds_mobile_no;
            if (employeeData.pds_email_address) employeeData.email = employeeData.pds_email_address;
            
            const parts = employeeData.pds_perm_same_as_residential
                ? [employeeData.pds_res_house_block_lot, employeeData.pds_res_street, employeeData.pds_res_barangay, employeeData.pds_res_city_municipality, employeeData.pds_res_province]
                : [employeeData.pds_perm_house_block_lot, employeeData.pds_perm_street, employeeData.pds_perm_barangay, employeeData.pds_perm_city_municipality, employeeData.pds_perm_province];
            const pdsAddress = parts.filter(Boolean).join(', ');
            if (pdsAddress) employeeData.address = pdsAddress;

            if (employeeData.pds_gsis_id_no) employeeData.gsis_id = employeeData.pds_gsis_id_no;
            if (employeeData.pds_pagibig_id_no) employeeData.pagibig_id = employeeData.pds_pagibig_id_no;
            if (employeeData.pds_philhealth_no) employeeData.philhealth_no = employeeData.pds_philhealth_no;
            if (employeeData.pds_tin_no) employeeData.tin_no = employeeData.pds_tin_no;
            if (employeeData.pds_photo_path) employeeData.photo_path = employeeData.photo_path || employeeData.pds_photo_path;
        }

        res.json(employeeData);
    } catch (error) {
        console.error('getEmployeeById Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createEmployee = async (req, res) => {
    try {
        const { user_id, employee_no, first_name, middle_name, last_name, name_extension,
                date_of_birth, place_of_birth, sex, civil_status, blood_type,
                gsis_id, pagibig_id, philhealth_no, tin_no, mobile_no, email, address,
                employment_status, employment_type, position_title, salary_grade,
                monthly_salary, item_number, assigned_school, date_hired, date_original_appointment,
                authorized_salary, actual_salary, salary_step, eligibility, office, job_status,
                school_office_id } = req.body;

        if (!user_id || !first_name || !last_name) {
            return res.status(400).json({ message: 'user_id, first_name, and last_name are required.' });
        }

        if (!employee_no || !employee_no.trim()) {
            return res.status(400).json({ message: 'Employee No. is required.' });
        }

        const trimmedEmployeeNo = employee_no.trim();

        const [existing] = await db.query(
            'SELECT id FROM employees WHERE employee_no = ?',
            [trimmedEmployeeNo]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: `Employee No. "${trimmedEmployeeNo}" already exists. Please use a unique number.` });
        }

        const validTypes = ['teaching', 'non_teaching', 'teaching_related'];
        const category = employment_type || 'teaching';
        if (!validTypes.includes(category)) {
            return res.status(400).json({ message: 'Invalid employment_type. Must be teaching, non_teaching, or teaching_related.' });
        }

        if (salary_step !== undefined && salary_step !== '' && salary_step !== null) {
            const step = parseInt(salary_step, 10);
            if (isNaN(step) || step < 1 || step > 8) {
                return res.status(400).json({ message: 'salary_step must be between 1 and 8.' });
            }
        }

        const validJobStatuses = ['active', 'on_leave', 'suspended', 'resigned', 'retired', 'terminated'];
        if (job_status && !validJobStatuses.includes(job_status)) {
            return res.status(400).json({ message: 'Invalid job_status.' });
        }

        const photoPath = req.file ? '/uploads/personnel/employees/' + req.file.filename : null;

        let resolvedSchool = assigned_school || null;
        let resolvedOffice = office || null;
        let resolvedSchoolOfficeId = school_office_id || null;
        if (school_office_id) {
            const [soRows] = await db.query('SELECT id, name, type FROM schools_offices WHERE id = ?', [school_office_id]);
            if (soRows.length > 0) {
                const so = soRows[0];
                resolvedSchoolOfficeId = so.id;
                if (so.type === 'school') { resolvedSchool = so.name; resolvedOffice = null; }
                else { resolvedOffice = so.name; resolvedSchool = null; }
            }
        }

        const [result] = await db.query(
            `INSERT INTO employees (user_id, employee_no, first_name, middle_name, last_name, name_extension,
             date_of_birth, place_of_birth, sex, civil_status, blood_type,
             gsis_id, pagibig_id, philhealth_no, tin_no, mobile_no, email, address,
             photo_path,
             employment_status, employment_type, position_title, salary_grade,
             authorized_salary, actual_salary, monthly_salary, salary_step,
             eligibility, item_number, assigned_school, office, job_status,
             school_office_id,
             date_hired, date_original_appointment)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [user_id, trimmedEmployeeNo, first_name, middle_name || null, last_name, name_extension || null,
             date_of_birth || null, place_of_birth || null, sex || null, civil_status || null, blood_type || null,
             gsis_id || null, pagibig_id || null, philhealth_no || null, tin_no || null, mobile_no || null, email || null, address || null,
             photoPath,
             employment_status || 'permanent', category, position_title || null, salary_grade || null,
             authorized_salary || null, actual_salary || null, monthly_salary || null, salary_step || null,
             eligibility || null, item_number || null, resolvedSchool, resolvedOffice, job_status || 'active',
             resolvedSchoolOfficeId,
             date_hired || null, date_original_appointment || null]
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
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:employee:update');
        }

        res.status(201).json({ message: 'Employee created successfully.', id: result.insertId, employee_no: trimmedEmployeeNo });
    } catch (error) {
        console.error('createEmployee Error:', error);
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
            'monthly_salary', 'authorized_salary', 'actual_salary', 'salary_step',
            'eligibility', 'item_number', 'assigned_school', 'office', 'job_status',
            'school_office_id',
            'date_hired', 'date_original_appointment'
        ];
        const payload = {};
        allowed.forEach(f => {
            if (req.body[f] !== undefined) payload[f] = req.body[f];
        });

        if (payload.school_office_id) {
            const [soRows] = await db.query('SELECT id, name, type FROM schools_offices WHERE id = ?', [payload.school_office_id]);
            if (soRows.length > 0) {
                const so = soRows[0];
                if (so.type === 'school') { payload.assigned_school = so.name; payload.office = null; }
                else { payload.office = so.name; payload.assigned_school = null; }
            }
        }

        if (payload.salary_step !== undefined && payload.salary_step !== '' && payload.salary_step !== null) {
            const step = parseInt(payload.salary_step, 10);
            if (isNaN(step) || step < 1 || step > 8) {
                return res.status(400).json({ message: 'salary_step must be between 1 and 8.' });
            }
        }

        if (payload.job_status) {
            const validJobStatuses = ['active', 'on_leave', 'suspended', 'resigned', 'retired', 'terminated'];
            if (!validJobStatuses.includes(payload.job_status)) {
                return res.status(400).json({ message: 'Invalid job_status.' });
            }
        }

        if (req.file) {
            payload.photo_path = '/uploads/personnel/employees/' + req.file.filename;
        }

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update.' });
        }

        await db.query('UPDATE employees SET ? WHERE id = ?', [payload, id]);

        await db.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, id, 'employee_updated', `Updated employee #${id}`]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:employee:update');
        }

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
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:employee:update');
        }
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
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:employee:update');
        }
        res.json({ message: 'Employee restored.' });
    } catch (error) {
        console.error('restoreEmployee Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── Profile Change Requests (Employee → Admin approval) ──────────

const PROFILE_EDITABLE_FIELDS = [
    'first_name', 'middle_name', 'last_name', 'name_extension',
    'date_of_birth', 'place_of_birth', 'sex', 'civil_status', 'blood_type',
    'mobile_no', 'email',
    'gsis_id', 'pagibig_id', 'philhealth_no', 'tin_no'
];

exports.submitChangeRequest = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });

        const { changes, reason } = req.body;
        if (!changes || typeof changes !== 'object' || Object.keys(changes).length === 0) {
            return res.status(400).json({ message: 'No changes provided.' });
        }

        const invalidFields = Object.keys(changes).filter(f => !PROFILE_EDITABLE_FIELDS.includes(f));
        if (invalidFields.length > 0) {
            return res.status(400).json({ message: `Cannot request changes to: ${invalidFields.join(', ')}` });
        }

        const [pending] = await db.query(
            "SELECT id FROM employee_profile_change_requests WHERE employee_id = ? AND status = 'pending' LIMIT 1",
            [empRow.id]
        );
        if (pending.length > 0) {
            return res.status(409).json({ message: 'You already have a pending change request. Please wait for it to be reviewed or withdraw it first.' });
        }

        const [emp] = await db.query('SELECT * FROM employees WHERE id = ?', [empRow.id]);
        const current = emp[0];

        const changesJson = {};
        for (const [field, rawValue] of Object.entries(changes)) {
            const newValue = (rawValue && typeof rawValue === 'object' && 'new' in rawValue) ? rawValue.new : rawValue;
            const oldVal = current[field] != null ? String(current[field]) : null;
            const newVal = newValue != null ? String(newValue) : null;
            if (oldVal !== newVal) {
                changesJson[field] = { old: oldVal, new: newVal };
            }
        }

        if (Object.keys(changesJson).length === 0) {
            return res.status(400).json({ message: 'No actual changes detected.' });
        }

        const [result] = await db.query(
            'INSERT INTO employee_profile_change_requests (employee_id, user_id, changes_json, reason) VALUES (?, ?, ?, ?)',
            [empRow.id, req.user.id, JSON.stringify(changesJson), reason || null]
        );

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:profile-change:update');
        }

        res.status(201).json({ message: 'Change request submitted for HR review.', requestId: result.insertId });
    } catch (error) {
        console.error('submitChangeRequest Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMyChangeRequests = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });

        const [rows] = await db.query(
            `SELECT r.*, u.full_name as reviewed_by_name
             FROM employee_profile_change_requests r
             LEFT JOIN users u ON u.id = r.reviewed_by
             WHERE r.employee_id = ?
             ORDER BY r.created_at DESC LIMIT 20`,
            [empRow.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('getMyChangeRequests Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.revokeChangeRequest = async (req, res) => {
    try {
        const empRow = await findOrCreateEmployee(req.user.id);
        if (!empRow) return res.status(404).json({ message: 'Employee record not found.' });

        const { id } = req.params;
        const [existing] = await db.query(
            "SELECT id FROM employee_profile_change_requests WHERE id = ? AND employee_id = ? AND status = 'pending'",
            [id, empRow.id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Pending request not found.' });
        }

        await db.query("UPDATE employee_profile_change_requests SET status = 'rejected', review_notes = 'Revoked by employee' WHERE id = ?", [id]);
        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:profile-change:update');
        }
        res.json({ message: 'Request withdrawn.' });
    } catch (error) {
        console.error('revokeChangeRequest Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getPendingChangeRequests = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? "r.status = ?" : "1=1";
        const params = status ? [status] : [];

        const [rows] = await db.query(
            `SELECT r.*, e.first_name, e.last_name, e.employee_no, e.position_title,
                    u.full_name as submitted_by_name
             FROM employee_profile_change_requests r
             JOIN employees e ON e.id = r.employee_id
             JOIN users u ON u.id = r.user_id
             WHERE ${filter}
             ORDER BY FIELD(r.status, 'pending', 'approved', 'rejected'), r.created_at DESC
             LIMIT 100`,
            params
        );
        res.json(rows);
    } catch (error) {
        console.error('getPendingChangeRequests Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// mysql2 v3.22.5: connection.beginTransaction() / commit() / rollback() return Promises
// natively on PromisePoolConnection and do NOT invoke an err-first callback — do NOT wrap
// these in `new Promise((resolve, reject) => conn.beginTransaction(cb))`, the callback is
// never called and the outer Promise hangs forever (leaks the connection, hangs the request
// with no response, causes the admin "Approve" modal to be stuck on "Processing..." forever).
exports.reviewChangeRequest = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { id } = req.params;
        const { action, review_notes } = req.body;

        if (!['approved', 'rejected'].includes(action)) {
            await conn.rollback();
            return res.status(400).json({ message: 'Action must be "approved" or "rejected".' });
        }

        const [rows] = await conn.query(
            "SELECT * FROM employee_profile_change_requests WHERE id = ? AND status = 'pending' FOR UPDATE",
            [id]
        );
        if (rows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Pending request not found.' });
        }

        const request = rows[0];
        const changes = typeof request.changes_json === 'string' ? JSON.parse(request.changes_json) : request.changes_json;

        if (action === 'approved') {
            // 1. Update employees table (the authoritative record)
            const setClauses = [];
            const values = [];
            for (const [field, diff] of Object.entries(changes)) {
                setClauses.push(`${field} = ?`);
                values.push(diff.new);
            }
            values.push(request.employee_id);
            await conn.query(`UPDATE employees SET ${setClauses.join(', ')} WHERE id = ?`, values);

            // 2. Sync the same changes into personal_data_sheets (if one exists in 'submitted'
            //    status for this user). Without this, getMyProfile / getEmployeeById will
            //    silently override the employees values with the stale PDS values on every read,
            //    making the approval appear to have had no effect in the UI.
            //
            // employees column  →  personal_data_sheets column
            const EMP_TO_PDS_COL = {
                first_name:    'first_name',
                middle_name:   'middle_name',
                last_name:     'surname',        // PDS uses "surname"
                name_extension:'name_extension',
                date_of_birth: 'date_of_birth',
                sex:           'sex',
                civil_status:  'civil_status',
                mobile_no:     'mobile_no',
                gsis_id:       'gsis_id_no',     // PDS uses "gsis_id_no"
                pagibig_id:    'pagibig_id_no',  // PDS uses "pagibig_id_no"
                philhealth_no: 'philhealth_no',
                tin_no:        'tin_no',
            };

            // Look up the employee's user_id to find the PDS row
            const [[empForPds]] = await conn.query(
                'SELECT user_id FROM employees WHERE id = ? LIMIT 1',
                [request.employee_id]
            );

            if (empForPds) {
                const [pdsRows] = await conn.query(
                    "SELECT id FROM personal_data_sheets WHERE user_id = ? AND status = 'submitted' LIMIT 1",
                    [empForPds.user_id]
                );
                if (pdsRows.length > 0) {
                    const pdsClauses = [];
                    const pdsValues  = [];
                    for (const [empField, diff] of Object.entries(changes)) {
                        const pdsCol = EMP_TO_PDS_COL[empField];
                        if (pdsCol) {
                            pdsClauses.push(`${pdsCol} = ?`);
                            pdsValues.push(diff.new);
                        }
                    }
                    if (pdsClauses.length > 0) {
                        pdsValues.push(pdsRows[0].id);
                        await conn.query(
                            `UPDATE personal_data_sheets SET ${pdsClauses.join(', ')} WHERE id = ?`,
                            pdsValues
                        );
                    }
                }
            }
        }

        await conn.query(
            'UPDATE employee_profile_change_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ? WHERE id = ?',
            [action, req.user.id, review_notes || null, id]
        );

        await conn.query(
            'INSERT INTO personnel_activity_log (actor_id, employee_id, action_type, description) VALUES (?, ?, ?, ?)',
            [req.user.id, request.employee_id, `profile_change_${action}`, `${action} profile change request #${id}`]
        );

        const notificationMsg = action === 'approved'
            ? `Your profile change request has been approved. Your information has been updated.`
            : `Your profile change request was ${action}${review_notes ? ': ' + review_notes : ''}.`;

        await conn.query(
            'INSERT INTO personnel_notifications (employee_id, type, reference_id, message) VALUES (?, ?, ?, ?)',
            [request.employee_id, 'general', id, notificationMsg]
        );

        await conn.commit();

        const io = req.app.get('socketio');
        if (io) {
            io.emit('personnel:update');
            io.emit('personnel:profile-change:update');
            io.emit('personnel:employee:update');
            io.emit('personnel:notification:update');
        }

        res.json({ message: `Request ${action}.` });
    } catch (error) {
        try { await conn.rollback(); } catch {}
        console.error('reviewChangeRequest Error:', error);
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};
