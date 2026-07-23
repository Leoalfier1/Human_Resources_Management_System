const db = require('./db');

async function fixAndSeed() {
  try {
    await db.query("ALTER TABLE kra_templates MODIFY COLUMN position_type ENUM('teaching', 'non_teaching', 'teaching_related') DEFAULT 'non_teaching'");
    console.log("✅ Altered kra_templates position_type column to include 'teaching_related'!");

    await db.query('DELETE FROM kra_templates');
    const periodId = 1;
    const templates = [
      // 1. Teaching-Related Track
      { pos: 'teaching_related', name: 'Technical Assistance & Instructional Supervision', weight: 25, sort: 1 },
      { pos: 'teaching_related', name: 'Learning Resources Development & LRMDS Quality Assurance', weight: 20, sort: 2 },
      { pos: 'teaching_related', name: 'Curriculum Assessment & Program Evaluation', weight: 20, sort: 3 },
      { pos: 'teaching_related', name: 'Action Research & Continuous Improvement', weight: 20, sort: 4 },
      { pos: 'teaching_related', name: 'Stakeholder Engagement & Community Partnership', weight: 15, sort: 5 },

      // 2. Non-Teaching Track
      { pos: 'non_teaching', name: 'Basic Education Support & Frontline Service Delivery', weight: 25, sort: 1 },
      { pos: 'non_teaching', name: 'Human Resource & Personnel Records Management', weight: 20, sort: 2 },
      { pos: 'non_teaching', name: 'Financial, Procurement & Supply Operations', weight: 20, sort: 3 },
      { pos: 'non_teaching', name: 'Governance, ISO & PRIME-HRM Compliance', weight: 20, sort: 4 },
      { pos: 'non_teaching', name: 'Client Feedback & Customer Satisfaction', weight: 15, sort: 5 },

      // 3. Teaching Track
      { pos: 'teaching', name: 'Content Knowledge and Pedagogy (PPST Domain 1)', weight: 25, sort: 1 },
      { pos: 'teaching', name: 'Learning Environment & Diversity of Learners (PPST Domain 2 & 3)', weight: 25, sort: 2 },
      { pos: 'teaching', name: 'Curriculum and Planning (PPST Domain 4)', weight: 20, sort: 3 },
      { pos: 'teaching', name: 'Assessment and Reporting (PPST Domain 5)', weight: 20, sort: 4 },
      { pos: 'teaching', name: 'Community Linkages & Plus Factor (PPST Domain 6 & 7)', weight: 10, sort: 5 }
    ];

    for(let t of templates) {
      await db.query(
        'INSERT INTO kra_templates (rating_period_id, kra_name, weight_percent, sort_order, position_type) VALUES (?, ?, ?, ?, ?)',
        [periodId, t.name, t.weight, t.sort, t.pos]
      );
    }
    console.log('✅ Seeded master KRA templates for all 3 DepEd tracks!');
  } catch(err) {
    console.error('❌ Error:', err);
  } finally {
    process.exit(0);
  }
}

fixAndSeed();
