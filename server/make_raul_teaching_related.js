const db = require('./db');

async function makeRaulTeachingRelated() {
  try {
    // 1. Update Raul's employee record to Teaching-Related (Education Program Specialist II)
    await db.query(`
      UPDATE employees 
      SET position = 'Education Program Specialist II',
          unit = 'Curriculum Implementation Division',
          plantilla_item_number = 'EPS2-52-009',
          form_type = 'IPCRF (Teaching-Related)',
          employee_type = 'teaching_related'
      WHERE id = 2 OR email = 'kadongtata1975@gmail.com'
    `);
    console.log("✓ Updated Raul M. Colot Jr. profile to Education Program Specialist II (Teaching-Related)");

    // 2. Fetch Teaching-Related KRA templates
    const [trKras] = await db.query(
      "SELECT * FROM kra_templates WHERE position_type = 'teaching_related' ORDER BY sort_order ASC"
    );

    const trObjectives = [
      {
        kra: 'Technical Assistance & Instructional Supervision',
        desc: 'Provide Technical Assistance (TA) and Instructional Supervision to school heads and teachers on curriculum contextualization and learning area delivery',
        indicator: '100% of targeted schools provided with technical assistance reports, instructional supervision notes, and intervention plans',
        target: 'Conduct quarterly instructional monitoring and TA visits across 52 assigned division schools with documented TA reports by December 2026'
      },
      {
        kra: 'Learning Resources Development & LRMDS Quality Assurance',
        desc: 'Manage the development, quality assurance, and contextualization of Learning Action Cell (LAC) sessions and DepEd LRMDS learning resources',
        indicator: '100% of submitted Learning Activity Sheets (LAS) and instructional modules quality-assured following DepEd LRMDS standards',
        target: 'Quality assure 25 CID learning resources and facilitate 4 division-wide LAC sessions for instructional leaders'
      },
      {
        kra: 'Curriculum Assessment & Program Evaluation',
        desc: 'Monitor, evaluate, and analyze division-wide curriculum program implementation and learning assessment results for CID reporting',
        indicator: '100% of learning assessment results analyzed with strategic intervention plans submitted to the CID Chief',
        target: 'Submit 4 quarterly Curriculum Assessment & Learning Achievement reports with zero delayed submissions'
      },
      {
        kra: 'Action Research & Continuous Improvement',
        desc: 'Facilitate action research initiatives, curriculum innovations, and PRIME-HRM alignment for CID teaching-related personnel',
        indicator: '100% of approved Division action research proposals monitored with completed progress reports and Zero CSC findings',
        target: 'Evaluate 10 school action research proposals and submit complete CID PRIME-HRM documentary requirements by Q4 2026'
      },
      {
        kra: 'Stakeholder Engagement & Community Partnership',
        desc: 'Convene quarterly CID Stakeholders Assemblies and foster strategic partnerships with LGUs and community partners for curriculum enrichment',
        indicator: '100% quarterly stakeholders assemblies convened with signed MOUs/MOAs for curriculum support programs',
        target: 'Organize 4 quarterly CID Stakeholders Assemblies with 100% LGU and community partner participation'
      }
    ];

    // 3. Clear existing ipcrf_objectives for Raul's IPCRF (id = 1)
    await db.query('DELETE FROM ipcrf_objectives WHERE ipcrf_id = 1');

    // 4. Insert Teaching-Related Objectives into ipcrf_objectives
    for (let i = 0; i < trObjectives.length; i++) {
      const obj = trObjectives[i];
      const kraTemplate = trKras.find(k => k.kra_name === obj.kra) || trKras[i];
      const kraTemplateId = kraTemplate ? kraTemplate.id : (i + 1);

      await db.query(`
        INSERT INTO ipcrf_objectives 
          (ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, weight_percent, actual_accomplishment) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [1, kraTemplateId, i + 1, obj.desc, obj.indicator, obj.target, kraTemplate ? kraTemplate.weight_percent : (i === 0 ? 25 : (i === 4 ? 15 : 20)), obj.target]);
    }
    console.log("✓ Updated IPCRF objectives to Teaching-Related KRAs (100% total weight)");

    // 5. Reset IPCRF and performance commitments status
    await db.query("UPDATE ipcrf SET status = 'not_submitted', ratee_signed = 0, rater_signed = 0, signed_at = NULL WHERE id = 1");
    await db.query("UPDATE performance_commitments SET status = 'draft', position_type = 'teaching_related' WHERE employee_id = 2");
    
    console.log("✅ Successfully transformed Raul M. Colot Jr. to Teaching-Related Personnel with real Teaching-Related IPCRF!");
  } catch (err) {
    console.error("❌ Failed to update Raul profile:", err);
  } finally {
    process.exit(0);
  }
}

makeRaulTeachingRelated();
