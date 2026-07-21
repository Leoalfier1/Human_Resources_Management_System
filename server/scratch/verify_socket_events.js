const fs = require('fs');
const path = require('path');

console.log('--- AUDITING SERVER CONTROLLERS FOR SOCKET EMITS ---');

const controllersDir = path.join(__dirname, '../controllers/personnel');
const files = fs.readdirSync(controllersDir);

const expectedEvents = [
  'personnel:update',
  'personnel:employee:update',
  'personnel:profile-change:update',
  'personnel:leave:update',
  'personnel:travel:update',
  'personnel:document:update',
  'personnel:certificate:update',
  'personnel:notification:update'
];

const foundEvents = new Set();

files.forEach(file => {
  if (file.endsWith('.js')) {
    const content = fs.readFileSync(path.join(controllersDir, file), 'utf8');
    expectedEvents.forEach(evt => {
      if (content.includes(`'${evt}'`) || content.includes(`"${evt}"`)) {
        foundEvents.add(evt);
        console.log(`✅ [${file}] emits '${evt}'`);
      }
    });
  }
});

console.log('\n--- AUDITING CLIENT HOOKS & SCREENS FOR SOCKET LISTENERS ---');

const clientSrc = path.join(__dirname, '../../client/src');
function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('usePersonnelRealtime')) {
        console.log(`📡 [${path.relative(clientSrc, fullPath)}] imports & uses usePersonnelRealtime`);
      }
    }
  }
}

scanDir(clientSrc);

console.log('\n--- VERIFICATION SUMMARY ---');
console.log(`Total expected event types covered: ${foundEvents.size} / ${expectedEvents.length}`);
if (foundEvents.size === expectedEvents.length) {
  console.log('SUCCESS: All 8 target personnel real-time events are actively emitted by server controllers!');
} else {
  console.log('WARNING: Some events were not found in scan:', expectedEvents.filter(e => !foundEvents.has(e)));
}
