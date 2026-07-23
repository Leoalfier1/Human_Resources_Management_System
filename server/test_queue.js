const http = require('http');

async function checkQueue() {
  const loginData = JSON.stringify({
    identifier: 'jay.montealto@deped.gov.ph',
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

  console.log("Logged in as admin successfully!");

  // Call /api/pm/review/queue
  const callQueue = (url) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: url,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        });
      });
      req.on('error', reject);
      req.end();
    });
  };

  const resAll = await callQueue('/api/pm/review/queue?position_type=all');
  console.log("\n--- Queue without period_id ---");
  console.log("Status:", resAll.status);
  console.log("Queue size:", resAll.body.length);
  console.log("Queue items:", resAll.body);

  const resP1 = await callQueue('/api/pm/review/queue?position_type=all&period_id=1');
  console.log("\n--- Queue with period_id=1 ---");
  console.log("Status:", resP1.status);
  console.log("Queue size:", resP1.body.length);
  console.log("Queue items:", resP1.body);
}

checkQueue().catch(console.error);
