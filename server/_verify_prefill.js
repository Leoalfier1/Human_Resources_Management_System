require('dotenv').config();
const http = require('http');

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
    // Login as admin
    const login = await api('POST', '/api/auth/login', { identifier: 'admin@depedhrmis.test', password: 'password123', loginType: 'staff' });
    const token = login.body.token;
    console.log('Login:', login.status, login.body.user?.fullName);

    // V3.1: Get qualified applicants
    console.log('\n=== V3.1: GET /api/personnel/employees/qualified-applicants ===');
    const qa = await api('GET', '/api/personnel/employees/qualified-applicants', null, token);
    console.log('Status:', qa.status);
    if (Array.isArray(qa.body)) {
        console.log('Count:', qa.body.length);
        for (const a of qa.body) {
            console.log(`  user_id=${a.user_id} name="${a.full_name}" position="${a.vacancy_position}" status=${a.app_status} pds=${a.pds_status}`);
        }
    } else {
        console.log('Response:', JSON.stringify(qa.body));
    }

    // V3.2: Get prefill data for each qualified applicant
    if (Array.isArray(qa.body) && qa.body.length > 0) {
        const firstUserId = qa.body[0].user_id;
        console.log(`\n=== V3.2: GET /api/personnel/employees/prefill/${firstUserId} ===`);
        const pf = await api('GET', `/api/personnel/employees/prefill/${firstUserId}`, null, token);
        console.log('Status:', pf.status);
        if (pf.status === 200) {
            const fields = ['user_id','first_name','last_name','sex','civil_status','blood_type',
                'mobile_no','email','gsis_id','pagibig_id','philhealth_no','tin_no',
                'position_title','salary_grade','item_number','assigned_school','eligibility','address'];
            for (const f of fields) {
                console.log(`  ${f}: ${JSON.stringify(pf.body[f])}`);
            }
        }
    }

    // V3.3: Verify non-qualified applicant does NOT appear
    console.log('\n=== V3.3: Confirm disqualified applicants are excluded ===');
    // user_id=5 has application with status='disqualified'
    const hasDisqualified = qa.body?.some(a => a.app_status === 'disqualified');
    console.log('Contains disqualified?', hasDisqualified, hasDisqualified ? 'FAIL' : 'PASS');

    process.exit(0);
})();
