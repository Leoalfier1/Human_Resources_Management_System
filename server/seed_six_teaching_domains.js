const db = require('./db');

async function seedSixTeachingDomains() {
  console.log('⏳ Updating Teaching KRA templates & objectives to match 6 DepEd PPST Domains...');
  try {
    const periodId = 1;

    // 1. Delete existing teaching KRA templates
    await db.query("DELETE FROM kra_templates WHERE position_type = 'teaching'");

    // 2. Insert the 6 exact DepEd PPST Domains from the image
    const domains = [
      { name: 'Content Knowledge and Pedagogy', weight: 20.358, sort: 1 },
      { name: 'Learning Environment', weight: 13.572, sort: 2 },
      { name: 'Diversity of Learners', weight: 6.786, sort: 3 },
      { name: 'Curriculum and Planning', weight: 20.358, sort: 4 },
      { name: 'Assessment and Reporting', weight: 20.358, sort: 5 },
      { name: 'Personal Growth and Professional Development', weight: 18.568, sort: 6 }
    ];

    const domainMap = {};
    for (const d of domains) {
      const [res] = await db.query(
        'INSERT INTO kra_templates (rating_period_id, kra_name, weight_percent, sort_order, position_type) VALUES (?, ?, ?, ?, ?)',
        [periodId, d.name, d.weight, d.sort, 'teaching']
      );
      domainMap[d.name] = res.insertId;
    }
    console.log('✓ Created 6 PPST Teaching KRA Templates in database.');

    // 3. Fetch Arniel M. Banawa IPCRF ID
    const [emp] = await db.query("SELECT e.id as emp_id, i.id as ipcrf_id FROM employees e JOIN ipcrf i ON e.id = i.employee_id WHERE e.email = 'teacher@deped.gov.ph'");
    if (emp.length === 0) throw new Error("Teacher account teacher@deped.gov.ph not found!");
    const ipcrfId = emp[0].ipcrf_id;

    // 4. Delete existing ipcrf_objectives for teacher
    await db.query('DELETE FROM ipcrf_objectives WHERE ipcrf_id = ?', [ipcrfId]);

    // 5. Insert the 14 PPST Objectives mapped to the 6 Domains
    const objectives14 = [
      // Domain 1: Content Knowledge and Pedagogy
      { 
        domain: 'Content Knowledge and Pedagogy', 
        desc: '1. Applied knowledge of content within and across curriculum teaching areas (PPST 1.1.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in the COT rating sheet / interobserver agreement form presented', 
        target: 'Achieve Level 6 COT rating across 4 classroom observation periods', 
        weight: 7.14, selfRating: 5 
      },
      { 
        domain: 'Content Knowledge and Pedagogy', 
        desc: '2. Used a range of teaching strategies that enhance learner achievement in literacy and numeracy skills (PPST 1.4.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Implement literacy and numeracy intervention plans with 100% target achievement', 
        weight: 7.14, selfRating: 5 
      },
      { 
        domain: 'Content Knowledge and Pedagogy', 
        desc: '3. Applied a range of teaching strategies to develop critical and creative thinking, as well as other higher-order thinking skills (PPST 1.5.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Incorporate HOTS questions in 100% of Daily Lesson Logs (DLL)', 
        weight: 7.14, selfRating: 5 
      },

      // Domain 2: Learning Environment
      { 
        domain: 'Learning Environment', 
        desc: '4. Managed classroom structure to engage learners, individually or in groups, in meaningful exploration, discovery and hands-on activities (PPST 2.3.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Maintain 100% learner participation in interactive discovery activities', 
        weight: 7.14, selfRating: 5 
      },
      { 
        domain: 'Learning Environment', 
        desc: '5. Managed learner behavior constructively by applying positive and non-violent discipline to ensure learning-focused environments (PPST 2.6.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Zero corporal punishment complaints and 100% positive discipline compliance', 
        weight: 7.14, selfRating: 5 
      },

      // Domain 3: Diversity of Learners
      { 
        domain: 'Diversity of Learners', 
        desc: '6. Used differentiated, developmentally appropriate learning experiences to address learners gender, needs, strengths, interests and experiences (PPST 3.1.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Provide differentiated activities for 100% of diverse learners', 
        weight: 7.14, selfRating: 5 
      },

      // Domain 4: Curriculum and Planning
      { 
        domain: 'Curriculum and Planning', 
        desc: '7. Planned, managed and implemented developmentally sequenced teaching and learning processes to meet curriculum requirements and varied teaching contexts (PPST 4.1.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Submit 40 complete Daily Lesson Logs (DLL) aligned with MELCs', 
        weight: 7.14, selfRating: 5 
      },
      { 
        domain: 'Curriculum and Planning', 
        desc: '8. Participated in collegial discussions that use teacher and learner feedback to enrich teaching practice (PPST 4.4.2)', 
        indicator: 'Shared insights and suggestions on the effective use of teacher and learner feedback during LAC sessions/meetings/other collegial discussions to enrich teaching practice, as evidenced by MOV 3', 
        target: 'Participate in 4 division/school LAC sessions with documented outputs', 
        weight: 7.14, selfRating: 5 
      },
      { 
        domain: 'Curriculum and Planning', 
        desc: '9. Selected, developed, organized and used appropriate teaching and learning resources, including ICT, to address learning goals (PPST 4.5.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Develop and utilize 10 ICT-integrated learning materials', 
        weight: 7.14, selfRating: 5 
      },

      // Domain 5: Assessment and Reporting
      { 
        domain: 'Assessment and Reporting', 
        desc: '10. Designed, selected, organized and used diagnostic, formative and summative assessment strategies consistent with curriculum requirements (PPST 5.1.2)', 
        indicator: 'Demonstrated Level 6/7 in the PPST Indicator as shown in COT rating sheet / interobserver agreement form presented', 
        target: 'Administer 4 quarterly summative tests with completed item analysis', 
        weight: 7.14, selfRating: 5 
      },
      { 
        domain: 'Assessment and Reporting', 
        desc: '11. Monitored and evaluated learner progress and achievement using learner attainment data (PPST 5.2.2)', 
        indicator: 'Implemented the intervention plan based on learner attainment data, as evidenced by MOV 4', 
        target: 'Maintain 100% updated learner attainment data and progress monitoring sheets', 
        weight: 7.14, selfRating: 5 
      },
      { 
        domain: 'Assessment and Reporting', 
        desc: '12. Communicated promptly and clearly the learners needs, progress and achievement to key stakeholders, including parents/guardians (PPST 5.4.2)', 
        indicator: 'Secured commitment and agreement from key stakeholders, including parents/guardians, on the communicated learners needs, progress, and achievement, as evidenced by the MOV presented', 
        target: 'Conduct 4 quarterly parent-teacher conferences with signed report cards', 
        weight: 7.14, selfRating: 5 
      },

      // Domain 6: Personal Growth and Professional Development
      { 
        domain: 'Personal Growth and Professional Development', 
        desc: '13. Applied a personal philosophy of teaching that is learner-centered (PPST 7.1.2)', 
        indicator: 'Demonstrated a clear, theory-informed learner-centered philosophy that showed simple, specific and reflective annotations', 
        target: 'Submit teaching philosophy statement with reflective annotations', 
        weight: 7.16, selfRating: 5 
      },
      { 
        domain: 'Personal Growth and Professional Development', 
        desc: '14. Set professional development goals based on the Philippine Professional Standards for Teachers (PPST 7.5.2)', 
        indicator: 'Updated professional development goals during Phase II of the PMES Cycle as evidenced by MOV 4', 
        target: 'Complete annual e-SAT and Individual Development Plan (IPCRF-DP)', 
        weight: 7.16, selfRating: 5 
      }
    ];

    for (let i = 0; i < objectives14.length; i++) {
      const obj = objectives14[i];
      const kraTemplateId = domainMap[obj.domain];

      await db.query(
        'INSERT INTO ipcrf_objectives (ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, weight_percent, actual_accomplishment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [ipcrfId, kraTemplateId, i + 1, obj.desc, obj.indicator, obj.target, obj.weight, obj.target]
      );
    }

    console.log('✓ Inserted all 14 PPST Objectives mapped to the 6 Domains!');
    console.log('======================================================');
    console.log('✅ SUCCESS! All 6 DepEd PPST Domains applied to Teacher IPCRF.');
    console.log('======================================================');

  } catch (err) {
    console.error('❌ Failed to update 6 teaching domains:', err);
  } finally {
    process.exit(0);
  }
}

seedSixTeachingDomains();
