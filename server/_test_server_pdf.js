const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const server = spawn('node', ['index.js'], {
    cwd: path.join(__dirname),
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
server.stdout.on('data', d => {
    const s = d.toString();
    output += s;
    process.stdout.write(s);
});
server.stderr.on('data', d => {
    const s = d.toString();
    output += s;
    process.stderr.write(s);
});

function waitForServer(pattern, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = setInterval(() => {
            if (output.includes(pattern)) { clearInterval(check); resolve(); }
            if (Date.now() - start > timeout) { clearInterval(check); reject(new Error('Server startup timeout')); }
        }, 500);
    });
}

function fetchPdf(appId) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost', port: 3001,
            path: `/api/rsp/initial-evaluation/${appId}/annex-e/pdf`,
            method: 'GET'
        }, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        });
        req.on('error', reject);
        req.end();
    });
}

function countPages(buf) {
    const str = buf.toString('latin1');
    const matches = str.match(/\/Type\s*\/Page\s*$/gm);
    return matches ? matches.length : 0;
}

async function main() {
    try {
        await waitForServer('Listening on port', 20000);
        console.log('\n=== Server is up, testing Annex E PDFs ===\n');

        const testCases = [
            { appId: '5', label: '4 QS rows (fallback), qualified' },
            { appId: '1', label: '2 QS rows, disqualified' },
            { appId: '2', label: '4 QS rows (fallback), qualified' },
        ];

        for (const tc of testCases) {
            const buf = await fetchPdf(tc.appId);
            const pageCount = countPages(buf);
            const outFile = path.join(__dirname, `..\\test_annex_e_${tc.appId}.pdf`);
            fs.writeFileSync(outFile, buf);
            console.log(`App ${tc.appId} (${tc.label}):`);
            console.log(`  Pages: ${pageCount} ${pageCount === 1 ? '✓ ONE PAGE' : '⚠️ FAIL: ' + pageCount + ' pages'}`);
            console.log(`  Size: ${(buf.length / 1024).toFixed(1)}KB`);
        }
    } catch (err) {
        console.error('Test error:', err.message);
    } finally {
        server.kill();
        process.exit(0);
    }
}

main();
