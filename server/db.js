const mysql = require('mysql2');
require('dotenv').config();

// We use a "Pool" because it is better for handling multiple users
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to Laragon MySQL Database!');
        connection.release();
    }
});

module.exports = pool.promise();