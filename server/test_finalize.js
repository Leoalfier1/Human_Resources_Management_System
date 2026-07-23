const http = require('http');

async function testFinalize() {
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

  console.log("Logged in successfully!");

  const finalizeData = JSON.stringify({
    rater_signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  });

  const finalizeOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/pm/review/commitment/2/finalize',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(finalizeData),
      'Authorization': `Bearer ${token}`
    }
  };

  await new Promise((resolve, reject) => {
    const req = http.request(finalizeOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log("Response Status:", res.statusCode);
        console.log("Response Body:", data);
        resolve();
      });
    });
    req.on('error', reject);
    req.write(finalizeData);
    req.end();
  });
}

testFinalize().catch(console.error);
