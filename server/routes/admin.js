const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!['staff', 'admin', 'hr_staff', 'hrmpsb', 'appointing_authority'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, role, is_verified) VALUES (?, ?, ?, ?, TRUE)',
      [fullName, email, hashedPassword, role]
    );

    res.status(201).json({ message: `Account created: ${role}`, userId: result.insertId });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, full_name, email, role, is_verified, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
