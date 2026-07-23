const db = require('./db');

async function testRaw() {
  try {
    let query = `
        SELECT pc.*, e.name as employee_name, e.position as employee_position, e.unit as employee_unit
        FROM performance_commitments pc
        JOIN employees e ON pc.employee_id = e.id
        LEFT JOIN ipcrf i ON pc.employee_id = i.employee_id AND pc.rating_period_id = i.rating_period_id
        WHERE (
            (pc.final_rating_submitted_at IS NULL AND (pc.status IN ('submitted', 'under_review', 'needs_revision') OR i.status IN ('submitted', 'under_review', 'needs_revision', 'reviewed')))
    `;
    
    // Add include_id check matching review.js
    const include_id = undefined;
    if (include_id) {
        query += ` OR pc.id = ?`;
    }
    query += `)`;

    // Add rating_period_id filter
    const targetPeriodId = 1;
    const params = [];
    if (targetPeriodId) {
        query += ` AND pc.rating_period_id = ?`;
        params.push(targetPeriodId);
    }
    query += ` ORDER BY COALESCE(pc.rater_rating_submitted_at, pc.submitted_at) ASC`;

    console.log("Executing SQL Query:\n", query);
    console.log("With parameters:", params);

    const [rows] = await db.query(query, params);
    console.log("SQL Query Result:", rows);
  } catch (err) {
    console.error("SQL Error:", err);
  } finally {
    process.exit(0);
  }
}

testRaw();
