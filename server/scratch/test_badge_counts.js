/**
 * Test script to verify the badge-counts API endpoint
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function main() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'deped_hrmis',
    });

    console.log('Testing DB queries for badge-counts:');

    const [profileRows] = await db.query("SELECT COUNT(*) as count FROM employee_profile_change_requests WHERE status = 'pending'");
    const [leaveRows]   = await db.query("SELECT COUNT(*) as count FROM leave_applications WHERE status IN ('pending', 'recommended')");
    const [docRows]     = await db.query("SELECT COUNT(*) as count FROM document_requests WHERE status = 'pending'");

    const counts = {
        pending_profile_changes: profileRows[0]?.count ?? 0,
        pending_leave: leaveRows[0]?.count ?? 0,
        pending_documents: docRows[0]?.count ?? 0,
    };

    console.log('Badge counts output:', counts);
    await db.end();
}

main().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
