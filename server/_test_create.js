const http = require('http');

async function login() {
    const body = JSON.stringify({ identifier: 'admin@depedhrmis.test', password: 'password123', loginType: 'staff' });
    return new Promise((resolve, reject) => {
        const req = http.request('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function createEmployee(token) {
    const boundary = '----TestBoundary123';
    const fields = {
        user_id: '15',
        employee_no: 'EMP-TEST-004',
        first_name: 'Maria',
        middle_name: '',
        last_name: 'Clara',
        name_extension: '',
        date_of_birth: '',
        place_of_birth: '',
        sex: 'female',
        civil_status: 'single',
        blood_type: '',
        gsis_id: '',
        pagibig_id: '',
        philhealth_no: '',
        tin_no: '',
        mobile_no: '09171234567',
        email: 'maria@test.com',
        address: '',
        employment_status: 'permanent',
        employment_type: 'teaching',
        position_title: 'Teacher I',
        salary_grade: '11',
        authorized_salary: '',
        actual_salary: '',
        monthly_salary: '',
        salary_step: '',
        eligibility: '',
        item_number: '',
        assigned_school: '',
        office: '',
        job_status: 'active',
        school_office_id: '',
        date_hired: '2026-07-28',
        date_original_appointment: ''
    };

    let parts = [];
    for (const [key, val] of Object.entries(fields)) {
        parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`);
    }
    const body = parts.join('') + `--${boundary}--\r\n`;

    return new Promise((resolve, reject) => {
        const req = http.request('http://localhost:5000/api/personnel/employees', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(body)
            }
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                console.log('Status:', res.statusCode);
                try { console.log('Response:', JSON.parse(data)); } catch(e) { console.log('Raw:', data); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

(async () => {
    try {
        const loginRes = await login();
        const token = loginRes.data?.token || loginRes.token;
        if (!token) { console.log('Login failed:', JSON.stringify(loginRes)); process.exit(1); }
        console.log('Got token');
        await createEmployee(token);
    } catch (e) { console.error(e); }
    process.exit(0);
})();
