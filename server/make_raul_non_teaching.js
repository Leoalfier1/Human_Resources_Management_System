const db = require('./db');

async function makeRaulNonTeaching() {
  try {
    // 1. Update Raul's employee record to Non-Teaching (Administrative Officer V)
    await db.query(`
      UPDATE employees 
      SET position = 'Administrative Officer V',
          unit = 'Finance & Administrative Division',
          plantilla_item_number = 'AOV-52-001',
          form_type = 'IPCRF (Non-Teaching)',
          employee_type = 'non-teaching'
      WHERE id = 2 OR email = 'kadongtata1975@gmail.com'
    `);
    console.log("✓ Updated Raul M. Colot Jr. profile to Administrative Officer V (Non-Teaching)");

    // 2. Fetch Non-Teaching KRA templates
    const [nonTeachingKras] = await db.query(
      "SELECT * FROM kra_templates WHERE position_type = 'non_teaching' ORDER BY sort_order ASC"
    );

    const nonTeachingObjectives = [
      {
        kra: 'Basic Education Support & Frontline Service Delivery',
        desc: 'Execute daily administrative, document processing, and customer support services in compliance with ARTA and DepEd Service Standards',
        indicator: '100% of client requests, communications, and transactions processed within prescribed turnaround times',
        target: 'Process 500+ administrative requests and communications with 100% compliance with DepEd Citizen\'s Charter timelines'
      },
      {
        kra: 'Human Resource & Personnel Records Management',
        desc: 'Manage personnel records, SALN filings, service cards, leave applications, and 201 files of division employees',
        indicator: '100% of personnel files updated and archived in accordance with CSC and DepEd records management policies',
        target: 'Maintain 100% updated 201 files for 487 division employees with zero unarchived personnel documents by Q3 2026'
      },
      {
        kra: 'Financial, Procurement & Supply Operations',
        desc: 'Facilitate timely preparation of disbursement vouchers, purchase requests, supply inventories, and financial liquidations',
        indicator: '100% of procurement documents and financial vouchers processed with zero audit findings from COA',
        target: 'Process 150+ financial vouchers and conduct quarterly physical inventory count of division equipment with zero COA disallowances'
      },
      {
        kra: 'Governance, ISO & PRIME-HRM Compliance',
        desc: 'Ensure organizational compliance with PRIME-HRM Level II, ISO 9001:2015 Quality Management, and office performance standards',
        indicator: '100% compliance with PRIME-HRM documentary requirements and internal quality audit standards',
        target: 'Achieve 100% PRIME-HRM Level II evidence submission and pass annual ISO Quality Management System audit'
      },
      {
        kra: 'Client Feedback & Customer Satisfaction',
        desc: 'Monitor client satisfaction feedback and resolve customer complaints and frontline inquiries efficiently',
        indicator: 'Maintain a 98% or higher Very Satisfactory client satisfaction rating on division frontline services',
        target: 'Collect 200+ Client Satisfaction Measurement (CSM) feedback forms with 98%+ positive rating'
      }
    ];

    // 3. Clear existing ipcrf_objectives for Raul's IPCRF (id = 1)
    await db.query('DELETE FROM ipcrf_objectives WHERE ipcrf_id = 1');

    // 4. Insert Non-Teaching Objectives into ipcrf_objectives
    for (let i = 0; i < nonTeachingObjectives.length; i++) {
      const obj = nonTeachingObjectives[i];
      const kraTemplate = nonTeachingKras.find(k => k.kra_name === obj.kra) || nonTeachingKras[i];
      const kraTemplateId = kraTemplate ? kraTemplate.id : (i + 6);

      await db.query(`
        INSERT INTO ipcrf_objectives 
          (ipcrf_id, kra_template_id, sequence_no, objective_description, success_indicator, target_statement, weight_percent, actual_accomplishment) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [1, kraTemplateId, i + 1, obj.desc, obj.indicator, obj.target, kraTemplate ? kraTemplate.weight_percent : 20, obj.target]);
    }
    console.log("✓ Updated IPCRF objectives to Non-Teaching KRAs (100% total weight)");

    // 5. Reset IPCRF and performance commitments status
    await db.query("UPDATE ipcrf SET status = 'not_submitted', ratee_signed = 0, rater_signed = 0, signed_at = NULL WHERE id = 1");
    await db.query("UPDATE performance_commitments SET status = 'draft', position_type = 'non_teaching' WHERE employee_id = 2");
    
    console.log("✅ Successfully transformed Raul M. Colot Jr. to Non-Teaching Personnel with real Non-Teaching IPCRF!");
  } catch (err) {
    console.error("❌ Failed to update Raul profile:", err);
  } finally {
    process.exit(0);
  }
}

makeRaulNonTeaching();
