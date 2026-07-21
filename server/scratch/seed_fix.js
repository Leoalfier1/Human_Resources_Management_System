const db = require('../db');

async function main() {
    try {
        // 1. Seed signatory: Dr. Felix Romy A. Triambulo, CESO V
        const [existing] = await db.query(
            "SELECT id FROM signatories WHERE full_name LIKE '%Triambulo%'"
        );
        if (existing.length === 0) {
            const [result] = await db.query(
                `INSERT INTO signatories (full_name, position, designation, is_active)
                 VALUES (?, ?, ?, 1)`,
                [
                    'Dr. Felix Romy A. Triambulo, CESO V',
                    'Schools Division Superintendent',
                    'Schools Division Office of Dapitan City'
                ]
            );
            console.log('✅ Signatory seeded, id:', result.insertId);
        } else {
            console.log('✅ Signatory already exists, id:', existing[0].id);
        }

        // 2. Update vacancy 3: fix assigned_school from TR001 to a real school name
        // TR001 = placeholder; "Dapitan City Central School" is the most appropriate for a School Head position
        // and is the first school in the schools_offices table.
        // Update ONLY if still the placeholder
        const [vac] = await db.query("SELECT assigned_school, item_number FROM vacancies WHERE id = 3");
        console.log('Current vacancy 3:', vac[0]);

        if (vac[0].assigned_school === 'TR001') {
            await db.query(
                "UPDATE vacancies SET assigned_school = 'Dapitan City Central School' WHERE id = 3 AND assigned_school = 'TR001'"
            );
            console.log('✅ Vacancy 3 assigned_school updated: TR001 → Dapitan City Central School');
        } else {
            console.log('ℹ️ Vacancy 3 assigned_school is already:', vac[0].assigned_school);
        }

        if (vac[0].item_number === 'ITEM-001') {
            // Update to a realistic DepEd item number format
            await db.query(
                "UPDATE vacancies SET item_number = 'OSEC-DECSB-SH1-540001-2023' WHERE id = 3 AND item_number = 'ITEM-001'"
            );
            console.log('✅ Vacancy 3 item_number updated: ITEM-001 → OSEC-DECSB-SH1-540001-2023');
        } else {
            console.log('ℹ️ Vacancy 3 item_number is already:', vac[0].item_number);
        }

        // 3. Update the congratulatory_advices place_of_assignment from TR001 too
        const [ca] = await db.query(
            "SELECT id, place_of_assignment FROM congratulatory_advices WHERE applicant_id = 5"
        );
        if (ca.length > 0 && ca[0].place_of_assignment === 'TR001') {
            await db.query(
                "UPDATE congratulatory_advices SET place_of_assignment = 'Dapitan City Central School' WHERE applicant_id = 5 AND place_of_assignment = 'TR001'"
            );
            console.log('✅ congratulatory_advices place_of_assignment updated: TR001 → Dapitan City Central School');
        } else {
            console.log('ℹ️ congratulatory_advices place_of_assignment:', ca[0]?.place_of_assignment);
        }

        // 4. Verify results
        const [v2] = await db.query("SELECT ref_no, position_title, item_number, assigned_school FROM vacancies WHERE id = 3");
        console.log('\n✅ Final vacancy state:', v2[0]);
        const [s2] = await db.query("SELECT * FROM signatories");
        console.log('✅ Final signatories:', s2);

        process.exit(0);
    } catch (e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
}
main();
