require('dotenv').config();
const http = require('http');
const { execSync } = require('child_process');

function api(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: 'localhost', port: 5000, path, method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) opts.headers['Authorization'] = 'Bearer ' + token;
        const req = http.request(opts, res => {
            let buf = '';
            res.on('data', c => buf += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
                catch { resolve({ status: res.statusCode, body: buf }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

(async () => {
    const login = await api('POST', '/api/auth/login', { identifier: 'admin@depedhrmis.test', password: 'password123', loginType: 'staff' });
    const token = login.body.token;

    // Get prefill for user 9 (Juan Santos)
    console.log('=== Pre-creation: fetch prefill for user 9 ===');
    const pf = await api('GET', '/api/personnel/employees/prefill/9', null, token);
    console.log('Prefill:', JSON.stringify({
        first_name: pf.body.first_name, last_name: pf.body.last_name,
        position_title: pf.body.position_title, salary_grade: pf.body.salary_grade,
    }, null, 2));

    // Create employee via curl multipart (multer requires multipart/form-data)
    console.log('\n=== Creating employee for user 9 (Juan Santos) via multipart ===');
    const curlCmd = `curl -s -X POST http://localhost:5000/api/personnel/employees ` +
        `-H "Authorization: Bearer ${token}" ` +
        `-F "user_id=9" ` +
        `-F "employee_no=EMP-TEST-001" ` +
        `-F "first_name=${pf.body.first_name || 'Juan'}" ` +
        `-F "middle_name=${pf.body.middle_name || ''}" ` +
        `-F "last_name=${pf.body.last_name || 'Santos'}" ` +
        `-F "position_title=${pf.body.position_title || 'Teacher I'}" ` +
        `-F "salary_grade=${pf.body.salary_grade || '11'}" ` +
        `-F "item_number=${pf.body.item_number || ''}" ` +
        `-F "employment_type=${pf.body.employment_type || 'teaching'}" ` +
        `-F "employment_status=permanent" ` +
        `-F "job_status=active" ` +
        `-F "date_hired=2026-07-28"`;

    const createResult = execSync(curlCmd, { encoding: 'utf8', timeout: 15000 });
    const create = JSON.parse(createResult);
    console.log('Create status:', create.id ? 201 : 500, JSON.stringify(create));

    if (create.id) {
        const empId = create.id;

        // V3.4: Employee record check
        console.log('\n=== V3.4: Employee record check ===');
        const emp = await api('GET', `/api/personnel/employees/${empId}`, null, token);
        console.log('  employee_no:', emp.body.employee_no);
        console.log('  position_title:', emp.body.position_title);
        console.log('  first_name:', emp.body.first_name);
        console.log('  last_name:', emp.body.last_name);
        console.log('  V3.4 PASS:', emp.body.employee_no && emp.body.position_title ? 'YES' : 'NO');

        // V3.5: Employee Directory check
        console.log('\n=== V3.5: Employee Directory check ===');
        const dir = await api('GET', '/api/personnel/employees?search=Santos', null, token);
        const dirEmp = dir.body?.employees?.find(e => e.user_id === 9);
        console.log('  Found in directory?', !!dirEmp, dirEmp ? `(employee_no=${dirEmp.employee_no})` : '');
        console.log('  V3.5 PASS:', dirEmp ? 'YES' : 'NO');

        // V3.6: Gone from qualified-applicants
        console.log('\n=== V3.6: Gone from qualified-applicants list ===');
        const qa2 = await api('GET', '/api/personnel/employees/qualified-applicants', null, token);
        const stillQualified = qa2.body?.some(a => a.user_id === 9);
        console.log('  Still in list?', stillQualified, stillQualified ? 'FAIL' : 'PASS');

        // Cleanup: archive the test employee
        console.log('\n=== Cleanup: archiving test employee ===');
        const archive = await api('PATCH', `/api/personnel/employees/${empId}/archive`, {}, token);
        console.log('  Archive status:', archive.status);
    }

    process.exit(0);
})();
