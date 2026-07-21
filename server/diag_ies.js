require('dotenv').config();
const db = require('./db');

(async () => {
    try {
        // Check all vacancies and their position_type
        const [vacancies] = await db.query(`
            SELECT id, ref_no, position_title, position_type, salary_grade, assigned_school
            FROM vacancies WHERE is_deleted = 0
            ORDER BY position_type, id
        `);
        console.log(`\n=== ALL active vacancies: ${vacancies.length} ===`);
        for (const v of vacancies) {
            console.log(`  vac#${v.id} "${v.position_title}" type=${v.position_type} sg=${v.salary_grade} ref=${v.ref_no}`);
        }

        // Check what the bracket resolver would produce for each vacancy
        const resolveIesCategoryAndBracket = ({ position_type, position_title, salary_grade }) => {
            const positionType = position_type || 'teaching';
            const parsed = salary_grade === null || salary_grade === undefined ? null : Number(String(salary_grade).replace(/^SG-/i, '').trim());
            const sg = Number.isInteger(parsed) ? parsed : null;

            const isTeacherI = (t) => /\bteacher\s*(i|1)\b/.test(String(t).trim().toLowerCase()) && !/\b(master|head|principal|supervisor)\b/.test(String(t).trim().toLowerCase());

            if (positionType === 'teaching') {
                if (!isTeacherI(position_title)) {
                    return { positionCategory: 'teacher_i', bracketKey: null };
                }
                return { positionCategory: 'teacher_i', bracketKey: null };
            }

            if (positionType === 'non_teaching') {
                if (!Number.isInteger(sg)) return { positionCategory: 'non_teaching', bracketKey: 'SG_10_22_27' };
                const isGS = ['general services', 'utility worker', 'security guard', 'driver', 'administrative aide', 'clerk', 'messenger', 'janitor'].some(kw => String(position_title).trim().toLowerCase().includes(kw));
                if (isGS) return { positionCategory: 'non_teaching', bracketKey: 'GENERAL_SERVICES' };
                if (sg >= 1 && sg <= 9) return { positionCategory: 'non_teaching', bracketKey: 'SG_1_9_NON_GS' };
                if ((sg >= 10 && sg <= 22) || sg === 27) return { positionCategory: 'non_teaching', bracketKey: 'SG_10_22_27' };
                if (sg === 24) return { positionCategory: 'non_teaching', bracketKey: 'SG_24_CHIEF' };
            }

            if (positionType === 'teaching_related') {
                if (!Number.isInteger(sg)) return { positionCategory: 'teaching_related', bracketKey: 'SG_16_23_27' };
                if (sg >= 11 && sg <= 15) return { positionCategory: 'teaching_related', bracketKey: 'SG_11_15' };
                if ((sg >= 16 && sg <= 23) || sg === 27) return { positionCategory: 'teaching_related', bracketKey: 'SG_16_23_27' };
                if (sg === 24) return { positionCategory: 'teaching_related', bracketKey: 'SG_24_CHIEF' };
            }

            return { positionCategory: positionType, bracketKey: null };
        };

        console.log(`\n=== Bracket resolution for each vacancy ===`);
        for (const v of vacancies) {
            const result = resolveIesCategoryAndBracket(v);
            console.log(`  vac#${v.id} "${v.position_title}" (type=${v.position_type}, sg=${v.salary_grade}) => cat=${result.positionCategory} bracket=${result.bracketKey}`);
        }

        // Check all applications and their vacancy types
        const [apps] = await db.query(`
            SELECT a.id, a.full_name, a.ref_no, a.status,
                   v.position_title, v.position_type, v.salary_grade
            FROM applications a
            JOIN vacancies v ON a.vacancy_id = v.id
            WHERE a.status != 'draft'
            ORDER BY v.position_type, a.id
        `);
        console.log(`\n=== ALL non-draft applications: ${apps.length} ===`);
        for (const a of apps) {
            const result = resolveIesCategoryAndBracket(a);
            console.log(`  app#${a.id} "${a.full_name}" => pos="${a.position_title}" type=${a.position_type} sg=${a.salary_grade} => cat=${result.positionCategory} bracket=${result.bracketKey}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
})();
