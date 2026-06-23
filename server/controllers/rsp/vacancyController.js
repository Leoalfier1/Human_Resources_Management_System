const db = require('../../db');

// 1. GET ALL VACANCIES (with applicant counts)
const getVacancies = async (req, res) => {
    try {
        const query = `
            SELECT v.*, 
            (SELECT COUNT(*) FROM applicants WHERE vacancy_id = v.id) as applicant_count
            FROM vacancies v 
            ORDER BY v.posting_date DESC`;
            
        const [rows] = await db.query(query);
        
        // Process data for frontend (calculating days left and status)
        const processed = rows.map(v => {
            const deadline = new Date(v.deadline_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time for accurate day counting
            
            const diffTime = deadline - today;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
                ...v,
                days_left: daysLeft,
                // A vacancy is closed if it's explicitly 'closed' OR the deadline has passed
                computed_status: (daysLeft < 0 || v.status === 'closed') ? 'closed' : 'active'
            };
        });
        
        res.json(processed);
    } catch (error) {
        console.error("Fetch Vacancies Error:", error);
        res.status(500).json({ message: "Failed to load vacancies." });
    }
};

// 2. CREATE NEW VACANCY
const createVacancy = async (req, res) => {
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

        // Handle stringified booleans from FormData
        const pubWeb = publish_division_website === 'true';
        const pubFB = publish_facebook === 'true';
        const pubBul = publish_bulletin === 'true';

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
            // Extract the number from "V-2025-001" -> 1, then increment
            const lastNum = parseInt(rows[0].ref_no.split('-')[2]);
            nextNum = String(lastNum + 1).padStart(3, '0');
        }
        const generatedRefNo = `V-${year}-${nextNum}`;

        // --- STEP 3: AUTO-CALCULATE DEADLINE (+10 Days) ---
        const deadline = new Date(posting_date);
        deadline.setDate(deadline.getDate() + 10);

        // Get file path from Multer (if uploaded)
        const filePath = req.file ? req.file.path : null;

        // --- STEP 4: DATABASE INSERT ---
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
                req.user.id // From verifyToken middleware
            ]
        );

        // --- STEP 5: LOG ACTIVITY & NOTIFY DASHBOARD ---
        // Add to recent activity log
        await db.query(
            `INSERT INTO activity_log (vacancy_id, actor_id, action_description) VALUES (?, ?, ?)`, 
            [result.insertId, req.user.id, `New vacancy posted: ${position_title} (${generatedRefNo})`]
        );
        
        // Trigger real-time update on dashboard via Socket.io
        if (req.app.get('socketio')) {
            req.app.get('socketio').emit('rsp:dashboard:update');
        }

        res.status(201).json({ 
            message: "Vacancy posted successfully", 
            ref_no: generatedRefNo 
        });

    } catch (error) {
        console.error("Create Vacancy Error:", error);
        res.status(500).json({ message: "Server error: Could not save vacancy." });
    }
};

module.exports = { getVacancies, createVacancy };