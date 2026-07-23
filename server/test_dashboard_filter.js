const db = require('./db');

async function testDashboardFilter() {
  const query = `
    SELECT e.id, e.name, e.position, e.unit, e.email, 
           pc.status as commitment_status,
           i.status as ipcrf_status,
           pc.final_rating_submitted_at,
           CASE 
             WHEN CAST(COALESCE(pc.overall_weighted_score, 0) AS DECIMAL(5,4)) > 0 
             THEN CAST(pc.overall_weighted_score AS DECIMAL(5,4))
             ELSE 5.0000 
           END as rating
    FROM employees e
    LEFT JOIN ipcrf i ON e.id = i.employee_id AND i.rating_period_id = (SELECT id FROM rating_periods WHERE is_active = 1 LIMIT 1)
    LEFT JOIN performance_commitments pc ON e.id = pc.employee_id AND pc.rating_period_id = (SELECT id FROM rating_periods WHERE is_active = 1 LIMIT 1)
    WHERE e.role = 'employee'
      AND (pc.final_rating_submitted_at IS NOT NULL OR pc.status IN ('committed', 'approved', 'finalized') OR i.status = 'finalized')
    ORDER BY e.name ASC
  `;

  const [rows] = await db.query(query);
  console.log('APPROVED & LOCKED EMPLOYEES FOR PM DASHBOARD:', rows);
  process.exit(0);
}

testDashboardFilter();
