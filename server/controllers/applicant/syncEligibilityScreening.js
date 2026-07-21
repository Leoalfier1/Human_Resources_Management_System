const db = require('../../db');

function computeAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
}

function buildAddress(pds) {
    if (!pds) return '';
    const parts = [
        pds.res_house_block_lot,
        pds.res_street,
        pds.res_subdivision_village,
        pds.res_barangay,
        pds.res_city_municipality,
        pds.res_province,
        pds.res_zip_code
    ];
    return parts.filter(Boolean).join(', ');
}

function safeParseJSON(field) {
    if (!field) return null;
    if (typeof field === 'string') {
        try { return JSON.parse(field); } catch { return null; }
    }
    return field;
}

function getHighestEducation(pds) {
    if (!pds) return '';
    try {
        const graduate = safeParseJSON(pds.graduate_studies);
        if (Array.isArray(graduate) && graduate.length > 0) {
            const entry = graduate.find(e => e.degree_course) || graduate[0];
            if (entry.degree_course) return entry.degree_course;
        }

        const college = safeParseJSON(pds.college);
        if (Array.isArray(college) && college.length > 0) {
            const entry = college.find(e => e.degree_course) || college[0];
            if (entry.degree_course) return entry.degree_course;
        }

        const vocational = safeParseJSON(pds.vocational);
        if (Array.isArray(vocational) && vocational.length > 0) {
            const entry = vocational.find(e => e.degree_course) || vocational[0];
            if (entry.degree_course) return `Vocational - ${entry.degree_course}`;
        }

        const secondary = safeParseJSON(pds.secondary);
        if (secondary && secondary.school_name) {
            return `High School - ${secondary.school_name}`;
        }

        const elementary = safeParseJSON(pds.elementary);
        if (elementary && elementary.school_name) {
            return `Elementary - ${elementary.school_name}`;
        }
    } catch (e) {
    }
    return '';
}

function getTopEligibility(pds) {
    if (!pds) return '';
    try {
        const eligibility = safeParseJSON(pds.civil_service_eligibility);
        if (Array.isArray(eligibility) && eligibility.length > 0) {
            const entry = eligibility.find(e => e.eligibility_name) || eligibility[0];
            return entry.eligibility_name || '';
        }
    } catch (e) {
    }
    return '';
}

function getTopTraining(pds) {
    if (!pds) return { title: '', hours: null };
    try {
        const training = safeParseJSON(pds.ld_training);
        if (Array.isArray(training) && training.length > 0) {
            const entry = training.find(e => e.title) || training[0];
            return {
                title: entry.title || '',
                hours: entry.num_hours ? parseFloat(entry.num_hours) : null
            };
        }
    } catch (e) {
    }
    return { title: '', hours: null };
}

function getExperienceDetails(pds) {
    if (!pds) return '';
    try {
        const work = safeParseJSON(pds.work_experience);
        if (Array.isArray(work) && work.length > 0) {
            return work.map(w => {
                const parts = [];
                if (w.position_title) parts.push(w.position_title);
                if (w.company_agency) parts.push(w.company_agency);
                if (w.date_from) parts.push(`${w.date_from} - ${w.date_to || 'Present'}`);
                return parts.join(' at ');
            }).join('; ');
        }
    } catch (e) {
    }
    return '';
}

async function syncEligibilityScreeningRow(applicationId) {
    try {
        const [rows] = await db.query(`
            SELECT 
                a.id,
                a.vacancy_id,
                a.applicant_id,
                a.full_name,
                a.email,
                a.phone,
                a.years_experience,
                a.ref_no,
                pds.date_of_birth,
                pds.sex,
                pds.civil_status,
                pds.religion,
                pds.disability,
                pds.ethnic_group,
                pds.res_house_block_lot,
                pds.res_street,
                pds.res_subdivision_village,
                pds.res_barangay,
                pds.res_city_municipality,
                pds.res_province,
                pds.res_zip_code,
                pds.civil_service_eligibility,
                pds.work_experience,
                pds.ld_training,
                pds.elementary,
                pds.secondary,
                pds.vocational,
                pds.college,
                pds.graduate_studies
            FROM applications a
            LEFT JOIN personal_data_sheets pds ON pds.user_id = a.applicant_id
            WHERE a.id = ?
        `, [applicationId]);

        if (rows.length === 0) return;

        const app = rows[0];

        const age = computeAge(app.date_of_birth);
        const address = buildAddress(app);
        const education = getHighestEducation(app);
        const eligibility = getTopEligibility(app);
        const training = getTopTraining(app);
        const experienceDetails = getExperienceDetails(app);

        await db.query(`
            INSERT INTO applicant_eligibility_screening 
                (application_id, application_code, applicant_name, address, age, sex, civil_status,
                 religion, disability, ethnic_group,
                 email, contact_no, education, training_title, training_hours, experience_years, experience_details,
                 eligibility, vacancy_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                application_code = VALUES(application_code),
                applicant_name = VALUES(applicant_name),
                address = VALUES(address),
                age = VALUES(age),
                sex = VALUES(sex),
                civil_status = VALUES(civil_status),
                religion = VALUES(religion),
                disability = VALUES(disability),
                ethnic_group = VALUES(ethnic_group),
                email = VALUES(email),
                contact_no = VALUES(contact_no),
                education = VALUES(education),
                training_title = VALUES(training_title),
                training_hours = VALUES(training_hours),
                experience_years = VALUES(experience_years),
                experience_details = VALUES(experience_details),
                eligibility = VALUES(eligibility),
                vacancy_id = VALUES(vacancy_id)
        `, [
            applicationId,
            app.ref_no,
            app.full_name,
            address,
            age,
            app.sex || null,
            app.civil_status || null,
            app.religion || null,
            app.disability || null,
            app.ethnic_group || null,
            app.email,
            app.phone,
            education,
            training.title,
            training.hours,
            app.years_experience || 0,
            experienceDetails,
            eligibility,
            app.vacancy_id
        ]);
    } catch (error) {
        console.error('syncEligibilityScreeningRow Error:', error);
    }
}

module.exports = { syncEligibilityScreeningRow };
