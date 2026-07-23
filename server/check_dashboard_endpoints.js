async function test() {
  const tokenRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'jay.montealto@deped.gov.ph', password: 'password123' })
  });
  const { token } = await tokenRes.json();
  console.log("Got token:", token ? "YES" : "NO");

  const urls = [
    'http://localhost:5000/api/pm/dashboard/stats',
    'http://localhost:5000/api/pm/dashboard/personnel-status',
    'http://localhost:5000/api/pm/dashboard/unit-completion',
    'http://localhost:5000/api/pm/dashboard/periods',
    'http://localhost:5000/api/pm/dashboard/ratings-distribution'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      console.log(`URL: ${url} -> Status: ${res.status}`);
      if (!res.ok) {
        const txt = await res.text();
        console.log("  Error body:", txt);
      } else {
        const json = await res.json();
        console.log("  Success body keys/length:", Array.isArray(json) ? `Array of length ${json.length}` : Object.keys(json));
      }
    } catch (e) {
      console.error(`URL: ${url} failed with error:`, e.message);
    }
  }
}

test();
