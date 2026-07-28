// Count the ? placeholders and values in the logged SQL
const sql = `VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
const qCount = (sql.match(/\?/g)||[]).length;

// Values from the error log
const valsStr = "'15','EMP-TEST-004','Maria',NULL,'Clara',NULL,NULL,NULL,'female','single',NULL,NULL,NULL,NULL,NULL,'09171234567','maria@test.com',NULL,NULL,'permanent','teaching','Teacher I','11',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL";

// Split properly - commas NOT inside quotes
let count = 0;
let inQuote = false;
for (let i = 0; i < valsStr.length; i++) {
    if (valsStr[i] === "'") { inQuote = !inQuote; }
    if (valsStr[i] === ',' && !inQuote) count++;
}
console.log('? count:', qCount);
console.log('Values count:', count + 1);
console.log('Columns: 35');
