const db = require('./db');

async function verifyTeacher() {
  try {
    const [emp] = await db.query("SELECT e.id as emp_id, e.name, e.position, e.unit, i.id as ipcrf_id FROM employees e JOIN ipcrf i ON e.id = i.employee_id WHERE e.email = 'teacher@deped.gov.ph'");
    console.log('TEACHER PROFILE:', emp[0]);

    const [objs] = await db.query('SELECT sequence_no, objective_description, weight_percent FROM ipcrf_objectives WHERE ipcrf_id = ? ORDER BY sequence_no ASC', [emp[0].ipcrf_id]);
    console.log(`TEACHER PPST OBJECTIVES COUNT: ${objs.length}`);
    console.log('PPST OBJECTIVES SAMPLES:', objs.slice(0, 5));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

verifyTeacher();
