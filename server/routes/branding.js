const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/settings', async (req, res) => {
    const [rows] = await db.query("SELECT * FROM settings LIMIT 1");
    res.json(rows[0]);
});

module.exports = router;