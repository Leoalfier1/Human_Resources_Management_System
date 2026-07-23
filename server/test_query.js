const db = require('./db');

async function testQuery() {
  const query = `
    SELECT pc.id as commitment_id, pc.employee_id,
           CASE 
             WHEN CAST(COALESCE(pc.overall_weighted_score, 0) AS DECIMAL(5,4)) > 0 
             THEN CAST(pc.overall_weighted_score AS DECIMAL(5,4))
             ELSE 5.0000 
           END as overall_weighted_score,
           CASE 
             WHEN (CASE WHEN CAST(COALESCE(pc.overall_weighted_score, 0) AS DECIMAL(5,4)) > 0 THEN CAST(pc.overall_weighted_score AS DECIMAL(5,4)) ELSE 5.0000 END) >= 4.5 THEN 'Outstanding'
             WHEN (CASE WHEN CAST(COALESCE(pc.overall_weighted_score, 0) AS DECIMAL(5,4)) > 0 THEN CAST(pc.overall_weighted_score AS DECIMAL(5,4)) ELSE 5.0000 END) >= 3.5 THEN 'Very Satisfactory'
             WHEN (CASE WHEN CAST(COALESCE(pc.overall_weighted_score, 0) AS DECIMAL(5,4)) > 0 THEN CAST(pc.overall_weighted_score AS DECIMAL(5,4)) ELSE 5.0000 END) >= 2.5 THEN 'Satisfactory'
             WHEN (CASE WHEN CAST(COALESCE(pc.overall_weighted_score, 0) AS DECIMAL(5,4)) > 0 THEN CAST(pc.overall_weighted_score AS DECIMAL(5,4)) ELSE 5.0000 END) >= 1.5 THEN 'Unsatisfactory'
             ELSE 'Outstanding'
           END as adjectival_rating,
           e.name as employee_name
    FROM performance_commitments pc
    JOIN employees e ON pc.employee_id = e.id
  `;

  const [rows] = await db.query(query);
  console.log('RESULTS:', rows);
  process.exit(0);
}

testQuery();
