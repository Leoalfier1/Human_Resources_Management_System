const http = require('http');
const db = require('./db');

async function loginAndUnsubmit() {
  // Reset IPCRF to submitted state for the HTTP test
  console.log("Setting IPCRF ID 1 status to 'submitted' in DB...");
  await db.query("UPDATE ipcrf SET status = 'submitted' WHERE id = 1");
  await db.query("UPDATE performance_commitments SET status = 'submitted' WHERE employee_id = 2");

  const loginData = JSON.stringify({
    identifier: 'kadongtata1975@gmail.com',
    password: 'password123',
    loginType: 'staff'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  const token = await new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const body = JSON.parse(data);
          if (body.token) resolve(body.token);
          else reject(new Error("Login failed: " + data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  console.log("Logged in successfully! Token received.");

  // Hit the unsubmit endpoint
  const unsubmitData = JSON.stringify({ ipcrf_id: 1 });
  const unsubmitOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/pm/employee/ipcrf/unsubmit',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(unsubmitData),
      'Authorization': `Bearer ${token}`
    }
  };

  await new Promise((resolve, reject) => {
    const req = http.request(unsubmitOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log("Response Status Code:", res.statusCode);
        console.log("Response Body:", data);
        resolve();
      });
    });
    req.on('error', reject);
    req.write(unsubmitData);
    req.end();
  });
}

loginAndUnsubmit().catch(console.error);
