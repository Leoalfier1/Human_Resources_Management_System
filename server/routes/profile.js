const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/authMiddleware');

router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const { fullName, mobile } = req.body;
    await db.query('UPDATE users SET full_name = ?, mobile = ? WHERE id = ?', [fullName, mobile, req.user.id]);
    res.json({ message: 'Profile updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, full_name, email, mobile, role, applicant_type FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
