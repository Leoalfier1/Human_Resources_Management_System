const db = require('../db');
setTimeout(async () => {
    const [view] = await db.query('SELECT COUNT(*) as c FROM v_appointed_employees');
    console.log('v_appointed_employees total:', view[0].c);
    
    const [active] = await db.query('SELECT COUNT(*) as c FROM v_appointed_employees WHERE is_active = 1');
    console.log('v_appointed_employees where is_active=1:', active[0].c);
    
    const [all] = await db.query('SELECT id, employee_no, is_active, first_name, last_name FROM v_appointed_employees');
    all.forEach(r => console.log(JSON.stringify(r)));
    
    process.exit(0);
}, 5000);
