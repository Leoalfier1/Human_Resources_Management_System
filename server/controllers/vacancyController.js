const db = require('../../db');

// 1. GET ALL VACANCIES
exports.getVacancies = async (req, res) => {
    try {
        const query = `
            SELECT v.*, 
            (SELECT COUNT(*) FROM applicants WHERE vacancy_id = v.id) as applicant_count
            FROM vacancies v 
            ORDER BY v.posting_date DESC`;
            
        const [rows] = await db.query(query);
        
        const processed = rows.map(v => {
            const deadline = new Date(v.deadline_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const diffTime = deadline - today;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
                ...v,
                days_left: daysLeft,
                computed_status: (daysLeft < 0 || v.status === 'closed') ? 'closed' : 'active'
            };
        });
        
        res.json(processed);
    } catch (error) {
        console.error("❌ FETCH VACANCIES ERROR:", error);
        res.status(500).json({ message: "Failed to load vacancies." });
    }
};

// 2. CREATE NEW VACANCY
exports.createVacancy = async (req, res) => {
    try {
        const { 
            position_title, item_number, salary_grade, assigned_school, 
            minimum_qualifications, no_of_vacancies, posting_date,
            publish_division_website, publish_facebook, publish_bulletin 
        } = req.body;

        // --- STEP 1: VALIDATION ---
        if (!position_title || !assigned_school || !posting_date || !item_number) {
            return res.status(400).json({ message: "All required fields (*) must be filled." });
        }

        // Handle stringified booleans from FormData (Multer parses these as strings)
        const pubWeb = publish_division_website === 'true' || publish_division_website === true;
        const pubFB = publish_facebook === 'true' || publish_facebook === true;
        const pubBul = publish_bulletin === 'true' || publish_bulletin === true;

        if (!pubWeb && !pubFB && !pubBul) {
            return res.status(400).json({ message: "Select at least one publishing channel." });
        }

        // --- STEP 2: AUTO-GENERATE REF NO (V-YYYY-001) ---
        const year = new Date().getFullYear();
        const [rows] = await db.query(
            `SELECT ref_no FROM vacancies WHERE ref_no LIKE ? ORDER BY id DESC LIMIT 1`, 
            [`V-${year}-%`]
        );
        
        let nextNum = "001";
        if (rows.length > 0) {
            const lastRef = rows[0].ref_no;
            const lastParts = lastRef.split('-');
            if (lastParts.length === 3) {
                const lastNum = parseInt(lastParts[2]);
                nextNum = String(lastNum + 1).padStart(3, '0');
            }
        }
        const generatedRefNo = `V-${year}-${nextNum}`;

        // --- STEP 3: AUTO-CALCULATE DEADLINE (+10 Days) ---
        const deadline = new Date(posting_date);
        deadline.setDate(deadline.getDate() + 10);

        // Format file path for web (replace backslashes with forward slashes)
        let filePathsString = null;
        if (req.files && req.files.length > 0) {
            const paths = req.files.map(file => file.path.replace(/\\/g, '/'));
            filePathsString = JSON.stringify(paths); // Or paths.join(',') depending on your DB column size
        } else if (req.file) {
            // Fallback if a single file is sent
            filePathsString = req.file.path.replace(/\\/g, '/');
        }

        // --- STEP 4: DATABASE INSERT ---
        // Ensure these columns exist in your MySQL table!
        const [result] = await db.query(
            `INSERT INTO vacancies (
                ref_no, position_title, item_number, salary_grade, 
                assigned_school, minimum_qualifications, no_of_vacancies, 
                posting_date, deadline_date, division_memo_file_path, 
                publish_division_website, publish_facebook, publish_bulletin, 
                created_by, current_stage, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')`,
            [
                generatedRefNo, position_title, item_number, salary_grade, 
                assigned_school, minimum_qualifications, no_of_vacancies || 1, 
                posting_date, deadline, filePath, 
                pubWeb, pubFB, pubBul, 
                req.user.id 
            ]
        );

        // --- STEP 5: LOG ACTIVITY & NOTIFY DASHBOARD ---
        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`, 
            [result.insertId, req.user.id, `New vacancy posted: ${position_title} (${generatedRefNo})`]
        );
        
        // Trigger real-time update
        const io = req.app.get('socketio');
        if (io) {
            io.emit('rsp:dashboard:update');
        }

        res.status(201).json({ 
            message: "Vacancy posted successfully", 
            ref_no: generatedRefNo 
        });

    } catch (error) {
        // Look at your VS Code Terminal when this happens!
        console.error("❌ DATABASE SAVE ERROR:", error);
        res.status(500).json({ 
            message: "Server error: Could not save vacancy.",
            details: error.message // Sending this to help you debug
        });
    }
};