const db = require('../db');

async function main() {
    try {
        const [desc] = await db.query("DESCRIBE employees");
        console.log("COLUMNS:");
        console.log(desc.map(c => c.Field));
        const [rows] = await db.query("SELECT item_number, position_title, assigned_school FROM employees WHERE item_number IS NOT NULL AND item_number != '' LIMIT 10");
        console.log("EMPLOYEE ITEM NUMBERS:");
        console.log(rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
