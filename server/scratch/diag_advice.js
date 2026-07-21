const db = require('../db');

async function main() {
    try {
        // Check all schools_offices
        const [schools] = await db.query("SELECT * FROM schools_offices ORDER BY id");
        console.log("ALL SCHOOLS_OFFICES:");
        schools.forEach(s => console.log(`  id=${s.id} | name="${s.name}"`));

        // Check employees with Superintendent role
        const [emp] = await db.query(
            "SELECT id, first_name, last_name, middle_name, name_extension, position_title FROM employees WHERE position_title LIKE '%Superintendent%'"
        );
        console.log("\nSUPERINTENDENT EMPLOYEES:");
        console.log(JSON.stringify(emp, null, 2));

        // Also check users with email containing triambulo or role staff/admin
        const [users] = await db.query(
            "SELECT id, full_name, email, role FROM users WHERE full_name LIKE '%Triambulo%' OR full_name LIKE '%Felix%'"
        );
        console.log("\nUSERS (Felix/Triambulo):");
        console.log(JSON.stringify(users, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
main();
